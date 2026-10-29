"""Integration with packages/genai, with GloVe and MiniLM replaced by fakes."""

import numpy as np
import pytest
from fastapi.testclient import TestClient

from algo_server.embeddings_routes import (
    INDEXES,
    get_sentence_encoder,
    get_word_vectors,
)
from algo_server.main import app
from genai.search_corpus import DOCUMENTS
from genai.sentence_vectors import Inspection, Pooled, SentenceVector
from genai.vectors import cosine_scores, top_indices
from genai.word_vectors import (
    Analogy,
    MissingWord,
    MissingWords,
    Neighbor,
    NeighborSearch,
    WordLookup,
    WordVector,
)

VOCAB = {
    "king": [1.0, 0.0, 1.0],
    "queen": [0.0, 1.0, 1.0],
    "man": [1.0, 0.0, 0.0],
    "woman": [0.0, 1.0, 0.0],
    "dog": [-1.0, -1.0, 0.0],
}
WORDS = list(VOCAB)
MATRIX = np.array(list(VOCAB.values()))
NORMS = np.linalg.norm(MATRIX, axis=1)


class FakeWords:
    name = "fake-glove"
    dimensions = 3
    loaded = False

    def _indices(self, words):
        missing = [MissingWord(w, ["king"]) for w in words if w not in VOCAB]
        if missing:
            raise MissingWords(missing)
        return [WORDS.index(w) for w in words]

    def lookup(self, words):
        found = [
            WordVector(w, WORDS.index(w) + 1, VOCAB[w], float(NORMS[WORDS.index(w)]))
            for w in words
            if w in VOCAB
        ]
        return WordLookup(found, [MissingWord(w, ["king"]) for w in words if w not in VOCAB])

    def _rank(self, target, exclude, top_k):
        scores = cosine_scores(MATRIX, NORMS, target)
        return [
            Neighbor(WORDS[i], i + 1, round(float(scores[i]), 4))
            for i in top_indices(scores, k=top_k, exclude=set(exclude))
        ]

    def neighbors(self, word, *, top_k, vocab_limit):
        (i,) = self._indices([word])
        return NeighborSearch(word, MATRIX[i].tolist(), self._rank(MATRIX[i], [i], top_k))

    def analogy(self, positive, negative, *, top_k, vocab_limit):
        pos, neg = self._indices(positive), self._indices(negative)
        target = MATRIX[pos].sum(axis=0) - MATRIX[neg].sum(axis=0)
        return Analogy(positive, negative, target.tolist(), self._rank(target, pos + neg, top_k))


class FakeEncoder:
    name = "fake-minilm"
    dimensions = 4
    max_tokens = 256
    loaded = True

    def _vector(self, text):
        return [float(len(text)), float(text.count(" ")), float(sum(map(ord, text)) % 7), 1.0]

    def encode(self, texts, *, normalize=True):
        out = []
        for text in texts:
            v = np.array(self._vector(text))
            v = v / np.linalg.norm(v) if normalize else v
            out.append(SentenceVector(text, v.round(5).tolist(), len(text.split()) + 2, False))
        return out

    def inspect(self, text):
        vectors = [[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0], [0.0, 0.0, 1.0, 0.0]]
        return Inspection(
            tokens=["[CLS]", "hi", "[SEP]"],
            ids=[101, 7632, 102],
            attention_mask=[1, 1, 1],
            token_vectors=vectors,
            pooled=Pooled(
                mean=[0.3333] * 3 + [0.0],
                mean_normalized=[0.5774] * 3 + [0.0],
                cls=vectors[0],
                max=[1.0, 1.0, 1.0, 0.0],
            ),
            truncated=False,
        )


@pytest.fixture
def client():
    words, encoder = FakeWords(), FakeEncoder()
    app.dependency_overrides[get_word_vectors] = lambda: words
    app.dependency_overrides[get_sentence_encoder] = lambda: encoder
    INDEXES.clear()
    yield TestClient(app)
    app.dependency_overrides.clear()
    INDEXES.clear()


def test_models_lists_both_models_with_loaded_flags(client):
    models = client.get("/api/embeddings/models").json()["models"]
    assert [(m["id"], m["loaded"]) for m in models] == [
        ("glove-6b-300d", False),
        ("minilm-l6-v2", True),
    ]
    assert models[0]["supports_analogies"] and models[1]["dimensions"] == 384


def test_corpus_lists_every_document(client):
    docs = client.get("/api/embeddings/corpus").json()["documents"]
    assert len(docs) == len(DOCUMENTS)
    assert set(docs[0]) == {"id", "title", "category", "text"}


def test_words_returns_found_and_missing_with_200(client):
    r = client.post("/api/embeddings/words", json={"words": ["king", "kingz"]})
    body = r.json()
    assert r.status_code == 200
    assert (body["model"], body["dimensions"], body["normalized"]) == ("fake-glove", 3, False)
    assert body["found"] == [
        {"word": "king", "rank": 1, "vector": [1.0, 0.0, 1.0], "norm": 1.4142135623730951}
    ]
    assert body["missing"] == [{"word": "kingz", "suggestions": ["king"]}]


def test_words_rejects_out_of_bounds_lists_and_items(client):
    assert client.post("/api/embeddings/words", json={"words": []}).status_code == 422
    assert client.post("/api/embeddings/words", json={"words": ["a"] * 41}).status_code == 422
    assert client.post("/api/embeddings/words", json={"words": ["x" * 41]}).status_code == 422
    assert client.post("/api/embeddings/words", json={"words": [""]}).status_code == 422


def test_neighbors_exclude_the_word_itself(client):
    body = client.post("/api/embeddings/neighbors", json={"word": "king", "top_k": 3}).json()
    assert body["word"] == "king" and body["vector"] == [1.0, 0.0, 1.0]
    assert "king" not in [n["word"] for n in body["neighbors"]]
    assert len(body["neighbors"]) == 3


def test_neighbors_of_an_unknown_word_is_400_with_suggestions(client):
    r = client.post("/api/embeddings/neighbors", json={"word": "kingz"})
    assert r.status_code == 400
    assert r.json()["detail"]["missing"] == [{"word": "kingz", "suggestions": ["king"]}]


def test_analogy_returns_queen_first_and_excludes_the_inputs(client):
    r = client.post(
        "/api/embeddings/analogy",
        json={"positive": ["king", "woman"], "negative": ["man"], "top_k": 3},
    )
    body = r.json()
    assert body["neighbors"][0]["word"] == "queen"
    assert not {"king", "woman", "man"} & {n["word"] for n in body["neighbors"]}
    assert body["vector"] == [0.0, 1.0, 1.0] and body["positive"] == ["king", "woman"]


def test_analogy_with_an_unknown_word_is_400_with_detail(client):
    r = client.post("/api/embeddings/analogy", json={"positive": ["kingz"], "negative": []})
    assert r.status_code == 400
    assert r.json()["detail"]["message"] == "Not in the GloVe vocabulary"
    assert r.json()["detail"]["missing"][0]["word"] == "kingz"


def test_analogy_rejects_out_of_bounds_lists(client):
    url = "/api/embeddings/analogy"
    assert client.post(url, json={"positive": [], "negative": []}).status_code == 422
    assert client.post(url, json={"positive": ["a"] * 4, "negative": []}).status_code == 422
    assert client.post(url, json={"positive": ["a"], "negative": ["b"] * 4}).status_code == 422
    assert client.post(url, json={"positive": ["a"], "vocab_limit": 10}).status_code == 422


def test_sentences_return_one_vector_each_with_the_normalized_flag(client):
    r = client.post("/api/embeddings/sentences", json={"sentences": ["a b", "c"]})
    body = r.json()
    assert (body["model"], body["dimensions"], body["pooling"]) == ("fake-minilm", 4, "mean")
    assert body["normalized"] is True and [i["text"] for i in body["items"]] == ["a b", "c"]
    assert np.isclose(np.linalg.norm(body["items"][0]["vector"]), 1.0, atol=1e-4)
    raw = client.post("/api/embeddings/sentences", json={"sentences": ["a b"], "normalize": False})
    assert raw.json()["normalized"] is False
    assert raw.json()["items"][0]["vector"][0] == 3.0


def test_sentences_rejects_out_of_bounds_input(client):
    url = "/api/embeddings/sentences"
    assert client.post(url, json={"sentences": []}).status_code == 422
    assert client.post(url, json={"sentences": ["a"] * 21}).status_code == 422
    assert client.post(url, json={"sentences": ["x" * 501]}).status_code == 422


def test_inspect_returns_tokens_vectors_and_four_poolings(client):
    body = client.post("/api/embeddings/inspect", json={"text": "hi"}).json()
    assert body["tokens"] == ["[CLS]", "hi", "[SEP]"] and body["ids"] == [101, 7632, 102]
    assert body["attention_mask"] == [1, 1, 1] and len(body["token_vectors"]) == 3
    assert set(body["pooled"]) == {"mean", "mean_normalized", "cls", "max"}
    assert body["trained_pooling"] == "mean" and body["truncated"] is False


def test_inspect_rejects_long_or_missing_text(client):
    assert client.post("/api/embeddings/inspect", json={"text": "x" * 201}).status_code == 422
    assert client.post("/api/embeddings/inspect", json={}).status_code == 422


def test_pca_projects_rows_and_returns_the_basis(client):
    rows = [[0.0, 0.0], [1.0, 1.0], [2.0, 2.0], [3.0, 3.0]]
    body = client.post("/api/embeddings/pca", json={"rows": rows, "dimensions": 2}).json()
    assert body["model"] == "numpy-svd" and body["rows"] == 4
    assert len(body["points"]) == 4 and len(body["components"]) == 2
    assert body["mean"] == [1.5, 1.5]
    assert (body["input_dimensions"], body["output_dimensions"]) == (2, 2)
    assert body["explained_variance_ratio"][0] == pytest.approx(1.0, abs=1e-4)


def test_pca_with_too_few_or_ragged_rows_is_400(client):
    url = "/api/embeddings/pca"
    assert client.post(url, json={"rows": [[1, 2], [3, 4]], "dimensions": 2}).status_code == 400
    ragged = {"rows": [[1, 2], [3, 4, 5], [6, 7]], "dimensions": 2}
    assert client.post(url, json=ragged).status_code == 400


def test_pca_rejects_out_of_bounds_input(client):
    url = "/api/embeddings/pca"
    assert client.post(url, json={"rows": [], "dimensions": 2}).status_code == 422
    assert client.post(url, json={"rows": [[1.0]] * 4, "dimensions": 2}).status_code == 422
    assert client.post(url, json={"rows": [[1.0, 2.0]] * 4, "dimensions": 4}).status_code == 422


def test_search_returns_both_rankings_and_the_query_tokens(client):
    body = client.post(
        "/api/embeddings/search", json={"query": "Work from home", "top_k": 3}
    ).json()
    assert body["query_tokens"] == ["work", "from", "home"] and body["normalized"] is True
    assert len(body["query_vector"]) == 4 and len(body["semantic"]) == 3
    assert set(body["semantic"][0]) == {"id", "title", "category", "score"}
    assert body["keyword"][0]["id"] == "hr-remote"
    assert body["keyword"][0]["shared"] == ["work", "from", "home"]


def test_search_reuses_the_corpus_index_between_requests(client):
    for _ in range(2):
        client.post("/api/embeddings/search", json={"query": "laptop"})
    assert len(INDEXES) == 1


def test_search_rejects_bad_input(client):
    assert client.post("/api/embeddings/search", json={"query": "x" * 501}).status_code == 422
    assert (
        client.post("/api/embeddings/search", json={"query": "a", "top_k": 11}).status_code == 422
    )


def test_every_successful_post_is_marked_real(client):
    posts = {
        "words": {"words": ["king"]},
        "neighbors": {"word": "king"},
        "analogy": {"positive": ["king"], "negative": []},
        "sentences": {"sentences": ["a"]},
        "inspect": {"text": "hi"},
        "pca": {"rows": [[0, 0], [1, 1], [2, 3]], "dimensions": 2},
        "search": {"query": "laptop"},
    }
    for path, payload in posts.items():
        r = client.post(f"/api/embeddings/{path}", json=payload)
        assert r.json()["execution_mode"] == "real", path
