"""Integration with packages/genai, with GPT-2 and OpenAI replaced by fakes."""

import pytest
from fastapi.testclient import TestClient

from algo_server.genai_routes import get_assistant, get_base_lm
from algo_server.main import app
from genai.assistant import Message
from genai.base_model import Candidate, Step


class FakeLM:
    name = "fake-gpt2"

    def __init__(self):
        self.prompts: list[str] = []

    def generate_steps(self, prompt, *, max_tokens, temperature, top_k, seed, stop=None):
        self.prompts.append(prompt)
        tokens = [" Paris", ".", "\n", " extra"]
        steps = [Step(t, 0.5, [Candidate(t, 0.5)] * top_k) for t in tokens[:max_tokens]]
        if stop:
            steps = steps[: next(i for i, s in enumerate(steps) if stop in s.token) + 1]
        return steps

    def label_scores(self, prompt, labels):
        self.prompts.append(prompt)
        rest = 0.3 / (len(labels) - 1)
        return {label: 0.7 if i == 1 else rest for i, label in enumerate(labels)}


class FakeAssistant:
    model = "fake-gpt"

    def __init__(self, answer="Mixed, I think."):
        self.answer = answer
        self.calls: list[list[Message]] = []

    def reply(self, messages):
        self.calls.append(messages)
        return self.answer


@pytest.fixture
def fakes():
    lm, assistant = FakeLM(), FakeAssistant()
    app.dependency_overrides[get_base_lm] = lambda: lm
    app.dependency_overrides[get_assistant] = lambda: assistant
    yield lm, assistant
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_health_names_both_models(fakes, client):
    assert client.get("/api/health").json() == {
        "status": "ok",
        "base_model": "fake-gpt2",
        "assistant_model": "fake-gpt",
    }


def test_complete_returns_each_step_with_candidates(fakes, client):
    body = client.post("/api/genai/complete", json={"prompt": "Capital?", "max_tokens": 2}).json()
    assert body["model"] == "fake-gpt2"
    assert [s["token"] for s in body["steps"]] == [" Paris", "."]
    assert len(body["steps"][0]["top_k"]) == 5


def test_complete_rejects_an_empty_prompt(fakes, client):
    assert client.post("/api/genai/complete", json={"prompt": ""}).status_code == 422


SENTIMENT = {
    "instruction": "Classify the sentiment.",
    "examples": [{"input": "I love it", "output": "Positive"}],
    "query": "Good product, slow shipping",
    "input_name": "Review",
    "output_name": "Sentiment",
    "labels": ["Positive", "Negative", "Mixed"],
}


def test_base_model_classifies_by_label_probability(fakes, client):
    body = client.post("/api/genai/few-shot", json={**SENTIMENT, "model": "base"}).json()
    assert body["label"] == "Negative"
    assert body["scores"]["Negative"] == pytest.approx(0.7)
    assert body["prompt"].endswith("Review: Good product, slow shipping\nSentiment:")
    assert "Review: I love it\nSentiment: Positive" in body["prompt"]


def test_base_model_without_labels_answers_up_to_the_line_break(fakes, client):
    req = {"query": "Capital of France?", "input_name": "Q", "output_name": "A", "model": "base"}
    body = client.post("/api/genai/few-shot", json=req).json()
    assert body["output"] == "Paris."
    assert body["scores"] is None


def test_assistant_receives_the_same_prompt_and_its_label_is_parsed(fakes, client):
    _, assistant = fakes
    body = client.post("/api/genai/few-shot", json={**SENTIMENT, "model": "assistant"}).json()
    assert body == {
        "model": "fake-gpt",
        "prompt": body["prompt"],
        "output": "Mixed, I think.",
        "label": "Mixed",
        "scores": None,
    }
    system, user = assistant.calls[0]
    assert system.role == "system" and "Sentiment" in system.content
    assert user.content == body["prompt"]


def test_chat_forwards_the_whole_conversation(fakes, client):
    _, assistant = fakes
    messages = [
        {"role": "system", "content": "Be brief."},
        {"role": "user", "content": "Capital of France?"},
        {"role": "assistant", "content": "Paris."},
        {"role": "user", "content": "And Italy?"},
    ]
    body = client.post("/api/genai/chat", json={"messages": messages}).json()
    assert body == {"model": "fake-gpt", "reply": "Mixed, I think."}
    assert [m.content for m in assistant.calls[0]] == [m["content"] for m in messages]


def test_assistant_routes_explain_a_missing_key(client):
    app.dependency_overrides[get_assistant] = lambda: None
    try:
        res = client.post("/api/genai/chat", json={"messages": [{"role": "user", "content": "Hi"}]})
    finally:
        app.dependency_overrides.clear()
    assert res.status_code == 503
    assert "OPENAI_API_KEY" in res.json()["detail"]


def test_assistant_failures_become_bad_gateway(fakes, client):
    _, assistant = fakes

    def boom(messages):
        raise RuntimeError("rate limited")

    assistant.reply = boom
    res = client.post("/api/genai/chat", json={"messages": [{"role": "user", "content": "Hi"}]})
    assert res.status_code == 502
    assert "rate limited" in res.json()["detail"]
