"""SFT, the reward model and PPO run on the real toy model; each test takes a few seconds."""

import pytest

pytest.importorskip("torch")

from genai.toy_corpus import DEMONSTRATIONS, PREFERENCE_PROMPTS, prepare, tokenize  # noqa: E402
from genai.toy_gpt import LoRALinear, Trainer, checkpoint_path  # noqa: E402
from genai.toy_posttraining import (  # noqa: E402
    RewardTrainer,
    _batch,
    _masked_loss,
    builtin_pairs,
    dpo,
    encode_demo,
    pairs_from_ranking,
    ppo,
    sft,
    stage_checkpoint_path,
)

ITALY = "Question: What is the capital of Italy? Answer:"
SPAIN = "Question: What is the capital of Spain? Answer: Madrid."
PLAIN_ITALY = "The capital of Italy is Rome."
FRANCE = next(p for p in PREFERENCE_PROMPTS if p.id == "france")


def load() -> Trainer:
    path = checkpoint_path("all")
    assert path is not None
    return Trainer.load(path)


def top_token(t: Trainer, text: str, target: str) -> str:
    return next(p for p in t.probe(text) if p.target == target).top_k[0].token


def test_sft_teaches_the_format_and_keeps_pretraining_knowledge():
    t = load()
    before = next(p for p in t.probe(SPAIN) if p.target == " Madrid")
    assert top_token(t, PLAIN_ITALY, " Rome") == " Rome"
    points = sft(t, 200)
    assert len(points) == 200 and t.stage == "sft" and "pretrained" in t.snapshots
    after = next(p for p in t.probe(SPAIN) if p.target == " Madrid")
    assert after.top_k[0].token == " Madrid" and after.prob > max(0.9, before.prob)
    # The replay term keeps what pretraining knew, even though the question form cannot reach it.
    assert top_token(t, PLAIN_ITALY, " Rome") == " Rome"
    answer = [
        s.token for s in t.generate_steps(ITALY, max_tokens=3, temperature=0, top_k=3, seed=0)
    ]
    assert "." in answer
    assert points[-1].loss < points[0].loss
    assert t.sft_history == points


def test_demo_encoding_masks_the_prompt_and_keeps_completion_plus_newline():
    p = prepare("all")
    demo = DEMONSTRATIONS[0]
    ids, mask = encode_demo(p, demo)
    assert len(ids) == len(mask)
    assert p.decode(ids) == tokenize(demo.prompt) + tokenize(demo.completion) + ["\n"]
    assert sum(mask) == len(tokenize(demo.completion)) + 1
    assert not any(mask[: len(tokenize(demo.prompt))])


def test_reward_model_learns_the_honest_pairs():
    t = load()
    sft(t, 100)
    rm = RewardTrainer(t, builtin_pairs("none"), seed=0)
    first = rm.train(1)[0]
    last = rm.train(120)[-1]
    assert 0 <= first.accuracy <= 1
    assert last.accuracy >= 0.9 and last.loss < first.loss
    assert rm.score(FRANCE.prompt, " Paris.") > rm.score(FRANCE.prompt, " Madrid.")


def test_length_bias_prefers_the_long_answers():
    pairs = builtin_pairs("length")
    long_first = [p for p in pairs if p[0] == FRANCE.prompt and p[2] == " Paris."]
    assert any(p[1] == " The capital of France is Paris." for p in long_first)


def test_student_pairs_change_the_reward_model():
    t = load()
    pairs = pairs_from_ranking(FRANCE, ["c", "a", "b", "d"])
    assert len(pairs) == 6 and pairs[0] == (FRANCE.prompt, " Madrid.", " Paris.")
    rm = RewardTrainer(t, pairs, seed=0)
    rm.train(150)
    assert rm.score(FRANCE.prompt, " Madrid.") > rm.score(FRANCE.prompt, " Paris.")


def aligned(seed: int = 1):
    t = load()
    sft(t, 100)
    rm = RewardTrainer(t, builtin_pairs("none"), seed=0)
    rm.train(60)
    return t, rm


def test_ppo_runs_and_reports_metrics():
    t, rm = aligned()
    points = ppo(t, rm, 3, seed=1)
    assert len(points) == 3 and [p.iteration for p in points] == [1, 2, 3]
    assert all(p.kl >= -1e-6 and 0 <= p.clip_fraction <= 1 for p in points)
    assert points[0].sample_prompt.startswith("Question:") and points[0].sample_completion
    assert t.stage == "rlhf" and "sft" in t.snapshots and t.ppo_history == points
    t2, rm2 = aligned()
    again = ppo(t2, rm2, 3, seed=1)
    assert [p.reward for p in again] == pytest.approx([p.reward for p in points], rel=1e-3)


def test_ppo_without_kl_drifts_further_from_the_reference():
    free_t, free_rm = aligned()
    free = ppo(free_t, free_rm, 12, kl_beta=0.0, seed=2)
    held_t, held_rm = aligned()
    held = ppo(held_t, held_rm, 12, kl_beta=1.0, seed=2)
    assert sum(p.kl for p in free[-4:]) > sum(p.kl for p in held[-4:])


def test_generate_from_snapshot_uses_the_old_weights():
    t = load()
    prompt = "Question: What is the capital of France? Answer:"
    kw = dict(max_tokens=3, temperature=0.0, top_k=3, seed=0)
    base = [s.token for s in t.generate_steps(prompt, **kw)]
    sft(t, 150)
    assert [s.token for s in t.generate_from("pretrained", prompt, **kw)] == base
    assert [s.token for s in t.generate_from("current", prompt, **kw)] != base


def test_stage_checkpoints_answer_a_demonstrated_question():
    sft_path = stage_checkpoint_path("all", "sft")
    rlhf_path = stage_checkpoint_path("all", "rlhf")
    assert sft_path is not None and rlhf_path is not None
    assert stage_checkpoint_path("general", "sft") is None
    t = Trainer.load(sft_path)
    assert t.stage == "sft" and top_token(t, SPAIN, " Madrid") == " Madrid"
    assert top_token(t, PLAIN_ITALY, " Rome") == " Rome"
    rlhf = Trainer.load(rlhf_path)
    assert (
        rlhf.stage == "rlhf" and rlhf.ppo_history and {"pretrained", "sft"} <= set(rlhf.snapshots)
    )


def test_masked_loss_averages_exactly_the_answer_positions():
    import torch

    t = load()
    demo = DEMONSTRATIONS[0]
    x, y, m = _batch(t.prepared, [demo], t.context_len)
    assert y[0][m[0]].tolist() == t.prepared.encode(demo.completion + "\n")
    with torch.no_grad():
        logits = t.model(x)[0]
        manual = torch.stack(
            [
                torch.nn.functional.cross_entropy(logits[i], y[0, i])
                for i in range(len(m[0]))
                if m[0, i]
            ]
        ).mean()
        assert float(_masked_loss(t.model, x, y, m)) == pytest.approx(float(manual), rel=1e-5)


def test_ppo_needs_sft_and_sft_cannot_follow_ppo():
    t = load()
    rm = RewardTrainer(t, builtin_pairs("none"), seed=0)
    with pytest.raises(ValueError, match="SFT"):
        ppo(t, rm, 1)
    sft(t, 5)
    ppo(t, rm, 1)
    with pytest.raises(ValueError, match="lineage"):
        sft(t, 5)


def test_dpo_prefers_chosen_answers_and_needs_sft():
    t = load()
    with pytest.raises(ValueError, match="SFT"):
        dpo(t, builtin_pairs("none"), 1)
    sft(t, 100)
    points = dpo(t, builtin_pairs("none"), 60, beta=0.5)
    assert len(points) == 60 and t.stage == "dpo" and "sft" in t.snapshots
    assert points[-1].loss < points[0].loss and points[-1].accuracy >= 0.9
    assert points[-1].margin > 0 and t.dpo_history == points


def test_dpo_and_ppo_are_exclusive_branches():
    t = load()
    sft(t, 20)
    dpo(t, builtin_pairs("none"), 2)
    rm = RewardTrainer(t, builtin_pairs("none"))
    with pytest.raises(ValueError, match="DPO branch"):
        ppo(t, rm, 1)
    u = load()
    sft(u, 20)
    rm = RewardTrainer(u, builtin_pairs("none"))
    rm.train(5)
    ppo(u, rm, 1)
    with pytest.raises(ValueError, match="PPO branch"):
        dpo(u, builtin_pairs("none"), 1)


def test_student_pairs_steer_dpo():
    t = load()
    sft(t, 100)
    wrong_first = pairs_from_ranking(FRANCE, ["c", "a", "b", "d"])
    points = dpo(t, wrong_first, 80, beta=0.5)
    assert points[-1].accuracy >= 0.8
    # DPO moves the chosen answer up relative to the rejected one; absolute probabilities may fall.
    p_madrid = t.probe(FRANCE.prompt + " Madrid.")[-2].prob
    p_paris = t.probe(FRANCE.prompt + " Paris.")[-2].prob
    assert p_madrid > p_paris


def test_lora_sft_trains_a_small_adapter_then_merges_it():
    t = load()
    base_params = t.model.n_params
    points = sft(t, 200, adapter="lora", rank=4)
    assert t.sft_adapter == "lora" and t.sft_trainable == 4096
    assert t.sft_trainable < base_params / 10
    assert len(points) == 200 and points[-1].loss < points[0].loss
    assert top_token(t, SPAIN, " Madrid") == " Madrid"
    assert top_token(t, PLAIN_ITALY, " Rome") == " Rome"
    # The adapter is folded back into the plain weights after the call.
    assert not any(isinstance(m, LoRALinear) for m in t.model.modules())
    assert t.model.n_params == base_params
    with pytest.raises(ValueError, match="LoRA"):
        sft(t, 1, adapter="full")


def test_full_sft_is_the_default_and_fixes_the_adapter_choice():
    t = load()
    sft(t, 1)
    assert t.sft_adapter == "full" and t.sft_trainable == t.model.n_params
    with pytest.raises(ValueError, match="full"):
        sft(t, 1, adapter="lora")
