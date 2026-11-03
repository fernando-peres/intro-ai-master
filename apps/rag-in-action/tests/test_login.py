"""The login gate, driven offline through Streamlit's AppTest."""

from pathlib import Path

import pytest
from streamlit.testing.v1 import AppTest

APP = str(Path(__file__).resolve().parents[1] / "src" / "rag_in_action" / "app.py")


@pytest.fixture
def at(monkeypatch) -> AppTest:
    monkeypatch.setenv("OPENAI_API_KEY", "")
    at = AppTest.from_file(APP, default_timeout=60).run()
    assert not at.exception
    return at


def _login(at: AppTest, user: str, password: str) -> AppTest:
    at.text_input[0].input(user)
    at.text_input[1].input(password)
    return at.button[0].click().run()


def test_fresh_session_sees_only_the_login_form(at):
    assert at.title[0].value == "RAG in action"
    assert len(at.text_input) == 2
    assert "authenticated" not in at.session_state


def test_wrong_password_is_rejected(at):
    _login(at, "student", "wrong")
    assert at.error[0].value == "Wrong username or password."
    assert "authenticated" not in at.session_state


def test_right_credentials_unlock_the_app(at):
    _login(at, "student", "novaims")
    assert not at.exception
    assert at.session_state["authenticated"]
    assert all(t.label != "Username" for t in at.text_input)
