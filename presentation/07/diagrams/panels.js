// HTML panels under the slide 2 diagram on slides 9 (observability) and 10 (experiments).
// blocks.js calls onRequest / onSpan / onFeedback and tick(t) only while the diagram renders, so a hidden
// slide's panel is frozen too. Numbers are illustrative, generated on the fly; nothing is measured.
import { flash, pulseCards } from "./kit.js";

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SPAN = { M: "model", G: "guardrail", C: "context", T: "tool", W: "workflow step", A: "agent", E: "eval", OUT: "answer", FB: "user feedback" };
const LETTER_COL = { M: "#6ee7a0", G: "#f08a7e", C: "#7fb3ff", T: "#f2c94c", W: "#e6f57a", A: "#ff4fd8", E: "#7fe0e8", OUT: "#6ee7a0", FB: "#ffb86b" };

/** Observability: four live signal columns fed by the request spans of the diagram. */
export function obsPanel(stage) {
  const $ = (k) => stage.querySelector(`[data-ob="${k}"]`);
  const wf = $("wf"), id = $("id");
  const TOTAL = 9500; // ms the waterfall spans: one request, prompt to feedback
  let t0 = 0, prev = 0, trace = 1042, lats = [], errors = 0, cost = 0, up = 41, down = 6;
  const set = (k, v) => { const n = $(k); if (n) { n.textContent = v; flash(n, "is-hit", 600); } };
  const row = (hits, a, b) => {
    const label = hits.length > 1 ? `tools · ${hits.join(" ")}` : `${SPAN[hits[0]] || hits[0]}`;
    const d = document.createElement("div");
    d.className = "ob-span";
    d.innerHTML = `<span><i style="--c:${LETTER_COL[hits[0]]}"></i>${label}</span><b style="--s:${(a / TOTAL) * 100}%;--w:${Math.max(1.5, ((b - a) / TOTAL) * 100)}%;--c:${LETTER_COL[hits[0]]}"></b>`;
    wf.append(d);
  };
  return {
    onRequest(t) { t0 = prev = t; trace++; wf.innerHTML = ""; id.textContent = `trace #${trace}`; },
    onSpan(hits, t) {
      if (!hits.length) return;
      row(hits, prev - t0, t - t0);
      prev = t;
      if (hits.includes("OUT")) {
        const lat = rnd(1.2, 2.7); lats = [...lats, lat].slice(-20);
        const p95 = [...lats].sort((x, y) => x - y)[Math.floor(lats.length * 0.95) - (lats.length > 1 ? 1 : 0)] || lat;
        if (Math.random() < 0.12) errors++;
        const tokens = Math.round(rnd(1800, 3400)), eur = tokens * 0.0000042;
        cost += eur;
        set("lat", `${lat.toFixed(1)} s`); set("p95", `${p95.toFixed(1)} s`); set("err", String(errors));
        set("tok", tokens.toLocaleString("en")); set("eur", `€${eur.toFixed(4)}`); set("total", `€${cost.toFixed(3)}`);
      }
      if (hits.includes("E")) set("score", `${Math.round(rnd(78, 96))}%`);
    },
    onFeedback() {
      if (Math.random() < 0.82) set("up", String(++up)); else set("down", String(++down));
    },
    tick() {},
  };
}

/** Experiments: three variants run on the same cases; each 👍 is promoted into the harness via promote(id). */
export function expPanel(stage, promote) {
  const rows = stage.querySelector("[data-ex='rows']");
  const chips = [...stage.querySelectorAll(".ex-lab-steps li")];
  const VARIANTS = { W: ["workflow v2", "adds a check step"], A: ["agent · new planner", "fewer tool calls"], T: ["new search tool", "hybrid retrieval"], G: ["stricter guardrail", "fewer false alarms"] };
  let plan = [], phase = "idle", t0 = 0, k = 0;
  const lit = (i) => chips.forEach((c, j) => c.classList.toggle("is-on", j === i));
  const round = () => {
    const ids = [...Object.keys(VARIANTS)].sort(() => Math.random() - 0.5).slice(0, 3);
    plan = ids.map((id) => { const base = Math.round(rnd(76, 86)); return { id, base, win: Math.random() < 0.55 }; });
    if (!plan.some((p) => p.win)) pick(plan).win = true;
    plan.forEach((p) => (p.score = p.base + (p.win ? Math.round(rnd(4, 10)) : -Math.round(rnd(2, 7)))));
    rows.innerHTML = plan.map((p) => `
      <div class="ex-row" style="--c:${LETTER_COL[p.id]}">
        <span class="blk-badge" style="--c:${LETTER_COL[p.id]}">${p.id}</span>
        <span class="ex-name"><b>${VARIANTS[p.id][0]}</b><small>${VARIANTS[p.id][1]}</small></span>
        <span class="ex-line"><i></i></span>
        <span class="blk-badge is-e" style="--c:#7fe0e8">E</span>
        <span class="ex-score"></span>
        <span class="ex-verdict"></span>
      </div>`).join("");
    plan.forEach((p, i) => (p.el = rows.children[i]));
  };
  return {
    onRequest() {}, onSpan() {}, onFeedback() {},
    tick(t) {
      const dt = t - t0;
      const go = (next) => { phase = next; t0 = t; };
      if (phase === "idle") { round(); k = 0; lit(0); go("setup"); return; }
      if (phase === "setup") { lit(Math.min(2, Math.floor(dt / 700))); if (dt > 2100) go("run"); return; }
      const p = plan[k];
      if (phase === "run") {
        lit(3);
        p.el.querySelector(".ex-line i").style.width = `${Math.min(100, (dt / 1300) * 100)}%`;
        if (dt > 1300) { lit(4); const e = p.el.querySelector(".is-e"); flash(e, "is-pulse", 900); pulseCards(stage, "E"); go("eval"); }
      } else if (phase === "eval" && dt > 700) {
        p.el.querySelector(".ex-score").innerHTML = `${p.score}% <small>vs ${p.base}%</small>`;
        lit(5);
        go("decide");
      } else if (phase === "decide" && dt > 600) {
        p.el.querySelector(".ex-verdict").textContent = p.win ? "👍" : "👎";
        p.el.classList.add(p.win ? "is-win" : "is-lose");
        if (p.win) { p.el.classList.add("is-promoted"); promote(p.id); pulseCards(stage, "X"); }
        if (++k < plan.length) go("run"); else go("rest");
      } else if (phase === "rest" && dt > 6500) {
        go("idle");
      }
    },
  };
}
