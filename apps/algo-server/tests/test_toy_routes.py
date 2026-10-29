"""The toy GPT is small enough that these tests train and probe the real model."""

import pytest
from fastapi.testclient import TestClient

from algo_server.main import app
from algo_server.toy_routes import RUNS
from genai.toy_gpt import MAX_STEPS


@pytest.fixture
def client():
    RUNS.clear()
    return TestClient(app)


def create(client, **body):
    return client.post("/api/genai/toy/runs", json=body)


def test_corpora_lists_all_with_its_checkpoint(client):
    corpora = {c["id"]: c for c in client.get("/api/genai/toy/corpora").json()}
    assert {"general", "narrative", "code", "structured", "multilingual", "noisy", "all"} <= set(
        corpora
    )
    everything = corpora["all"]
    assert everything["has_checkpoint"] is True and corpora["general"]["has_checkpoint"] is False
    assert everything["tokens"] == everything["train_tokens"] + everything["val_tokens"]
    assert everything["context_len"] == 32 and "Paris" in everything["sample"]
    assert corpora["noisy"]["duplicates_removed"] >= 3


def test_create_train_and_probe_a_run(client):
    run = create(client, corpus="general", seed=1).json()
    assert run["step"] == 0 and run["history"] == [] and run["execution_mode"] == "real"
    assert run["max_steps"] == MAX_STEPS and run["params"] > 10_000
    assert run["random_guess_loss"] == pytest.approx(__import__("math").log(run["vocab_size"]))

    trained = client.post(f"/api/genai/toy/runs/{run['run_id']}/train", json={"steps": 5}).json()
    assert trained["step"] == 5 and [p["step"] for p in trained["history"]] == [1, 2, 3, 4, 5]

    probe = client.post(
        f"/api/genai/toy/runs/{run['run_id']}/probe",
        json={"text": "The capital of France is Paris."},
    ).json()
    assert probe["tokens"] == ["The", " capital", " of", " France", " is", " Paris", "."]
    assert [p["target"] for p in probe["positions"]][-2:] == [" Paris", "."]
    assert probe["truncated"] is False and len(probe["positions"][0]["top_k"]) == 5


def test_probe_reports_truncation_and_unknown_words(client):
    run = create(client, corpus="general").json()
    probe = client.post(
        f"/api/genai/toy/runs/{run['run_id']}/probe",
        json={"text": " ".join(["Zorb"] * 40)},
    ).json()
    assert probe["truncated"] is True and len(probe["positions"]) == 31
    assert probe["positions"][0]["target"] == "<unk>"


def test_generate_returns_steps_like_complete(client):
    run = create(client, corpus="general").json()
    body = client.post(
        f"/api/genai/toy/runs/{run['run_id']}/generate",
        json={"prompt": "The capital of", "max_tokens": 3, "temperature": 0},
    ).json()
    assert body["model"] == "toy-gpt" and len(body["steps"]) == 3
    assert {"token", "prob", "top_k"} <= set(body["steps"][0])


def test_pretrained_run_starts_at_its_saved_step(client):
    run = create(client, corpus="all", pretrained=True).json()
    assert run["step"] >= 500 and len(run["history"]) == run["step"]


def test_pretrained_requires_a_checkpoint(client):
    assert create(client, corpus="general", pretrained=True).status_code == 400


def test_unknown_corpus_and_unknown_run_are_404(client):
    assert create(client, corpus="nope").status_code == 404
    assert client.post("/api/genai/toy/runs/ffffffff/train", json={"steps": 1}).status_code == 404


def test_training_stops_at_the_step_cap(client):
    run = create(client, corpus="general").json()
    RUNS[run["run_id"]].trainer.step = MAX_STEPS - 1
    res = client.post(f"/api/genai/toy/runs/{run['run_id']}/train", json={"steps": 2})
    assert res.status_code == 400 and str(MAX_STEPS) in res.json()["detail"]
    too_many = client.post(f"/api/genai/toy/runs/{run['run_id']}/train", json={"steps": 201})
    assert too_many.status_code == 422
