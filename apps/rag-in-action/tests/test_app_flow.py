"""Drives every page through Streamlit's AppTest, from Load to a retrieval-only chat turn."""

from pathlib import Path

import pytest
from streamlit.testing.v1 import AppTest

APP = str(Path(__file__).resolve().parents[1] / "src" / "rag_in_action" / "app.py")


def _button(at: AppTest, label: str):
    return next(b for b in at.button if b.label.startswith(label))


@pytest.mark.slow
def test_full_pipeline_flow(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr("rag_in_action.ui.state.api_key", lambda: None)
    at = AppTest.from_file(APP, default_timeout=120)
    at.session_state["authenticated"] = True
    at.run()
    assert not at.exception
    steps = [
        ("Start with step 1", None),
        ("Load the corpus", "Next · Chunk"),
        ("Chunk the whole corpus", "Next · Enrich"),
        ("Enrich all chunks", "Next · Embed"),
        ("Embed", "Next · Store"),
        ("Build the index", "Next · Retrieve"),
    ]
    for action, nxt in steps:
        _button(at, action).click().run()
        assert not at.exception, at.exception
        if nxt:
            _button(at, nxt).click().run()
            assert not at.exception, at.exception
    _button(at, "How long does a ColdBox battery last").click().run()
    assert not at.exception, at.exception
    assert any("product-catalog#" in h.proto.body for h in at.get("html"))
    _button(at, "Open product-catalog.md").click().run()
    assert not at.exception, at.exception
    _button(at, "7 · Analytics").click().run()
    assert not at.exception, at.exception
    assert any("topic-card" in h.proto.body for h in at.get("html"))


@pytest.mark.slow
def test_analytics_opens_without_running_the_pipeline(monkeypatch):
    monkeypatch.setattr("rag_in_action.ui.state.api_key", lambda: None)
    at = AppTest.from_file(APP, default_timeout=180)
    at.session_state["authenticated"] = True
    at.run()
    _button(at, "Jump to Analytics").click().run()
    assert not at.exception, at.exception
    assert any("default index" in c.value for c in at.caption)
    assert any("topic-card" in h.proto.body for h in at.get("html"))
