import { evaluate, INITIAL_PARAMS, MAX_EPOCHS } from "@/lib/perceptron"
import { DATASETS } from "./perceptron-data"
import { initialRunState, type RunAction, type RunState, runReducer } from "./perceptron-run"

const apply = (state: RunState, ...actions: RunAction[]) => actions.reduce(runReducer, state)
const repeat = (n: number, action: RunAction): RunAction[] => Array(n).fill(action)

test("the initial run is OR, step, paused, epoch 0 with an evaluated baseline", () => {
  const state = initialRunState()
  expect(state).toMatchObject({
    dataset: "or",
    activation: "step",
    status: "paused",
    epoch: 0,
    params: INITIAL_PARAMS,
    lastTrace: null,
    selectedId: "or-0",
    showWeights: false,
    showMath: false,
  })
  const baseline = evaluate(INITIAL_PARAMS, DATASETS.or.points)
  expect(state.history).toEqual([
    { epoch: 0, errors: baseline.errors, accuracy: baseline.accuracy, bce: baseline.bce },
  ])
})

test("each step processes one epoch and records metrics from the final parameters", () => {
  const state = apply(initialRunState(), { type: "step" }, { type: "step" })
  expect(state.epoch).toBe(2)
  expect(state.history.map((h) => h.epoch)).toEqual([0, 1, 2])
  const check = evaluate(state.params, DATASETS.or.points)
  expect(state.history[2]).toEqual({
    epoch: 2,
    errors: check.errors,
    accuracy: check.accuracy,
    bce: check.bce,
  })
  expect(state.lastTrace?.after).toEqual(state.params)
})

test("step stops as solved once a full evaluation has zero errors", () => {
  const state = apply(initialRunState(), ...repeat(20, { type: "step" }))
  expect(state.status).toBe("solved")
  expect(state.epoch).toBe(6)
  expect(apply(state, { type: "step" }, { type: "play" })).toBe(state)
})

test("non-separable data stops at the epoch cap", () => {
  const xor = apply(initialRunState(), { type: "selectDataset", dataset: "xor" })
  const state = apply(xor, ...repeat(MAX_EPOCHS + 5, { type: "step" }))
  expect(state.status).toBe("capped")
  expect(state.epoch).toBe(MAX_EPOCHS)
  expect(state.history.at(-1)?.errors).toBeGreaterThan(0)
})

test("sigmoid keeps training after reaching 100% accuracy", () => {
  const sigmoid = apply(initialRunState(), { type: "selectActivation", activation: "sigmoid" })
  const state = apply(sigmoid, ...repeat(15, { type: "step" }))
  expect(state.history.at(-1)?.errors).toBe(0)
  expect(state.status).toBe("paused")
  const later = apply(state, { type: "step" })
  expect(later.epoch).toBe(16)
  expect(later.params).not.toEqual(state.params)
})

test("playback ticks produce the same numbers as repeated steps", () => {
  const sigmoid = apply(initialRunState(), { type: "selectActivation", activation: "sigmoid" })
  const stepped = apply(sigmoid, ...repeat(7, { type: "step" }))
  const played = apply(
    sigmoid,
    { type: "play" },
    ...repeat(7, { type: "tick", runId: sigmoid.runId }),
  )
  expect(played.status).toBe("playing")
  expect(played.params).toEqual(stepped.params)
  expect(played.history).toEqual(stepped.history)
  expect(apply(played, { type: "pause" }).status).toBe("paused")
})

test("a tick from an old run never updates the new run", () => {
  const playing = apply(initialRunState(), { type: "play" })
  const fresh = apply(playing, { type: "selectDataset", dataset: "and" })
  expect(fresh.status).toBe("paused")
  const resumed = apply(fresh, { type: "play" })
  expect(apply(resumed, { type: "tick", runId: playing.runId })).toBe(resumed)
  expect(apply(fresh, { type: "tick", runId: fresh.runId })).toBe(fresh)
})

test("changing configuration restarts the run but keeps disclosure toggles", () => {
  const trained = apply(
    initialRunState(),
    { type: "toggleWeights" },
    { type: "toggleMath" },
    { type: "selectPoint", id: "or-2" },
    { type: "step" },
  )
  const state = apply(trained, { type: "selectActivation", activation: "sigmoid" })
  expect(state).toMatchObject({
    dataset: "or",
    activation: "sigmoid",
    epoch: 0,
    params: INITIAL_PARAMS,
    lastTrace: null,
    selectedId: "or-0",
    showWeights: true,
    showMath: true,
  })
  expect(state.history).toHaveLength(1)
  expect(state.runId).not.toBe(trained.runId)
})

test("reset restarts training but keeps dataset, activation and toggles", () => {
  const changed = apply(
    initialRunState(),
    { type: "selectDataset", dataset: "moons" },
    { type: "selectActivation", activation: "sigmoid" },
    { type: "toggleWeights" },
    { type: "step" },
    { type: "play" },
  )
  const reset = apply(changed, { type: "reset" })
  const { runId, ...rest } = reset
  const { runId: _freshRunId, ...fresh } = apply(
    initialRunState(),
    { type: "selectDataset", dataset: "moons" },
    { type: "selectActivation", activation: "sigmoid" },
    { type: "toggleWeights" },
  )
  expect(rest).toEqual(fresh)
  expect(reset.epoch).toBe(0)
  expect(runId).not.toBe(changed.runId)
})
