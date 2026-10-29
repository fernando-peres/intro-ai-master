"""The toy GPT trains in seconds on CPU, so these tests run the real model."""

import math

import pytest

pytest.importorskip("torch")

from genai.toy_corpus import CONTEXT_LEN, prepare  # noqa: E402
from genai.toy_gpt import MAX_STEPS, Trainer, checkpoint_path  # noqa: E402


def test_loss_falls_on_the_general_corpus():
    t = Trainer(prepare("general"), seed=0)
    points = t.train(60)
    assert len(points) == 60 and t.step == 60
    assert points[-1].train_loss < points[0].train_loss
    assert points[0].train_loss == pytest.approx(math.log(t.prepared.vocab_size), rel=0.3)
    assert t.history == points


def test_probe_scores_every_position_after_the_first():
    t = Trainer(prepare("general"))
    positions = t.probe("The capital of France is Paris.")
    assert [p.target for p in positions] == [" capital", " of", " France", " is", " Paris", "."]
    assert positions[0].context == ["The"]
    assert positions[4].index == 5
    assert all(0 < p.prob <= 1 and len(p.top_k) == 5 for p in positions)
    assert positions[4].loss == pytest.approx(-math.log(positions[4].prob), rel=1e-4)


def test_probe_keeps_only_the_last_context_window():
    t = Trainer(prepare("general"))
    text = " ".join(["word"] * 50)
    assert len(t.probe(text)) == CONTEXT_LEN - 1


def test_generate_is_deterministic_and_respects_stop():
    t = Trainer(prepare("general"))
    kw = dict(max_tokens=5, temperature=0.0, top_k=3, seed=1)
    first = t.generate_steps("The capital", **kw)
    assert first == t.generate_steps("The capital", **kw)
    assert len(first) == 5 and all(len(s.top_k) == 3 for s in first)
    steps = t.generate_steps(
        "The capital", max_tokens=20, temperature=0.0, top_k=3, seed=1, stop="\n"
    )
    assert len(steps) <= 20


def test_save_and_load_round_trip(tmp_path):
    t = Trainer(prepare("general"), seed=3)
    t.train(5)
    t.save(tmp_path / "t.pt")
    loaded = Trainer.load(tmp_path / "t.pt")
    assert loaded.step == 5 and loaded.history == t.history
    assert loaded.prepared.corpus.id == "general"
    assert loaded.probe("The capital")[0].prob == pytest.approx(t.probe("The capital")[0].prob)


def test_training_refuses_to_pass_the_cap():
    t = Trainer(prepare("general"))
    t.step = MAX_STEPS - 1
    with pytest.raises(ValueError):
        t.train(2)


def test_committed_checkpoint_knows_the_capital_of_france():
    path = checkpoint_path("all")
    assert path is not None
    t = Trainer.load(path)
    assert t.step >= 500
    assert t.probe("The capital of France is Paris.")[4].top_k[0].token == " Paris"
    assert checkpoint_path("general") is None
