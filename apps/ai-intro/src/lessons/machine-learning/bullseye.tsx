import { useTranslation } from "@/i18n/use-translation"
import { gaussian, mulberry32 } from "@/lib/neural-net"

const SIZE = 200
const C = SIZE / 2
const R = 90
const SHOTS = 12
/** Ring radii, outermost first; the innermost is the bullseye — the true answer. */
const RINGS = [R, R * 0.75, R * 0.5, R * 0.25]

const cases = [
  { bias: false, variance: false, caption: "Accurate and consistent — the goal" },
  { bias: true, variance: false, caption: "Consistent, but consistently off" },
  { bias: false, variance: true, caption: "Right on average, but scattered" },
  { bias: true, variance: true, caption: "Off and scattered — the worst case" },
]

/** Each shot is one model's prediction, trained on a different sample of data. */
function shots(bias: boolean, variance: boolean, seed: number) {
  const rand = mulberry32(seed)
  const offset = bias ? { x: R * 0.42, y: -R * 0.36 } : { x: 0, y: 0 }
  const spread = variance ? R * 0.26 : R * 0.07
  return Array.from({ length: SHOTS }, () => ({
    x: C + offset.x + spread * gaussian(rand),
    y: C + offset.y + spread * gaussian(rand),
  }))
}

function Target({ bias, variance, seed }: { bias: boolean; variance: boolean; seed: number }) {
  const { t } = useTranslation()
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full max-w-[220px]"
      role="img"
      aria-label={t("{0} bias, {1} variance: shots {2} the bullseye, {3}.", [
        bias ? t("High") : t("Low"),
        variance ? t("high") : t("low"),
        bias ? t("centred away from") : t("centred on"),
        variance ? t("widely scattered") : t("tightly grouped"),
      ])}
    >
      {RINGS.map((r, i) => (
        <circle
          key={r}
          cx={C}
          cy={C}
          r={r}
          fill={i === RINGS.length - 1 ? "var(--color-brand)" : "var(--color-surface)"}
          fillOpacity={i === RINGS.length - 1 ? 0.35 : 1}
          className="stroke-fg-muted"
          strokeWidth={1.2}
        />
      ))}
      {shots(bias, variance, seed).map((s) => (
        <circle
          key={`${s.x}-${s.y}`}
          cx={s.x}
          cy={s.y}
          r={5}
          fill="var(--color-chart-cool)"
          stroke="var(--color-canvas)"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

/** The classic 2 × 2 dartboard: low/high bias across, low/high variance down. */
export function BiasVarianceTargets() {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-4 gap-y-3">
      <span />
      <p className="label-ui text-center text-fg-muted">{t("Low bias")}</p>
      <p className="label-ui text-center text-fg-muted">{t("High bias")}</p>
      {[false, true].map((variance) => (
        <div key={String(variance)} className="contents">
          <p className="label-ui text-fg-muted [writing-mode:vertical-rl] rotate-180">
            {variance ? t("High") : t("Low")} {t(" variance ")}
          </p>
          {cases
            .filter((c) => c.variance === variance)
            .map((c, i) => (
              <figure key={c.caption} className="flex flex-col items-center gap-1">
                <Target bias={c.bias} variance={c.variance} seed={40 + i + (variance ? 2 : 0)} />
                <figcaption className="text-center text-xs text-fg-secondary">
                  {t(c.caption)}
                </figcaption>
              </figure>
            ))}
        </div>
      ))}
    </div>
  )
}
