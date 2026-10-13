import type { ReactNode } from "react"
import { useTranslation } from "@/i18n/use-translation"
import {
  classOf,
  LEARNING_RATE,
  type Params,
  type PerceptronActivation,
  type PerceptronPoint,
  score,
  sigmoid,
  type UpdateTrace,
} from "@/lib/perceptron"
import { signed, term } from "./perceptron-format"

const sum = (params: Params, x1: number, x2: number) =>
  `(${signed(params.w1)})(${signed(x1)}) ${term(params.w2)}·(${signed(x2)}) ${term(params.b)}`
const paramList = (p: Params) => `w₁ = ${signed(p.w1)}, w₂ = ${signed(p.w2)}, b = ${signed(p.b)}`
const deltaList = (d: Params) =>
  `Δw₁ = ${signed(d.w1, 3)}, Δw₂ = ${signed(d.w2, 3)}, Δb = ${signed(d.b, 3)}`

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="label-ui text-fg-muted">{title}</h3>
      {children}
    </div>
  )
}

/** The active model's equations, the selected point with current weights, and the last real update. */
export function PerceptronMath({
  activation,
  params,
  selected,
  lastTrace,
  points,
}: {
  activation: PerceptronActivation
  params: Params
  selected: PerceptronPoint
  lastTrace: UpdateTrace | null
  points: PerceptronPoint[]
}) {
  const { t } = useTranslation()
  const isStep = activation === "step"
  const z = score(params, selected)
  const traced = lastTrace && points.find((p) => p.id === lastTrace.pointId)

  return (
    <div className="flex flex-col gap-4 font-ui text-xs text-fg-secondary">
      <Block title={t("Forward pass")}>
        <p className="text-sm text-fg">z = w₁x₁ + w₂x₂ + b</p>
        {isStep ? (
          <p className="text-sm text-fg">ŷ = 1 {t("if z ≥ 0, otherwise")} 0</p>
        ) : (
          <>
            <p className="text-sm text-fg">p = σ(z) = 1 / (1 + e^(−z))</p>
            <p className="text-sm text-fg">ŷ = 1 {t("if p ≥ 0.5, otherwise")} 0</p>
          </>
        )}
      </Block>

      <Block title={t("Update rule")}>
        <p className="text-sm text-fg">
          {isStep ? "error = y − ŷ" : "error = y − p"}
          <span className="ml-3 text-xs text-fg-muted">η = {LEARNING_RATE[activation]}</span>
        </p>
        <p className="text-sm text-fg">
          w₁ ← w₁ + η·error·x₁, w₂ ← w₂ + η·error·x₂, b ← b + η·error
        </p>
        <p>
          {isStep
            ? t(
                "The perceptron rule: a correct prediction gives error 0, so nothing changes; a mistake moves the line toward the point.",
              )
            : t(
                "Stochastic gradient descent on binary cross-entropy: the error uses the probability, so even a correctly classified point nudges the weights.",
              )}
        </p>
      </Block>

      <Block title={t("Selected point with current weights")}>
        <p>
          {selected.id}: x = ({signed(selected.x1)}, {signed(selected.x2)}), y = {selected.y}
        </p>
        <p className="break-words">
          z = {sum(params, selected.x1, selected.x2)} ={" "}
          <span className="text-fg">{signed(z, 3)}</span>
        </p>
        <p className="text-fg">
          {isStep
            ? `ŷ = ${classOf(z)}`
            : `p = σ(${signed(z, 3)}) = ${sigmoid(z).toFixed(3)} → ŷ = ${classOf(z)}`}
        </p>
      </Block>

      <Block title={t("Last training update")}>
        {lastTrace && traced ? (
          <>
            <p>
              {lastTrace.pointId}: x = ({signed(traced.x1)}, {signed(traced.x2)}), y ={" "}
              {lastTrace.target}
            </p>
            <p>
              {t("Before:")} {paramList(lastTrace.before)}
            </p>
            <p className="break-words">
              z = {sum(lastTrace.before, traced.x1, traced.x2)} = {signed(lastTrace.z, 3)} →{" "}
              {lastTrace.probability === undefined
                ? `ŷ = ${lastTrace.prediction}`
                : `p = ${lastTrace.probability.toFixed(3)}`}
            </p>
            <p>
              error = {signed(lastTrace.error, 3)}; {deltaList(lastTrace.delta)}
            </p>
            <p className="text-fg">
              {t("After:")} {paramList(lastTrace.after)}
            </p>
          </>
        ) : (
          <p>{t("No training update yet.")}</p>
        )}
      </Block>
    </div>
  )
}
