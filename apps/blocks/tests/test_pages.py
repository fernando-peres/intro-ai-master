"""The registry matches `html/`, the home shows a card per block, and every block page renders."""

from pathlib import Path

import pytest
from streamlit.testing.v1 import AppTest

from blocks.blocks import BLOCKS, HTML_DIR

APP = str(Path(__file__).resolve().parents[1] / "src" / "blocks" / "app.py")


def test_registry_matches_the_html_folder():
    assert sorted(b.slug for b in BLOCKS) == sorted(p.stem for p in HTML_DIR.glob("*.html"))


@pytest.fixture
def at() -> AppTest:
    at = AppTest.from_file(APP, default_timeout=60)
    at.session_state["authenticated"] = True
    return at.run()


def test_home_has_one_open_button_per_block(at):
    assert not at.exception
    keys = [b.key for b in at.button if b.key and b.key.startswith("open-")]
    assert keys == [f"open-{b.slug}" for b in BLOCKS]


@pytest.mark.parametrize("block", BLOCKS, ids=lambda b: b.slug)
def test_each_block_page_renders(at, block):
    at.button(key=f"open-{block.slug}").click().run()
    assert not at.exception
