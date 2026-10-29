"""An encoder-only Transformer that shows its two-way attention, next to GPT-2's causal one."""

import threading
from typing import Protocol

from genai.base_model import Attention


class AttentionModel(Protocol):
    name: str
    LAYERS: int

    def attention(self, text: str, *, layer: int, top_k: int) -> Attention:
        """Every head of `layer` over `text`; raises `ValueError` when the layer does not exist."""
        ...


class BertSmallModel:
    """BERT small (4 layers × 8 heads, 29 M parameters) on CPU; weights load on first use (~115 MB).

    The checkpoint ships no fast tokenizer, so it borrows BERT base's identical uncased vocabulary.
    """

    name = "bert-small"
    REPO = "google/bert_uncased_L-4_H-512_A-8"
    TOKENIZER = "bert-base-uncased"
    LAYERS = 4

    def __init__(self) -> None:
        self._tokenizer = None
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        with self._lock:
            if self._model is not None:
                return self._tokenizer, self._model
            from transformers import AutoTokenizer, BertModel

            self._tokenizer = AutoTokenizer.from_pretrained(self.TOKENIZER)
            self._model = BertModel.from_pretrained(self.REPO, attn_implementation="eager").eval()
            return self._tokenizer, self._model

    def attention(self, text: str, *, layer: int, top_k: int) -> Attention:
        """`top_k` is accepted for the shared contract; an encoder predicts no next token."""
        import torch

        if not 0 <= layer < self.LAYERS:
            raise ValueError(f"layer must be in 0..{self.LAYERS - 1}, got {layer}")
        tokenizer, model = self._load()
        encoded = tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            out = model(**encoded, output_attentions=True)
        weights = out.attentions[layer][0]
        return Attention(
            tokens=tokenizer.convert_ids_to_tokens(encoded.input_ids[0]),
            layer=layer,
            heads=int(weights.shape[0]),
            weights=[[[round(float(w), 4) for w in row] for row in head] for head in weights],
            next_tokens=[],
        )
