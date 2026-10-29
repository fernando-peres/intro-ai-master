# Pretraining Lesson (Transformers Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students train a tiny decoder-only Transformer on a small corpus on the server and watch next-token loss, the parallel context → target rows and the model's own predictions change, all computed by the real toy model.

**Architecture:** `packages/genai` gains a word-level toy corpus module and a minimal PyTorch GPT with a trainer that runs *k* synchronous steps per call, probes a sentence position by position, generates like `GPT2Model`, and saves/loads a checkpoint. `apps/algo-server` keeps live training runs in an in-process registry behind `/api/genai/toy/*`. The `pretraining` lesson (already a placeholder in the curriculum) is a workbench: dataset explorer, training-example probe, loss chart and a "try the model" panel.

**Tech Stack:** Python 3.14, PyTorch (already a `genai[gpt2]` dependency), FastAPI/Pydantic, React + TanStack Query, vitest, pytest.

**Spec:** `docs/specs/26-10-25-transformers.md`, section "2. Pretraining (Phase 2, outline)".

## Global Constraints

- `packages/*` never import `apps/*` (import-linter contract); the run registry therefore lives in `algo-server`.
- No job queue, database or streaming: every request finishes synchronously; `steps` per request ≤ 200, total steps per run ≤ 2000.
- Every response and panel carries `execution_mode: "real"` (the toy model computes every number); UI badge text "real · toy model".
- Timestamps, if any, are UTC `YYYY-MM-DD-HH-mm-ss` (none expected).
- Docstring budgets: module 10, class 6, public function 5, private 3 prose lines. Comments name constraints, not restate code.
- All visible strings through `t()`; English only (no pt-BR).
- Branding: train loss `chart-warm`, validation loss `fg-secondary`, random-guess baseline `fg-muted` dashed (misc bucket: a method comparison, not classes).
- Checkpoint `< 1 MB`, committed at `packages/genai/src/genai/checkpoints/toy-gpt-all.pt`.
- Lint/format: `uv run ruff check apps packages`, `uv run ruff format --check apps packages`, `npx biome check src`.

## Review Focus

1. Probe or prompt text containing words outside the toy vocabulary → mapped to `<unk>`, shown as `<unk>` in the UI, never a crash (Task 1 test `test_encode_maps_unknown_words_to_unk`, Task 2 probe test).
2. Probe text longer than the context length → only the last `context_len` tokens are scored; the UI says so (Task 2 `test_probe_keeps_only_the_last_context_window`).
3. A run id the server no longer has (restart, eviction) → 404 with a message; the lesson creates a new run and says the previous one was lost (Task 4 `test_unknown_run_is_404`, Task 5 lesson test "a lost run is recreated").
4. Training past the step cap → the server refuses with 400 and the UI disables Train/Auto (Task 4 `test_training_stops_at_the_step_cap`).
5. `pretrained: true` for a corpus without a checkpoint → 400, UI offers it only for the `all` corpus (Task 4 `test_pretrained_requires_a_checkpoint`).

---

### Task 1: Toy corpus and tokenizer

**Files:**
- Create: `packages/genai/src/genai/toy_corpus.py`
- Test: `packages/genai/tests/test_toy_corpus.py`

**Interfaces:**
- Produces:
  - `tokenize(text: str) -> list[str]` — regex `r" ?\w+| ?[^\w\s]|\n"`; `"".join(tokenize(t)) == t`.
  - `@dataclass(frozen=True) Corpus(id: str, title: str, purpose: str, documents: tuple[str, ...])`
  - `CORPORA: dict[str, Corpus]` with ids `general`, `narrative`, `code`, `structured`, `multilingual`, `noisy`, `all` (`all` = every other corpus except `noisy`, in that order).
  - `UNK = "<unk>"`, `SEP = "\n"`, `CONTEXT_LEN = 32`
  - `@dataclass(frozen=True) Prepared(corpus: Corpus, vocab: tuple[str, ...], train_ids: list[int], val_ids: list[int], documents: int, duplicates_removed: int)` with properties `vocab_size`, `tokens` (train + val), and methods `encode(text) -> list[int]` (unknown → id of `UNK`, which is 0) and `decode(ids) -> list[str]`.
  - `prepare(corpus_id: str) -> Prepared` — strip + collapse whitespace, drop exact duplicates, every 10th document (index % 10 == 9) goes to validation, documents joined by `SEP` tokens.

- [ ] **Step 1: Write the failing tests**

```python
def test_tokenize_round_trips_and_keeps_leading_spaces():
    assert tokenize("The capital, é Paris.\nOK") == ["The", " capital", ",", " é", " Paris", ".", "\n", "OK"]

def test_general_corpus_contains_the_capital_of_france():
    assert "The capital of France is Paris." in CORPORA["general"].documents

def test_prepare_splits_every_tenth_document_into_validation():
    p = prepare("all")
    assert p.documents >= 60 and p.duplicates_removed == 0
    assert 0.05 < len(p.val_ids) / p.tokens < 0.2
    assert p.vocab[0] == UNK

def test_noisy_corpus_has_duplicates_removed():
    assert prepare("noisy").duplicates_removed >= 3

def test_encode_maps_unknown_words_to_unk():
    p = prepare("general")
    assert p.encode("The capital of Zorblax")[-1] == 0
    assert p.decode(p.encode("The capital of France"))[-1] == " France"
```

- [ ] **Step 2: Run them** — `uv run pytest packages/genai/tests/test_toy_corpus.py -q` → FAIL, module not found.
- [ ] **Step 3: Implement `toy_corpus.py`.** Author the documents: `general` ≈ 45 one-sentence facts (capitals of France, Japan, Spain, Italy, Portugal, Germany; sun/earth; water boils; etc.), `narrative` ≈ 20 sentences of one short story ("Once upon a time, a dragon…"), `code` ≈ 12 one-line Python snippets (`def square(x): return x * x`), `structured` ≈ 12 `Name: Ana; City: Lisbon` records, `multilingual` ≈ 15 Portuguese sentences (`Bom dia. Como estás?`, `A capital de Portugal é Lisboa.`), `noisy` = `general` plus 5 exact duplicates and 6 typo variants (`Teh capital of Frnace is Paris.`). Total `all` ≈ 1 500–2 500 tokens.
- [ ] **Step 4: Run tests** → PASS. `uv run ruff check packages && uv run ruff format --check packages`.
- [ ] **Step 5: Commit** — `feat(genai): toy corpus and word-level tokenizer`

### Task 2: Toy GPT model and trainer

**Files:**
- Create: `packages/genai/src/genai/toy_gpt.py`
- Test: `packages/genai/tests/test_toy_gpt.py`

**Interfaces:**
- Consumes: Task 1 `prepare`, `Prepared`, `CONTEXT_LEN`; `Step`, `Candidate` from `genai.base_model`.
- Produces:
  - `@dataclass(frozen=True) ToyConfig(vocab_size: int, context_len: int = 32, d_model: int = 32, n_heads: int = 2, n_layers: int = 2, d_ff: int = 128)`
  - `class ToyGPT(torch.nn.Module)` — `forward(ids: Tensor[B, T]) -> logits Tensor[B, T, V]`; token + learned position embeddings, pre-LN blocks (causal multi-head attention written out, MLP), final LN, output head tied to the token embedding. Property `n_params: int`.
  - `@dataclass(frozen=True) Point(step: int, train_loss: float, val_loss: float)`
  - `@dataclass(frozen=True) Position(index: int, context: list[str], target: str, prob: float, loss: float, top_k: list[Candidate])`
  - `class Trainer` — `__init__(prepared: Prepared, seed: int = 0, lr: float = 3e-3, batch_size: int = 16)`; attributes `step: int`, `history: list[Point]`, `model: ToyGPT`, `prepared: Prepared`; methods `train(steps: int) -> list[Point]` (AdamW, random windows of `context_len` from `train_ids`, cross-entropy; after each step records `Point` with validation loss over up to 32 fixed validation windows), `probe(text: str, top_k: int = 5) -> list[Position]` (scores the last `context_len` tokens only), `generate_steps(prompt, *, max_tokens, temperature, top_k, seed, stop=None) -> list[Step]` (same contract as `BaseLM`, sliding window), `save(path: Path) -> None`, `@classmethod load(path: Path) -> Trainer`.
  - `MAX_STEPS = 2000`; `train` raises `ValueError` when it would pass it.
  - `random_guess_loss(vocab_size) = math.log(vocab_size)`.

- [ ] **Step 1: Write the failing tests**

```python
def test_loss_falls_on_the_general_corpus():
    t = Trainer(prepare("general"), seed=0)
    points = t.train(60)
    assert len(points) == 60 and t.step == 60
    assert points[-1].train_loss < points[0].train_loss
    assert points[0].train_loss == pytest.approx(math.log(t.prepared.vocab_size), rel=0.3)

def test_probe_scores_every_position_after_the_first():
    t = Trainer(prepare("general"))
    positions = t.probe("The capital of France is Paris.")
    assert [p.target for p in positions] == [" capital", " of", " France", " is", " Paris", "."]
    assert positions[0].context == ["The"]
    assert all(0 < p.prob <= 1 and len(p.top_k) == 5 for p in positions)
    assert positions[4].loss == pytest.approx(-math.log(positions[4].prob), rel=1e-4)

def test_probe_keeps_only_the_last_context_window():
    t = Trainer(prepare("general"))
    text = " ".join(["word"] * 50)
    assert len(t.probe(text)) == CONTEXT_LEN - 1

def test_generate_is_deterministic_and_respects_stop():
    t = Trainer(prepare("general"))
    kw = dict(max_tokens=5, temperature=0.0, top_k=3, seed=1)
    assert t.generate_steps("The capital", **kw) == t.generate_steps("The capital", **kw)
    steps = t.generate_steps("The capital", max_tokens=20, temperature=0.0, top_k=3, seed=1, stop="\n")
    assert len(steps) <= 20

def test_save_and_load_round_trip(tmp_path):
    t = Trainer(prepare("general"), seed=3); t.train(5); t.save(tmp_path / "t.pt")
    loaded = Trainer.load(tmp_path / "t.pt")
    assert loaded.step == 5 and loaded.history == t.history
    assert loaded.probe("The capital")[0].prob == pytest.approx(t.probe("The capital")[0].prob)

def test_training_refuses_to_pass_the_cap():
    t = Trainer(prepare("general")); t.step = MAX_STEPS - 1
    with pytest.raises(ValueError):
        t.train(2)
```

- [ ] **Step 2: Run** `uv run pytest packages/genai/tests/test_toy_gpt.py -q` → FAIL (module not found).
- [ ] **Step 3: Implement `toy_gpt.py`** per the Interfaces block. `torch` is imported at module top (the module is only imported by code that already needs torch; `test_toy_gpt.py` uses `pytest.importorskip("torch")`). Seed with `torch.Generator().manual_seed(seed)` for windows and sampling and `torch.manual_seed(seed)` before building the model.
- [ ] **Step 4: Run tests** → PASS; time the file (< 15 s). Ruff clean.
- [ ] **Step 5: Commit** — `feat(genai): toy decoder-only GPT with trainer, probe and generation`

### Task 3: Committed checkpoint

**Files:**
- Modify: `packages/genai/src/genai/toy_gpt.py` (add `CHECKPOINTS = Path(__file__).parent / "checkpoints"`, `checkpoint_path(corpus_id) -> Path | None` returning the path only when the file exists, and a `main()` + `if __name__ == "__main__"` that trains `all` for `--steps` (default 800), seed 0, and saves `toy-gpt-all.pt`)
- Create: `packages/genai/src/genai/checkpoints/toy-gpt-all.pt` (generated), `packages/genai/src/genai/checkpoints/README.md` (two lines: what it is, how to regenerate)
- Test: `packages/genai/tests/test_toy_gpt.py` (append)

- [ ] **Step 1: Write the failing test**

```python
def test_committed_checkpoint_knows_the_capital_of_france():
    path = checkpoint_path("all")
    assert path is not None
    t = Trainer.load(path)
    assert t.step >= 500
    assert t.probe("The capital of France is Paris.")[4].top_k[0].token == " Paris"
    assert checkpoint_path("general") is None
```

- [ ] **Step 2: Run** → FAIL (`checkpoint_path` missing).
- [ ] **Step 3: Implement**, then generate: `uv run python -m genai.toy_gpt --steps 800`; check `ls -la` shows < 1 MB.
- [ ] **Step 4: Run the test** → PASS. If " Paris" is not top-1, raise `--steps` (up to 1500) and regenerate.
- [ ] **Step 5: Commit** — `feat(genai): committed toy-gpt checkpoint trained on the full corpus`

### Task 4: Toy routes

**Files:**
- Create: `apps/algo-server/src/algo_server/toy_routes.py`
- Modify: `apps/algo-server/src/algo_server/main.py` (include `toy_router`)
- Test: `apps/algo-server/tests/test_toy_routes.py`

**Interfaces:**
- Consumes: Task 1 `CORPORA`, `prepare`; Task 2 `Trainer`, `MAX_STEPS`, `random_guess_loss`; Task 3 `checkpoint_path`.
- Produces (all under `router = APIRouter(prefix="/api/genai/toy")`):
  - `GET /corpora` → `list[CorpusInfo{id, title, purpose, sample: str (first 3 documents joined by " "), documents, duplicates_removed, tokens, vocab_size, train_tokens, val_tokens, context_len, has_checkpoint}]`
  - `POST /runs` body `CreateRun{corpus: str = "all", seed: int = 0, pretrained: bool = False}` → `RunState{run_id, corpus, step, max_steps, params, vocab_size, context_len, random_guess_loss, history: list[{step, train_loss, val_loss}], execution_mode: Literal["real"]}`; 400 when `pretrained` and no checkpoint; 404 for an unknown corpus.
  - `POST /runs/{run_id}/train` body `{steps: int = Field(20, ge=1, le=200)}` → `RunState`; 404 unknown run; 400 when the cap would be passed.
  - `POST /runs/{run_id}/probe` body `{text: str (1–300 chars), top_k: int = Field(5, ge=1, le=10)}` → `{tokens: list[str], truncated: bool, positions: list[{index, context, target, prob, loss, top_k}]}`
  - `POST /runs/{run_id}/generate` body as `CompleteRequest` → `{model: "toy-gpt", steps}`
  - Registry: module-level `RUNS: OrderedDict[str, Trainer]`, `MAX_RUNS = 24`, oldest evicted on insert; `run_id = secrets.token_hex(4)`.

- [ ] **Step 1: Write the failing tests** (real toy model, no fakes)

```python
def test_corpora_lists_all_with_checkpoint(client): ...  # ids include "all", has_checkpoint True for "all"
def test_create_train_and_probe_a_run(client):
    run = client.post("/api/genai/toy/runs", json={"corpus": "general", "seed": 1}).json()
    assert run["step"] == 0 and run["execution_mode"] == "real" and run["history"] == []
    trained = client.post(f"/api/genai/toy/runs/{run['run_id']}/train", json={"steps": 5}).json()
    assert trained["step"] == 5 and len(trained["history"]) == 5
    probe = client.post(f"/api/genai/toy/runs/{run['run_id']}/probe", json={"text": "The capital of France is Paris."}).json()
    assert [p["target"] for p in probe["positions"]][-2:] == [" Paris", "."] and probe["truncated"] is False
def test_generate_returns_steps_like_complete(client): ...  # len(steps) == 3 for max_tokens 3, each has token/prob/top_k
def test_pretrained_run_starts_at_its_saved_step(client): ...  # corpus "all", pretrained True → step >= 500
def test_pretrained_requires_a_checkpoint(client): ...  # corpus "general", pretrained True → 400
def test_unknown_run_is_404(client): ...
def test_training_stops_at_the_step_cap(client, monkeypatch): ...  # set trainer.step = MAX_STEPS - 1, train 2 → 400
```

- [ ] **Step 2: Run** → FAIL (import error).
- [ ] **Step 3: Implement `toy_routes.py`** and include the router in `main.py` after `genai_router`.
- [ ] **Step 4: Run** `uv run pytest apps/algo-server -q` → PASS; ruff + `uv run lint-imports` clean.
- [ ] **Step 5: Commit** — `feat(algo-server): /api/genai/toy routes for live toy-GPT training`

### Task 5: Pretraining lesson

**Files:**
- Modify: `apps/ai-intro/src/lessons/generative-ai/api.ts` (types + helpers), `apps/ai-intro/src/lessons/index.ts` (register `generative-ai/pretraining`)
- Create: `apps/ai-intro/src/lessons/generative-ai/pretraining.tsx`, `pretraining-panels.tsx` (DatasetPanel, ProbePanel, TryPanel), `pretraining.test.tsx`

**Interfaces:**
- Consumes: Task 4 shapes as TS types `ToyCorpus`, `RunState`, `ProbeResponse`; helpers `toyCorpora()`, `createRun(body)`, `trainRun(id, steps)`, `probeRun(id, text)`, `generateRun(id, req)`; existing `ServerNotice`, `RequestError`, `ModeBadge`, `tokenLabel`, `Workbench`, `ConfigRail`, `RailSection`, `SelectField`, `Stepper`, `Switch`, `Panel`, `PanelNote`, `CompareBars`, `toolbarButtonClass`, `StatStrip`, `LineChart`.
- Produces: `PretrainingLesson` (default export name used by `lessons/index.ts`).

Behaviour to pin:
- On mount: fetch corpora, create a run (`corpus: "all", seed: 0, pretrained: false`), then probe the default text `The capital of France is Paris.`.
- Rail: Corpus `SelectField` (description = purpose, badge "checkpoint" when `has_checkpoint`); **Start from**: `OptionGrid` scratch / pretrained checkpoint (pretrained disabled unless `has_checkpoint`); Seed `Stepper`; Steps per click `OptionGrid` 10 / 50 / 200; buttons **Train**, **Auto** (toggles continuous training via `useEffect` chaining `trainRun` while `playing && !pending && step < max_steps`), **Reset** (new run). Changing corpus, start-from or seed creates a new run.
- Panels: **Dataset** (StatStrip: documents, duplicates removed, tokens, vocabulary, train / validation tokens, context length; three sample documents; a `details` "How the text is prepared": cleaning → deduplication → tokenization → context windows of 32 → every 10th document to validation). **Training example** (probe text input + "Probe"; a table context → target with `p(target)` bar and loss; selected row's top-5 as `CompareBars`; a note that one causal forward pass scores every row at once; "showing the last 32 tokens" when `truncated`). **Training** (StatStrip: step / max, train loss, validation loss, perplexity = e^val, parameters; `LineChart` series train `chart-warm`, validation `fg-secondary`, dashed random-guess baseline `ln V` in `fg-muted`, `xExtent=[0, 100]`; derived message: "Validation loss is rising while training loss falls: the model is memorising" when the last 20 points' validation slope > 0 and train slope < 0). **Try the model** (prompt presets `Once upon a time,` · `The capital of Japan is` · `def square(x):` · custom; Generate greedy 12 tokens; tokens shown with their probability as `title`; note "behaviour, not loss"). All four carry `ModeBadge mode="real"` with the text suffix "toy model" (extend `ModeBadge` with an optional `note` prop).
- Errors: a 404 from train/probe/generate → create a new run and show `t("The previous run was lost (server restarted); started a new one.")`.

- [ ] **Step 1: Write the failing tests** (`fakeServer` with `/health`, `/genai/toy/corpora`, `/genai/toy/runs`, `/genai/toy/runs/r1/train`, `/genai/toy/runs/r1/probe`, `/genai/toy/runs/r1/generate`):
  - "creates a run and probes the default sentence on load": posts `{corpus:"all", seed:0, pretrained:false}`; the table shows targets ` capital` … `.`; `p(target)` of row 5 from the fake.
  - "Train posts the chosen number of steps, then re-probes": click 50, Train → `{steps: 50}` posted; stats show step `50 / 2000`; probe posted twice.
  - "pretrained start uses the checkpoint": click "Pretrained checkpoint" → new run posted with `pretrained: true`.
  - "a lost run is recreated": train handler returns 404 once → a second `/runs` post happens and the notice text appears.
  - "Generate shows the toy model's tokens": click Generate → `generated-text` test id contains the fake tokens.
- [ ] **Step 2: Run** → FAIL (module missing).
- [ ] **Step 3: Implement** api helpers, `pretraining-panels.tsx`, `pretraining.tsx`, register in `lessons/index.ts`.
- [ ] **Step 4: Run** `npx vitest run src/lessons/generative-ai src/curriculum.test.ts`, `pnpm exec tsc --noEmit`, `npx biome check src` → all green.
- [ ] **Step 5: Commit** — `feat(ai-intro): Pretraining lesson on the live toy GPT`

### Task 6: Docs

**Files:**
- Modify: `docs/specs/26-10-25-transformers.md` (section 2 → "built", describe the page and endpoints as implemented; API table rows; Phases table; Verification), `docs/prd.md` (Pretraining row → **Built.**), `apps/algo-server/README.md` (endpoint table), `packages/genai/README.md` (modules list + checkpoint note), `apps/ai-intro/README.md` (Transformers sentence).

- [ ] **Step 1: Update the five documents.**
- [ ] **Step 2: Run the full verification** — `uv run pytest -m "not slow"`, `uv run ruff check apps packages`, `uv run lint-imports`; from `apps/ai-intro`: `pnpm exec tsc --noEmit`, `npx biome check src`, `npx vitest run`. Then start both servers, open `/learn/generative-ai/pretraining`, Train to ~300 steps and confirm " Paris" climbs, switch to the pretrained checkpoint, try the noisy corpus for the memorisation message, check dark/light and 390 px.
- [ ] **Step 3: Commit** — `docs: Transformers spec Phase 2 built; READMEs and PRD`
