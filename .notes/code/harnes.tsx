import { useId, useState, type CSSProperties } from "react";

/**
 * GenAIStackDiagram
 * Three concentric layers in tones of green. The model name sits in the core,
 * and every layer is also labelled outside the circle with a leader arrow.
 * Pure SVG + React (no dependencies). Scales to its container width.
 *
 * Usage:
 *   <GenAIStackDiagram />                    // builds itself up, then keeps flowing
 *   <GenAIStackDiagram animated={false} />   // final view only, no motion
 *
 * To replay the intro, change the component's `key`.
 * Animation is skipped automatically when the user prefers reduced motion.
 * Font: uses Montserrat if present, otherwise falls back to system sans.
 */

type LayerKey = "context" | "harness" | "model";

export interface GenAIStackDiagramProps {
  /** true: build-up intro plus flowing arrows. false: final view only. Default true. */
  animated?: boolean;
  contextTitle?: string;
  contextSubtitle?: string;
  harnessTitle?: string;
  harnessSubtitle?: string;
  modelTitle?: string;
  modelSubtitle?: string;
  className?: string;
}

// ── Geometry (viewBox 1300 × 760) ────────────────────────────────────────────
const W = 1300;
const H = 760;
const CX = 370;
const CY = 380;
const R_CTX = 330; // outer layer
const R_HARNESS = 250; // middle layer
const R_CORE = 112; // model core
const LABEL_X = 790; // left edge of the label column
const LABEL_WRAP = 40; // characters per subtitle line

const CARDINALS = [0, 90, 180, 270];
const DIAGONALS = [45, 135, 225, 315];
const ALL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

// ── Palette: one green per layer, light → deep ──────────────────────────────
const TONE: Record<LayerKey, string> = {
  context: "#cdf2e0",
  harness: "#6fd0a6",
  model: "#0c4a39",
};
const INK = "#0a4a38"; // lines, arrows, node outlines
const EDGE = "#2fb883"; // glowing layer edges
const TITLE_INK = "#0b3d2e";
const BODY_INK = "#3b6b59";
const FONT =
  '"Montserrat", "Avenir Next", "Segoe UI", system-ui, -apple-system, sans-serif';

// ── Intro timeline (seconds) ─────────────────────────────────────────────────
const T = {
  context: 0,
  harness: 0.3,
  model: 0.6,
  guides: 0.9,
  outerNodes: 0.9,
  harnessNodes: 1.0,
  connectors: 1.0,
  arrows: 1.4,
  labels: { context: 1.0, harness: 1.5, model: 2.0 } as Record<LayerKey, number>,
  pulses: 2.4,
};
const DRAW = 0.8; // draw-in duration for lines

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

// ── Helpers ──────────────────────────────────────────────────────────────────
const round = (n: number) => Math.round(n * 100) / 100;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Angle in degrees: 0 = right, 90 = bottom, 180 = left, 270 / -90 = top. */
const polar = (r: number, deg: number): [number, number] => [
  round(CX + r * Math.cos(rad(deg))),
  round(CY + r * Math.sin(rad(deg))),
];

const wrap = (text: string, max: number) => {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
};

// Outer-ring diagonal nodes curve down to the matching harness nodes.
const connectors = DIAGONALS.map((a) => {
  const [px, py] = polar(R_CTX, a);
  const [hx, hy] = polar(R_HARNESS, a);
  const [cx, cy] = polar(R_HARNESS + 34, a);
  const dir = py < CY ? 1 : -1;
  return `M ${px} ${py} C ${px} ${round(py + dir * 44)} ${cx} ${cy} ${hx} ${hy}`;
});

// Arrows from the harness into the model core.
const arrows = ALL_ANGLES.map((a) => {
  const [sx, sy] = polar(R_HARNESS - 6, a);
  const [ex, ey] = polar(R_CORE + 14, a);
  if (CARDINALS.includes(a)) return `M ${sx} ${sy} L ${ex} ${ey}`;
  const bow = a === 225 || a === 45 ? -10 : 10;
  const [qx, qy] = polar(190, a + bow);
  return `M ${sx} ${sy} Q ${qx} ${qy} ${ex} ${ey}`;
});

/** Curve from a label to a point on its layer, arriving radially. */
const leaderPath = (y: number, angle: number, r: number) => {
  const sx = LABEL_X - 16;
  const [tx, ty] = polar(r, angle);
  const [cx, cy] = polar(r + 70, angle);
  return `M ${sx} ${y} C ${sx - 70} ${y} ${cx} ${cy} ${tx} ${ty}`;
};

export default function GenAIStackDiagram({
  animated = true,
  contextTitle = "Contextual Data & Knowledge",
  contextSubtitle = "context, data, and knowledge that ground the system",
  harnessTitle = "Harness",
  harnessSubtitle = "Systems and mechanisms built around models",
  modelTitle = "GenAI Model",
  modelSubtitle = "provides “intelligence”",
  className,
}: GenAIStackDiagramProps) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const [active, setActive] = useState<LayerKey | null>(null);

  const hover = (key: LayerKey) => ({
    onMouseEnter: () => setActive(key),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(key),
    onBlur: () => setActive(null),
  });

  const labels: {
    key: LayerKey;
    title: string;
    sub: string;
    y: number;
    angle: number;
    r: number;
  }[] = [
    { key: "context", title: contextTitle, sub: contextSubtitle, y: 150, angle: -22.5, r: 292 },
    { key: "harness", title: harnessTitle, sub: harnessSubtitle, y: 385, angle: 22.5, r: 188 },
    { key: "model", title: modelTitle, sub: modelSubtitle, y: 640, angle: 67.5, r: R_CORE + 2 },
  ];

  const edge = (key: LayerKey) => (active === key ? 4.5 : 2.5);
  const coreLines = wrap(modelTitle, 10);
  const coreTop = CY - 6 - (coreLines.length - 2) * 18;

  return (
    <div className={`gsd-root ${className ?? ""}`.trim()} data-animated={animated ? "true" : "false"}>
      <style>{`
        .gsd-layer { outline: none; }
        .gsd-layer:focus-visible { outline: 2px solid ${INK}; outline-offset: 6px; }
        .gsd-edge, .gsd-dot { transition: stroke-width .2s ease, r .2s ease; }

        /* Final-view mode, or reduced motion: no flowing pulses, no intro. */
        .gsd-root[data-animated="false"] .gsd-pulse { display: none; }
        @media (prefers-reduced-motion: reduce) { .gsd-pulse { display: none; } }

        @media (prefers-reduced-motion: no-preference) {
          .gsd-root[data-animated="true"] .gsd-scale,
          .gsd-root[data-animated="true"] .gsd-pop { transform-box: fill-box; transform-origin: center; }
          .gsd-root[data-animated="true"] .gsd-scale { animation: gsd-scale-in .8s cubic-bezier(.2,.7,.2,1) var(--d,0s) backwards; }
          .gsd-root[data-animated="true"] .gsd-pop   { animation: gsd-pop .35s cubic-bezier(.3,1.4,.5,1) var(--d,0s) backwards; }
          .gsd-root[data-animated="true"] .gsd-fade  { animation: gsd-fade .6s ease var(--d,0s) backwards; }
          .gsd-root[data-animated="true"] .gsd-draw  { animation: gsd-draw ${DRAW}s ease-out var(--d,0s) backwards; }
          .gsd-root[data-animated="true"] .gsd-pulse { animation: gsd-fade .6s ease var(--d,0s) backwards, gsd-flow 2.4s linear infinite; }
        }
        @keyframes gsd-fade { from { opacity: 0; } }
        @keyframes gsd-scale-in { from { opacity: 0; transform: scale(.9); } }
        @keyframes gsd-pop { from { opacity: 0; transform: scale(.2); } }
        @keyframes gsd-draw { from { stroke-dasharray: 1; stroke-dashoffset: 1; } to { stroke-dasharray: 1; stroke-dashoffset: 0; } }
        @keyframes gsd-flow { to { stroke-dashoffset: -28; } }
      `}</style>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", maxWidth: 1100, margin: "0 auto", overflow: "visible" }}
        role="img"
        aria-label={`${modelTitle} inside ${harnessTitle}, inside ${contextTitle}`}
        fontFamily={FONT}
      >
        <defs>
          <radialGradient id={id("ctx")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.7" stopColor="#dcf6e9" />
            <stop offset="1" stopColor="#bfeed6" />
          </radialGradient>
          <linearGradient id={id("harness")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#58c79b" />
            <stop offset="1" stopColor="#86dab4" />
          </linearGradient>
          <radialGradient id={id("core")} cx="0.38" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#1f8a68" />
            <stop offset="0.5" stopColor="#0c4a39" />
            <stop offset="1" stopColor="#042a20" />
          </radialGradient>

          <filter id={id("glow")} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <marker
            id={id("arrow")}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* ── Layer 1: contextual data & knowledge ─────────────────────────── */}
        <g className="gsd-layer" tabIndex={0} role="group" aria-label={`${contextTitle}: ${contextSubtitle}`} {...hover("context")}>
          <circle
            className="gsd-edge gsd-scale"
            style={delay(T.context)}
            cx={CX}
            cy={CY}
            r={R_CTX}
            fill={`url(#${id("ctx")})`}
            stroke={EDGE}
            strokeWidth={edge("context")}
            filter={`url(#${id("glow")})`}
          />
          <circle className="gsd-fade" style={delay(T.guides)} cx={CX} cy={CY} r={(R_CTX + R_HARNESS) / 2} fill="none" stroke={INK} strokeOpacity="0.35" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
        </g>

        {/* ── Layer 2: harness ─────────────────────────────────────────────── */}
        <g className="gsd-layer" tabIndex={0} role="group" aria-label={`${harnessTitle}: ${harnessSubtitle}`} {...hover("harness")}>
          <circle
            className="gsd-edge gsd-scale"
            style={delay(T.harness)}
            cx={CX}
            cy={CY}
            r={R_HARNESS}
            fill={`url(#${id("harness")})`}
            stroke={EDGE}
            strokeWidth={edge("harness")}
            filter={`url(#${id("glow")})`}
          />
        </g>

        {/* ── Dotted axes ──────────────────────────────────────────────────── */}
        <g className="gsd-fade" style={delay(T.guides)} stroke={INK} strokeOpacity="0.35" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round">
          <line x1={CX - R_CTX} y1={CY} x2={CX + R_CTX} y2={CY} />
          <line x1={CX} y1={CY - R_CTX} x2={CX} y2={CY + R_CTX} />
        </g>

        {/* ── Connectors: outer ring → harness ─────────────────────────────── */}
        <g fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round">
          {connectors.map((d, i) => (
            <path key={i} className="gsd-draw" style={delay(T.connectors + i * 0.06)} pathLength={1} d={d} />
          ))}
        </g>

        {/* ── Arrows: harness → model ──────────────────────────────────────── */}
        <g fill="none" strokeLinecap="round">
          {arrows.map((d, i) => {
            const start = T.arrows + i * 0.04;
            return (
              <g key={i}>
                <path className="gsd-draw" style={delay(start)} pathLength={1} d={d} stroke={INK} strokeWidth="2.5" />
                {/* arrowhead is its own element so it appears when the line arrives */}
                <path className="gsd-fade" style={delay(start + DRAW - 0.15)} d={d} stroke="none" markerEnd={`url(#${id("arrow")})`} />
                <path className="gsd-pulse" style={delay(T.pulses)} d={d} stroke="#eafff6" strokeOpacity="0.9" strokeWidth="3" strokeDasharray="2 26" />
              </g>
            );
          })}
        </g>

        {/* ── Layer 3: model core ──────────────────────────────────────────── */}
        <g className="gsd-layer" tabIndex={0} role="group" aria-label={`${modelTitle}: ${modelSubtitle}`} {...hover("model")}>
          <circle className="gsd-scale" style={delay(T.model)} cx={CX} cy={CY} r={R_CORE + 9} fill="none" stroke="#eafff6" strokeOpacity="0.6" strokeWidth="4" />
          <circle
            className="gsd-edge gsd-scale"
            style={delay(T.model)}
            cx={CX}
            cy={CY}
            r={R_CORE}
            fill={`url(#${id("core")})`}
            stroke="#a8f0cf"
            strokeWidth={active === "model" ? 6 : 3.5}
            filter={`url(#${id("glow")})`}
          />
          <ellipse className="gsd-fade" style={delay(T.model + 0.3)} cx={CX - 34} cy={CY - 60} rx="46" ry="23" fill="#fff" opacity="0.12" transform={`rotate(-24 ${CX - 34} ${CY - 60})`} />

          <g className="gsd-fade" style={delay(T.model + 0.3)} textAnchor="middle" fill="#fff">
            {coreLines.map((line, i) => (
              <text key={i} x={CX} y={coreTop + i * 36} fontSize="34" fontWeight="700">
                {line}
              </text>
            ))}
            <text x={CX} y={coreTop + coreLines.length * 36 + 4} fontSize="13" fontWeight="500" fill="#cdeee2">
              {modelSubtitle}
            </text>
          </g>
        </g>

        {/* ── Nodes ────────────────────────────────────────────────────────── */}
        <g fill="#fff" stroke={INK} strokeWidth="2.5">
          {ALL_ANGLES.map((a, i) => {
            const [ox, oy] = polar(R_CTX, a);
            const [hx, hy] = polar(R_HARNESS, a);
            return (
              <g key={a}>
                <circle className="gsd-pop" style={delay(T.outerNodes + i * 0.04)} cx={ox} cy={oy} r="8" />
                <circle className="gsd-pop" style={delay(T.harnessNodes + i * 0.04)} cx={hx} cy={hy} r="8" />
              </g>
            );
          })}
        </g>

        {/* ── Labels with leader arrows ────────────────────────────────────── */}
        {labels.map(({ key, title, sub, y, angle, r }) => {
          const d = leaderPath(y, angle, r);
          const isActive = active === key;
          const t0 = T.labels[key];
          return (
            <g key={key} {...hover(key)}>
              {/* white halo keeps the line readable where it crosses a layer */}
              <path className="gsd-draw" style={delay(t0)} pathLength={1} d={d} fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="6" strokeLinecap="round" />
              <path className="gsd-draw" style={delay(t0)} pathLength={1} d={d} fill="none" stroke={INK} strokeWidth={isActive ? 2.8 : 2} strokeLinecap="round" />
              <path className="gsd-fade" style={delay(t0 + DRAW - 0.15)} d={d} fill="none" stroke="none" markerEnd={`url(#${id("arrow")})`} />
              <circle className="gsd-fade" style={delay(t0)} cx={LABEL_X - 16} cy={y} r="4.5" fill={INK} />

              <g className="gsd-fade" style={delay(t0 + 0.2)}>
                <circle className="gsd-dot" cx={LABEL_X + 10} cy={y} r={isActive ? 11 : 9} fill={TONE[key]} stroke={INK} strokeWidth="1.8" />
                <text x={LABEL_X + 32} y={y + 9} fontSize="28" fontWeight="700" fill={TITLE_INK}>
                  {title}
                </text>
                {wrap(sub, LABEL_WRAP).map((line, i) => (
                  <text key={i} x={LABEL_X + 32} y={y + 38 + i * 22} fontSize="16" fontWeight="500" fill={BODY_INK}>
                    {line}
                  </text>
                ))}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}