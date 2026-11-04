"""Shared-password login gate: every page sits behind it, once per browser session."""

import hmac
import os

import streamlit as st

#: Classroom defaults; `APP_USER` / `APP_PASSWORD` (env or Cloud secrets) override them.
USER = os.environ.get("APP_USER", "student")
PASSWORD = os.environ.get("APP_PASSWORD", "novaims")
_KEY = "authenticated"


def require_login(title: str) -> None:
    """Return when this session is logged in; otherwise show the login page and stop the run."""
    if st.session_state.get(_KEY):
        return

    def login() -> None:
        _, mid, _ = st.columns([1, 1.2, 1])
        with mid:
            st.title(title)
            with st.form("login"):
                user = st.text_input("Username", autocomplete="username")
                password = st.text_input("Password", type="password")
                submitted = st.form_submit_button("Log in", type="primary", width="stretch")
            if submitted:
                if _matches(user, USER) & _matches(password, PASSWORD):
                    st.session_state[_KEY] = True
                    st.rerun()
                st.error("Wrong username or password.")

    st.navigation([st.Page(login, title="Log in", url_path="login")], position="hidden").run()
    st.stop()


def logout() -> None:
    st.session_state.pop(_KEY, None)


def _matches(given: str, expected: str) -> bool:
    return hmac.compare_digest(given.encode(), expected.encode())
