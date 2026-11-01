import pytest


@pytest.fixture
def library(api) -> dict[str, str]:
    """Intro to AI › Foundations › What is a model, plus a second box."""
    box = api.box("Intro to AI")
    other_box = api.box("Prompting")

    def location(kind: str, title: str, parent: str) -> str:
        body = {"kind": kind, "title": title, "parentId": parent}
        return api.post("usr_author", "/api/v1/locations", body, expect=201).json()["id"]

    unit = location("unit", "Foundations", box)
    section = location("section", "What is a model", unit)

    def artifact(title: str, location_id: str, type_: str, tags: list[str], **extra) -> str:
        body = {
            "type": type_,
            "title": title,
            "locationId": location_id,
            "locale": "en",
            "tags": tags,
            **extra,
        }
        return api.post("usr_author", "/api/v1/artifacts", body, expect=201).json()

    scoring = artifact("Harness scoring", section, "slide", ["eval", "scoring"])
    glossary = artifact(
        "Model glossary", unit, "doc", ["eval", "glossary"], description="Terms for evaluation"
    )
    welcome = artifact("Welcome tour", box, "slide", ["onboarding"])
    budgets = artifact("Token budgets", other_box, "doc", ["costs"])
    api.ship(scoring["draft"]["id"])
    return {
        "box": box,
        "unit": unit,
        "section": section,
        "scoring": scoring["artifact"]["id"],
        "glossary": glossary["artifact"]["id"],
        "welcome": welcome["artifact"]["id"],
        "budgets": budgets["artifact"]["id"],
    }


def _ids(api, **params) -> list[str]:
    response = api.get("usr_viewer", "/api/v1/artifacts", params=params).json()
    assert response["total"] == len(response["items"])
    return [item["id"] for item in response["items"]]


def test_prefix_full_text_on_title_tags_and_description(api, library):
    assert _ids(api, query="harn") == [library["scoring"]]
    assert set(_ids(api, query="evaluation")) == {library["glossary"]}
    assert _ids(api, query="glossary terms") == [library["glossary"]]
    assert set(_ids(api, query="eval")) == {library["scoring"], library["glossary"]}


def test_filters(api, library):
    assert set(_ids(api, tag=["onboarding", "costs"])) == {library["welcome"], library["budgets"]}
    assert set(_ids(api, type="doc")) == {library["glossary"], library["budgets"]}
    assert _ids(api, status="has-published") == [library["scoring"]]
    assert library["scoring"] not in _ids(api, status="draft-only")
    assert _ids(api, locale="pt-PT") == []


def test_location_search_matches_tree_browsing(api, library):
    tree = api.get("usr_viewer", "/api/v1/locations").json()
    children: dict[str | None, list[str]] = {}
    for loc in tree:
        children.setdefault(loc["parentId"], []).append(loc["id"])

    def subtree(root: str) -> set[str]:
        return {root}.union(*(subtree(child) for child in children.get(root, [])))

    for root in (library["box"], library["unit"], library["section"]):
        browsed = {
            artifact_id
            for artifact_id in (library[k] for k in ("scoring", "glossary", "welcome", "budgets"))
            if api.get("usr_viewer", f"/api/v1/artifacts/{artifact_id}").json()["locationId"]
            in subtree(root)
        }
        assert set(_ids(api, locationId=root)) == browsed


def test_list_items_carry_path_versions_and_reuse(api, library):
    item = api.get("usr_viewer", "/api/v1/artifacts", params={"query": "harness"}).json()["items"][
        0
    ]
    assert [p["title"] for p in item["locationPath"]] == [
        "Intro to AI",
        "Foundations",
        "What is a model",
    ]
    assert item["localeVersions"] == [
        {"locale": "en", "latestNumber": 1, "defaultNumber": 1, "hasDraft": False}
    ]
    assert item["status"] == "has-published"
    assert item["reuseCount"] == 0

    version_id = item["defaults"]["en"]
    for title in ("A", "B"):
        flow_id = api.flow(title)
        api.set_steps(
            flow_id, [{"artifactId": item["id"], "locale": "en", "artifactVersionId": version_id}]
        )
    again = api.get("usr_viewer", "/api/v1/artifacts", params={"query": "harness"}).json()
    assert again["items"][0]["reuseCount"] == 2


def test_pagination_and_tag_counts(api, library):
    page = api.get("usr_viewer", "/api/v1/artifacts", params={"limit": 2}).json()
    assert page["total"] == 4 and len(page["items"]) == 2
    rest = api.get("usr_viewer", "/api/v1/artifacts", params={"limit": 2, "offset": 2}).json()
    assert {i["id"] for i in page["items"]}.isdisjoint(i["id"] for i in rest["items"])

    counts = {t["tag"]: t["count"] for t in api.get("usr_viewer", "/api/v1/tags").json()}
    assert counts["eval"] == 2 and counts["costs"] == 1


def test_search_vector_follows_edits(api, library):
    api.patch("usr_author", f"/api/v1/artifacts/{library['budgets']}", {"title": "Context limits"})
    assert _ids(api, query="context") == [library["budgets"]]
    assert _ids(api, query="token") == []


def test_titles_with_versions_and_odd_input(api):
    box = api.box("Versions")
    made = api.artifact(title="Harness v2.0 model 2.5", locationId=box)["artifact"]["id"]
    for query in ("v2.0", "v2", "2.5", "harness v2.0"):
        assert made in _ids(api, query=query), query
    for query in ("it's", "back\\slash", "a & b", "(x:*", "!"):
        api.get("usr_viewer", "/api/v1/artifacts", params={"query": query})
