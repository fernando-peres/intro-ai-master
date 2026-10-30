def test_tree_rules_and_artifact_move(api):
    box = api.box()
    unit = api.post(
        "usr_author",
        "/api/v1/locations",
        {"kind": "unit", "title": "Foundations", "parentId": box},
        expect=201,
    ).json()["id"]
    section = api.post(
        "usr_author",
        "/api/v1/locations",
        {"kind": "section", "title": "What is a model", "parentId": unit},
        expect=201,
    ).json()["id"]

    bad = api.post(
        "usr_author",
        "/api/v1/locations",
        {"kind": "section", "title": "Wrong parent", "parentId": box},
        expect=422,
    )
    assert bad.json()["code"] == "invalid_parent"
    api.post("usr_author", "/api/v1/locations", {"kind": "unit", "title": "Orphan"}, expect=422)

    artifact = api.artifact()["artifact"]
    moved = api.patch("usr_author", f"/api/v1/artifacts/{artifact['id']}", {"locationId": section})
    assert moved.json()["locationId"] == section
    assert moved.json()["id"] == artifact["id"]

    api.post("usr_author", f"/api/v1/locations/{unit}/archive")
    listed = {loc["id"] for loc in api.get("usr_viewer", "/api/v1/locations").json()}
    assert unit not in listed and box in listed
    api.patch("usr_author", f"/api/v1/artifacts/{artifact['id']}", {"locationId": unit}, expect=409)
