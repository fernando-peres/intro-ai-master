import json

import numpy as np
import pytest

pytest.importorskip("safetensors")

from genai.word_vectors import GloveVectors  # noqa: E402


def test_load_names_a_tokenizer_config_without_vocab(monkeypatch, tmp_path):
    config = tmp_path / "config.json"
    config.write_text(json.dumps({"other": []}))
    monkeypatch.setattr("huggingface_hub.hf_hub_download", lambda *a, **k: str(config))
    monkeypatch.setattr(
        "safetensors.numpy.load_file", lambda _: {"emb_layer.weight": np.zeros((2, 300))}
    )
    with pytest.raises(RuntimeError, match="no 'vocab' key"):
        GloveVectors().lookup(["dog"])
