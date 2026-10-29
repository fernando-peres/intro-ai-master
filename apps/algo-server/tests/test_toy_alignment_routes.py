"""Post-training routes on the real toy model: SFT, preferences, reward model, PPO, stages."""

import pytest
from fastapi.testclient import TestClient

from algo_server.main import app
from algo_server.toy_routes import RUNS

PREFIX = "/api/genai/toy"
ITALY = "Question: What is the capital of Italy? Answer:"


@pytest.fixture
def client():
    RUNS.clear()
    return TestClient(app)


def pretrained(client):
    return client.post(f"{PREFIX}/runs", json={"corpus": "all", "pretrained": True}).json()


def test_alignment_lists_demos_and_prompts(client):
    body = client.get(f"{PREFIX}/alignment").json()
    assert len(body["demonstrations"]) >= 12 and len(body["held_out"]) == 2
    assert body["demonstrations"][0] == {
        "prompt": "Question: What is the capital of France? Answer:",
        "completion": " Paris.",
    }
    france = next(p for p in body["prompts"] if p["id"] == "france")
    assert [c["id"] for c in france["candidates"]] == ["a", "b", "c", "d"]
    assert france["honest"] == ["a", "b", "c", "d"] and "concise" in france["candidates"][0]["note"]


def test_run_state_starts_without_post_training(client):
    run = pretrained(client)
    assert run["stage"] == "pretrained" and run["sft_history"] == [] and run["rm_history"] == []
    assert (
        run["ppo_history"] == [] and run["student_pairs"] == 0 and run["has_reward_model"] is False
    )


def test_sft_then_generate_from_each_stage(client):
    run = pretrained(client)
    rid = run["run_id"]
    state = client.post(f"{PREFIX}/runs/{rid}/sft", json={"steps": 30}).json()
    assert state["stage"] == "sft" and len(state["sft_history"]) == 30
    assert {"step", "loss", "held_out_loss"} <= set(state["sft_history"][0])
    base = client.post(
        f"{PREFIX}/runs/{rid}/generate",
        json={"prompt": ITALY, "max_tokens": 3, "stage": "pretrained"},
    ).json()
    current = client.post(
        f"{PREFIX}/runs/{rid}/generate", json={"prompt": ITALY, "max_tokens": 3, "stage": "current"}
    ).json()
    assert base["model"] == "toy-gpt" and len(base["steps"]) == 3 and len(current["steps"]) == 3
    assert (
        client.post(
            f"{PREFIX}/runs/{rid}/generate", json={"prompt": ITALY, "stage": "sft"}
        ).status_code
        == 400
    )


def test_preferences_then_reward_model_scores_candidates(client):
    rid = pretrained(client)["run_id"]
    state = client.post(
        f"{PREFIX}/runs/{rid}/preferences",
        json={"prompt_id": "france", "ranking": ["c", "a", "b", "d"]},
    ).json()
    assert state["student_pairs"] == 6
    body = client.post(
        f"{PREFIX}/runs/{rid}/reward-model", json={"steps": 20, "bias": "none"}
    ).json()
    assert len(body["run"]["rm_history"]) == 20 and body["run"]["has_reward_model"] is True
    assert {"step", "loss", "accuracy"} <= set(body["run"]["rm_history"][0])
    assert set(body["candidate_scores"]["france"]) == {"a", "b", "c", "d"}
    assert all(isinstance(v, float) for v in body["candidate_scores"]["france"].values())


def test_bad_preference_payloads(client):
    rid = pretrained(client)["run_id"]
    bad_prompt = client.post(
        f"{PREFIX}/runs/{rid}/preferences",
        json={"prompt_id": "nope", "ranking": ["a", "b", "c", "d"]},
    )
    bad_ranking = client.post(
        f"{PREFIX}/runs/{rid}/preferences",
        json={"prompt_id": "france", "ranking": ["a", "a", "b", "c"]},
    )
    assert bad_prompt.status_code == 404 and bad_ranking.status_code == 422


def test_ppo_requires_a_reward_model(client):
    rid = pretrained(client)["run_id"]
    res = client.post(f"{PREFIX}/runs/{rid}/ppo", json={"iterations": 1})
    assert res.status_code == 400 and "reward model" in res.json()["detail"]


def test_ppo_requires_sft_and_sft_is_refused_after_ppo(client):
    rid = pretrained(client)["run_id"]
    client.post(f"{PREFIX}/runs/{rid}/reward-model", json={"steps": 5})
    res = client.post(f"{PREFIX}/runs/{rid}/ppo", json={"iterations": 1})
    assert res.status_code == 400 and "SFT" in res.json()["detail"]
    client.post(f"{PREFIX}/runs/{rid}/sft", json={"steps": 5})
    assert client.post(f"{PREFIX}/runs/{rid}/ppo", json={"iterations": 1}).status_code == 200
    late = client.post(f"{PREFIX}/runs/{rid}/sft", json={"steps": 5})
    assert late.status_code == 400 and "lineage" in late.json()["detail"]


def test_ppo_runs_after_the_reward_model(client):
    rid = pretrained(client)["run_id"]
    client.post(f"{PREFIX}/runs/{rid}/sft", json={"steps": 10})
    client.post(f"{PREFIX}/runs/{rid}/reward-model", json={"steps": 10, "bias": "length"})
    state = client.post(
        f"{PREFIX}/runs/{rid}/ppo",
        json={"iterations": 2, "lr": 0.0005, "clip": 0.2, "kl_beta": 0.1},
    ).json()
    assert state["stage"] == "rlhf" and len(state["ppo_history"]) == 2
    point = state["ppo_history"][0]
    assert {"iteration", "reward", "kl", "policy_loss", "clip_fraction", "sample_prompt"} <= set(
        point
    )
    assert point["sample_completion"] != ""
    sft_out = client.post(f"{PREFIX}/runs/{rid}/generate", json={"prompt": ITALY, "stage": "sft"})
    assert sft_out.status_code == 200


def test_stage_checkpoints_exist_only_for_all(client):
    sft = client.post(f"{PREFIX}/runs", json={"corpus": "all", "pretrained": True, "stage": "sft"})
    assert sft.status_code == 200 and sft.json()["stage"] == "sft" and sft.json()["sft_history"]
    rlhf = client.post(
        f"{PREFIX}/runs", json={"corpus": "all", "pretrained": True, "stage": "rlhf"}
    )
    assert rlhf.json()["stage"] == "rlhf" and rlhf.json()["ppo_history"]
    missing = client.post(
        f"{PREFIX}/runs", json={"corpus": "general", "pretrained": True, "stage": "sft"}
    )
    assert missing.status_code == 400


def test_dpo_requires_sft_then_runs_and_blocks_ppo(client):
    rid = pretrained(client)["run_id"]
    res = client.post(f"{PREFIX}/runs/{rid}/dpo", json={"steps": 2})
    assert res.status_code == 400 and "SFT" in res.json()["detail"]
    client.post(f"{PREFIX}/runs/{rid}/sft", json={"steps": 5})
    state = client.post(f"{PREFIX}/runs/{rid}/dpo", json={"steps": 3, "beta": 0.5}).json()
    assert state["stage"] == "dpo" and len(state["dpo_history"]) == 3
    assert {"step", "loss", "accuracy", "margin"} <= set(state["dpo_history"][0])
    client.post(f"{PREFIX}/runs/{rid}/reward-model", json={"steps": 2})
    blocked = client.post(f"{PREFIX}/runs/{rid}/ppo", json={"iterations": 1})
    assert blocked.status_code == 400 and "DPO branch" in blocked.json()["detail"]
    sft_gen = client.post(f"{PREFIX}/runs/{rid}/generate", json={"prompt": ITALY, "stage": "sft"})
    assert sft_gen.status_code == 200


def test_ppo_branch_blocks_dpo(client):
    rid = pretrained(client)["run_id"]
    client.post(f"{PREFIX}/runs/{rid}/sft", json={"steps": 5})
    client.post(f"{PREFIX}/runs/{rid}/reward-model", json={"steps": 2})
    client.post(f"{PREFIX}/runs/{rid}/ppo", json={"iterations": 1})
    blocked = client.post(f"{PREFIX}/runs/{rid}/dpo", json={"steps": 1})
    assert blocked.status_code == 400 and "PPO branch" in blocked.json()["detail"]


def test_sft_can_train_a_lora_adapter(client):
    rid = pretrained(client)["run_id"]
    state = client.post(
        f"{PREFIX}/runs/{rid}/sft", json={"steps": 3, "adapter": "lora", "rank": 4}
    ).json()
    assert state["sft_adapter"] == "lora" and state["sft_trainable_params"] == 4096
    assert state["sft_trainable_params"] < state["params"]
    mixed = client.post(f"{PREFIX}/runs/{rid}/sft", json={"steps": 1, "adapter": "full"})
    assert mixed.status_code == 400 and "LoRA" in mixed.json()["detail"]


def test_run_state_reports_no_adapter_before_sft(client):
    run = pretrained(client)
    assert run["sft_adapter"] is None and run["sft_trainable_params"] is None
