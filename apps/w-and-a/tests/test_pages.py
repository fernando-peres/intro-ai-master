from pathlib import Path

import pytest
from streamlit.testing.v1 import AppTest

APP = str(Path(__file__).resolve().parents[1] / "src" / "w_and_a" / "app.py")


@pytest.fixture
def app(monkeypatch) -> AppTest:
    monkeypatch.setenv("OPENAI_API_KEY", "")  # offline: no network in tests
    at = AppTest.from_file(APP, default_timeout=60)
    at.session_state["authenticated"] = True
    at.run()
    assert not at.exception
    return at


def open_page(at: AppTest, url_path: str) -> AppTest:
    # AppTest.switch_page only resolves file pages; ours are callables, matched by url path.
    at._page_hash = next(
        h for h, info in at._registered_pages.items() if info.get("url_pathname") == url_path
    )
    return at.run()


def test_sidebar_has_header_and_every_page(app):
    assert any("Workflows and" in h.proto.body for h in app.sidebar.get("html"))
    assert len(app.sidebar.get("page_link")) == 12  # compare, 5 chats, 5 notes, tools


def test_scripted_chatbot_runs_offline_across_turns(app):
    open_page(app, "chat-chatbot")
    app.chat_input(key="chatbot_scripted_input").set_value("where is my order?").run()
    app.chat_input(key="chatbot_scripted_input").set_value("1042").run()
    assert not app.exception
    texts = [m.value for m in app.markdown]
    assert any("starts with 10" in t for t in texts)
    assert any("15% voucher" in t for t in texts)


def test_llm_chatbot_replays_a_preset_offline(app):
    open_page(app, "chat-chatbot")
    app.segmented_control(key="chatbot_variant").set_value("llm").run()
    app.button(key="chatbot_llm_preset_0").click().run()
    assert not app.exception
    assert len(app.chat_message) == 2
    bodies = [h.proto.body for h in app.get("html")]
    assert any("Path taken" in b for b in bodies) and any("What to watch" in b for b in bodies)


def test_compare_page_shows_four_recorded_answers(app):
    assert any("four ways" in h.proto.body for h in app.get("html"))
    assert sum("Path taken" in h.proto.body for h in app.get("html")) == 4
    app.segmented_control(key="compare_question").set_value(3).run()
    assert not app.exception
    assert sum("Path taken" in h.proto.body for h in app.get("html")) == 4
