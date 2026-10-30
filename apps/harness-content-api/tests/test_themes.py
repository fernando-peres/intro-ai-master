"""Artifact themes and templates: seed, read-only built-ins, usage counts, slide references."""

import json
from pathlib import Path

import harness_content_api

THEMES = "/api/v1/artifact-themes"
TEMPLATES = "/api/v1/artifact-templates"
SEED = Path(harness_content_api.__file__).parent / "schemas" / "builtin-themes.json"


def slide(theme: str = "dark") -> dict:
    return {"schemaVersion": 1, "type": "slide", "theme": theme}


def by_id(api, theme_id: str) -> dict:
    return next(t for t in api.get("usr_viewer", THEMES).json() if t["id"] == theme_id)


def test_builtins_match_the_exported_seed(api) -> None:
    themes = {t["id"]: t for t in api.get("usr_viewer", THEMES).json() if t["builtin"]}
    seed = json.loads(SEED.read_text())
    assert {key: theme["tokens"] for key, theme in themes.items()} == seed
    assert themes["dark"]["name"] == "Graphite Dark"


def test_builtins_are_read_only_but_can_be_duplicated(api) -> None:
    api.patch("usr_author", f"{THEMES}/dark", {"name": "Mine"}, expect=409)
    copy = api.post("usr_author", f"{THEMES}/dark/duplicate", expect=201).json()
    assert copy["name"] == "Graphite Dark copy" and copy["builtin"] is False
    tokens = {**copy["tokens"], "accent1": "#123456"}
    url = f"{THEMES}/{copy['id']}"
    assert api.patch("usr_author", url, {"tokens": tokens}).json()["tokens"]["accent1"] == "#123456"
    api.patch("usr_author", url, {"tokens": {**tokens, "title": "red"}}, expect=422)


def test_viewers_cannot_edit_themes(api) -> None:
    api.post("usr_viewer", THEMES, {"name": "Nope"}, expect=403)


def test_slides_may_only_name_existing_themes(api) -> None:
    box = api.box()
    body = {"type": "slide", "title": "T", "locationId": box, "locale": "en"}
    response = api.post(
        "usr_author", "/api/v1/artifacts", {**body, "content": slide("thm_gone")}, expect=422
    )
    assert response.json()["code"] == "unknown_theme"
    theme = api.post("usr_author", THEMES, {"name": "Mine", "fromThemeId": "mint"}, expect=201)
    theme_id = theme.json()["id"]
    created = api.post(
        "usr_author", "/api/v1/artifacts", {**body, "content": slide(theme_id)}, expect=201
    )
    assert by_id(api, theme_id)["usedBy"] == 1
    assert created.json()["draft"]["content"]["theme"] == theme_id


def test_trails_accept_a_saved_theme_id(api) -> None:
    theme_id = api.post("usr_author", THEMES, {"name": "Mine"}, expect=201).json()["id"]
    body = {"title": "Path", "locale": "en", "theme": theme_id}
    assert api.post("usr_author", "/api/v1/flows", body, expect=201).json()["theme"] == theme_id


def test_template_lifecycle_and_use_count(api) -> None:
    body = {"name": "Cover", "layout": "cover", "content": slide("violet")}
    template = api.post("usr_author", TEMPLATES, body, expect=201).json()
    assert template["themeId"] == "violet" and template["useCount"] == 0
    assert [t["id"] for t in api.get("usr_viewer", f"{TEMPLATES}?themeId=violet").json()] == [
        template["id"]
    ]
    assert api.get("usr_viewer", f"{TEMPLATES}?themeId=mint").json() == []

    url = f"{TEMPLATES}/{template['id']}"
    assert api.patch("usr_author", url, {"content": slide("mint")}).json()["themeId"] == "mint"
    api.patch("usr_author", url, {"content": slide("thm_gone")}, expect=422)

    created = api.post(
        "usr_author",
        "/api/v1/artifacts",
        {
            "type": "slide",
            "title": "From template",
            "locationId": api.box(),
            "locale": "en",
            "templateId": template["id"],
        },
        expect=201,
    ).json()
    assert created["draft"]["content"]["theme"] == "mint"
    assert api.get("usr_viewer", url).json()["useCount"] == 1

    api.call("DELETE", "usr_author", url, expect=204)
    api.get("usr_viewer", url, expect=404)


def test_templates_cannot_start_other_artifact_types(api) -> None:
    body = {"name": "Cover", "layout": "cover", "content": slide()}
    template = api.post("usr_author", TEMPLATES, body, expect=201).json()
    response = api.post(
        "usr_author",
        "/api/v1/artifacts",
        {
            "type": "doc",
            "title": "Doc",
            "locationId": api.box(),
            "locale": "en",
            "templateId": template["id"],
        },
        expect=422,
    )
    assert response.json()["code"] == "template_type_mismatch"
