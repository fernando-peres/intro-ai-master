import {
  evaluate,
  INITIAL_PARAMS,
  MAX_EPOCHS,
  type Params,
  type PerceptronActivation,
  trainEpoch,
  type UpdateTrace,
} from "@/lib/perceptron"
import { DATASETS, type DatasetId } from "./perceptron-data"

export type HistoryEntry = { epoch: number; errors: number; accuracy: number; bce: number }
export type RunStatus = "paused" | "playing" | "solved" | "capped"

/**
 * One training run plus its view toggles. `runId` changes on every restart, so a playback tick
 * scheduled for an earlier run is ignored.
 */
export type RunState = {
  runId: number
  dataset: DatasetId
  activation: PerceptronActivation
  params: Params
  epoch: number
  history: HistoryEntry[]
  misclassifiedIds: string[]
  lastTrace: UpdateTrace | null
  status: RunStatus
  selectedId: string
  showWeights: boolean
  showMath: boolean
}

export type RunAction =
  | { type: "selectDataset"; dataset: DatasetId }
  | { type: "selectActivation"; activation: PerceptronActivation }
  | { type: "play" }
  | { type: "pause" }
  | { type: "step" }
  | { type: "tick"; runId: number }
  | { type: "reset" }
  | { type: "selectPoint"; id: string }
  | { type: "toggleWeights" }
  | { type: "toggleMath" }

export const isTerminal = (status: RunStatus) => status === "solved" || status === "capped"

/** Step stops on zero errors (reported as solved even at the cap); sigmoid only at the cap. */
function statusAfter(activation: PerceptronActivation, errors: number, epoch: number) {
  if (activation === "step" && errors === 0) return "solved"
  if (epoch >= MAX_EPOCHS) return "capped"
  return null
}

function freshRun(
  runId: number,
  dataset: DatasetId,
  activation: PerceptronActivation,
  toggles: Pick<RunState, "showWeights" | "showMath">,
): RunState {
  const { points } = DATASETS[dataset]
  const { misclassifiedIds, errors, accuracy, bce } = evaluate(INITIAL_PARAMS, points)
  return {
    runId,
    dataset,
    activation,
    params: INITIAL_PARAMS,
    epoch: 0,
    history: [{ epoch: 0, errors, accuracy, bce }],
    misclassifiedIds,
    lastTrace: null,
    status: statusAfter(activation, errors, 0) ?? "paused",
    selectedId: points[0].id,
    ...toggles,
  }
}

export const initialRunState = (runId = 0) =>
  freshRun(runId, "or", "step", { showWeights: false, showMath: false })

function advance(state: RunState, keepPlaying: boolean): RunState {
  const { points } = DATASETS[state.dataset]
  const { params, lastTrace } = trainEpoch(state.params, points, state.activation, state.epoch)
  const epoch = state.epoch + 1
  const { misclassifiedIds, errors, accuracy, bce } = evaluate(params, points)
  return {
    ...state,
    params,
    epoch,
    lastTrace,
    misclassifiedIds,
    history: [...state.history, { epoch, errors, accuracy, bce }],
    status: statusAfter(state.activation, errors, epoch) ?? (keepPlaying ? "playing" : "paused"),
  }
}

export function runReducer(state: RunState, action: RunAction): RunState {
  const toggles = { showWeights: state.showWeights, showMath: state.showMath }
  switch (action.type) {
    case "selectDataset":
      return freshRun(state.runId + 1, action.dataset, state.activation, toggles)
    case "selectActivation":
      return freshRun(state.runId + 1, state.dataset, action.activation, toggles)
    case "reset":
      return initialRunState(state.runId + 1)
    case "play":
      return state.status === "paused" ? { ...state, status: "playing" } : state
    case "pause":
      return state.status === "playing" ? { ...state, status: "paused" } : state
    case "step":
      return isTerminal(state.status) ? state : advance(state, false)
    case "tick":
      return action.runId === state.runId && state.status === "playing"
        ? advance(state, true)
        : state
    case "selectPoint":
      return { ...state, selectedId: action.id }
    case "toggleWeights":
      return { ...state, showWeights: !state.showWeights }
    case "toggleMath":
      return { ...state, showMath: !state.showMath }
  }
}
