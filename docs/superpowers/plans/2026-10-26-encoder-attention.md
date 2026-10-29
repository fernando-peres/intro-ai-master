# Encoder Attention (Transformers Phase 4b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Architecture lab runs bidirectional attention for real, so the spec's original encoder example ("The bank is beside the river." vs "She deposited money at the bank.") can be inspected next to GPT-2's causal attention.

**Architecture:** `genai.encoder_model.BertSmallModel` wraps `google/bert_uncased_L-4_H-512_A-8` (4 layers × 8 heads, 29 M parameters, ~115 MB, loaded lazily with the eager kernel and the cached `bert-base-uncased` WordPiece tokenizer, which the small checkpoints share). It returns the same `Attention` shape as GPT-2 with full (non-causal) rows and no next-token candidates. `POST /api/genai/attention` gains `model: "gpt2" | "bert-small"` and reports `causal` and `layers`. The lab gains a model switch with per-model presets.

**Measured (drives the copy):** BERT small, layer 0 head 4: bank → river 0.88, bank → money 0.76; the tiny 2-layer BERTs show nothing useful (≤ 0.09), which is why the spec's `bert-tiny` idea is replaced.

**Spec:** `docs/specs/26-10-25-transformers.md`, section 1 and "Decisions and limits".

## Tasks

1. **`encoder_model.py` + slow test** — `AttentionModel` Protocol (`name`, `LAYERS`, `attention(text, *, layer, top_k) -> Attention`); `BertSmallModel`; `packages/genai/tests/test_bert_small.py` (slow): 9 tokens with `[CLS]`/`[SEP]`, rows sum to 1, upper triangle *not* zero, `next_tokens == []`, layer 4 → `ValueError`.
2. **Route** — `AttentionRequest.model`, `AttentionResponse.causal/layers`, `get_encoder` dependency, 400 for a layer the model lacks; tests with a `FakeEncoder`.
3. **Lab** — Model `OptionGrid` (GPT-2 · decoder / BERT small · encoder), per-model presets, layer wrap by `layers`, `masked={causal}`, next-token panel only when candidates exist, default selected token = "bank" when present; Theory section 2 copy; tests.
4. **Docs** — spec section 1, decisions, phases (4b built), API table; READMEs.
