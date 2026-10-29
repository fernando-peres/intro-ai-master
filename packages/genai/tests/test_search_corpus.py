import re
from collections import Counter

from genai.search_corpus import DOCUMENTS, SearchIndex, jaccard, keywords
from genai.sentence_vectors import SentenceVector

#: Words in one group share a dimension, so the fake encoder "knows" they are synonyms.
GROUPS = [
    {"vacation", "pto", "leave", "holiday"},
    {"remotely", "home", "remote"},
    {"laptop", "computer", "device"},
    {"boot", "turn", "power"},
    {"allowance", "diem", "meals"},
]


class FakeEncoder:
    name = "fake"
    dimensions = len(GROUPS) + 1
    max_tokens = 256
    loaded = True

    def __init__(self):
        self.calls: list[list[str]] = []

    def encode(self, texts, *, normalize=True):
        self.calls.append(list(texts))
        out = []
        for text in texts:
            vector = [0.0] * self.dimensions
            vector[-1] = 0.01
            for word in re.findall(r"[a-z0-9]+", text.lower()):
                for i, group in enumerate(GROUPS):
                    if word in group:
                        vector[i] += 1.0
            norm = sum(x * x for x in vector) ** 0.5
            out.append(SentenceVector(text, [x / norm for x in vector], len(text.split()), False))
        return out

    def inspect(self, text):
        raise NotImplementedError


def test_corpus_has_five_balanced_categories_and_unique_ids():
    assert 30 <= len(DOCUMENTS) <= 40
    assert len({d.id for d in DOCUMENTS}) == len(DOCUMENTS)
    counts = Counter(d.category for d in DOCUMENTS)
    assert set(counts) == {"hr", "finance", "support", "it", "travel"}
    assert all(6 <= n <= 8 for n in counts.values())


def test_corpus_has_the_work_from_home_document():
    assert any("work from home up to three days per week" in d.text for d in DOCUMENTS)


def test_keywords_lowercase_alphanumerics_without_stemming():
    assert keywords("Employees' PTO: 25 days!") == ["employees", "pto", "25", "days"]
    assert keywords("day days") == ["day", "days"]


def test_jaccard_is_intersection_over_union():
    assert jaccard(["a", "b", "c"], ["b", "c", "d"]) == 0.5
    assert jaccard([], []) == 0.0
    assert jaccard(["a"], ["b"]) == 0.0


def test_corpus_is_embedded_once():
    encoder = FakeEncoder()
    index = SearchIndex(encoder)
    index.search("vacation", top_k=3)
    index.search("laptop", top_k=3)
    corpus_calls = [c for c in encoder.calls if len(c) == len(DOCUMENTS)]
    assert len(corpus_calls) == 1


def test_search_returns_both_rankings_with_scores_and_shared_words():
    result = SearchIndex(FakeEncoder()).search("laptop won't turn on", top_k=3)
    assert result.query_tokens == ["laptop", "won", "t", "turn", "on"]
    assert len(result.semantic) == 3 and len(result.keyword) <= 3
    assert result.semantic[0].score >= result.semantic[1].score >= result.semantic[2].score
    assert all(h.score > 0 and h.shared for h in result.keyword)
    assert result.keyword[0].score >= result.keyword[-1].score


def test_keyword_ranking_misses_a_synonym_that_semantic_ranking_finds():
    result = SearchIndex(FakeEncoder()).search("vacation days", top_k=5)
    pto = next(
        d for d in DOCUMENTS if "pto" in keywords(d.text) and "vacation" not in keywords(d.text)
    )
    assert pto.id in [h.id for h in result.semantic]
    assert pto.id not in [h.id for h in result.keyword]


def test_keyword_ranking_drops_zero_overlap_documents():
    result = SearchIndex(FakeEncoder()).search("zzzz", top_k=5)
    assert result.keyword == []
