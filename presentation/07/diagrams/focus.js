// Simplified slide 2 diagram for one building block (slides 3–7): model, harness ring and the prompt → answer
// lane, plus only the layer named by the mount element's data-focus (C, T, W, A, G or E).
// Each layer is a loop of steps; a step flies packets along arcs, then runs its exit() side effects.
import { THREE, createStage, material } from "./lib.js";
import { COL, hex, ringPoint, addRing, dashed, flash, pulseCards, arc } from "./kit.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const P = V(0, -0.2, 0); // model
const PROMPT = V(-3.55, -0.2, 1.3);
const OUT = V(3.55, -0.2, 1.3);
const R_HARNESS = 2.05;
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const pos = (x) => (typeof x === "function" ? x() : x);

export function mount(el) {
  const focus = el.dataset.focus;
  const { root, tick, addLabel, controls } = createStage(el, { fov: 36, position: [0, 6.3, 12.8], target: [0, 0.4, 0], spin: false });
  const stage = el.closest(".stage");
  const anchor = (v) => { const o = new THREE.Object3D(); o.position.copy(v); root.add(o); return o; };
  const ball = (v, r, col, glow = 0.5) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), material(col, { emissive: col, emissiveIntensity: glow })); m.position.copy(v); root.add(m); return m; };
  const pill = (text, object, col, extra = "") => /* label above its object; add "is-below" to flip */ { const d = addLabel(text, object, { className: `is-src ${extra}` }); d.style.setProperty("--moon", hex(col)); return d; };
  const card = (cls) => { const d = document.createElement("div"); d.className = `d-label ${cls}`; el.append(d); return d; };

  // ---------- Base: model, harness, faint context and observability, prompt → answer lane ----------
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 64, 48),
    new THREE.MeshPhysicalMaterial({ color: 0x0f4a35, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, metalness: 0.1, emissive: 0x06261b, emissiveIntensity: 0.4 }),
  );
  planet.position.copy(P);
  root.add(planet);
  addLabel("MODEL", anchor(P.clone().add(V(0, 0.05, 0.75))), { className: "is-ring is-model" });
  addRing(root, P, 0.95, R_HARNESS, 0x5fca9b, 0.2);
  addRing(root, P, R_HARNESS, R_HARNESS + 0.03, 0x6ee7a0, 0.9);
  addRing(root, P, R_HARNESS + 0.06, 2.85, 0xcdf3df, focus === "C" ? 0.09 : 0.04);
  root.add(dashed(Array.from({ length: 161 }, (_, i) => ringPoint(P, 3.25, (i / 160) * Math.PI * 2)), COL.O, 0.25, 0.08, 0.1));
  addLabel("HARNESS", anchor(ringPoint(P, 1.6, -Math.PI / 2 - 0.55)), { className: "is-ring is-zone is-harness" });
  if (focus === "C") addLabel("CONTEXT", anchor(ringPoint(P, 2.6, Math.PI / 2 - 0.45)), { className: "is-ring is-zone is-pale" });

  addLabel("Prompt", anchor(PROMPT), { className: "is-chip" });
  const answer = addLabel("Answer", anchor(OUT), { className: "is-chip is-out" });
  root.add(dashed([PROMPT.clone().add(V(0.5, 0, 0)), P], 0xffffff, 0.35));
  root.add(dashed([P, OUT.clone().add(V(-0.5, 0, 0))], 0xffffff, 0.35));
  const setAnswer = (text, on = true) => { answer.textContent = text; answer.classList.toggle("is-on", on); };

  const pulse = (id) => pulseCards(stage, id);
  const moving = []; // { mesh, r, phase, speed, c, tilt }
  const orbit = (m) => { moving.push(m); return m; };

  // ---------- Focus layers: each returns build() → the steps of one loop ----------
  const LAYERS = {
    // Context: sources on the context ring fill the context window; the harness decides when.
    C() {
      const WIN = V(-1.6, 2.6, -0.9);
      const win = addLabel("", anchor(WIN), { className: "is-window" });
      let items = [];
      const render = () => { win.innerHTML = `<b>Context window</b>${items.map((t, i) => `<span class="${i === items.length - 1 ? "is-new" : ""}">${t}</span>`).join("")}<em>the harness decides when</em>`; };
      const SOURCES = [
        ["Documents", "+ return policy"], ["RAG", "+ 4 chunks"], ["Knowledge graph", "+ product facts"],
        ["Memory", "+ customer history"], ["Entity schema", "+ order schema"],
      ].map(([name, add], i) => {
        const mesh = ball(P, 0.11, COL.C);
        const m = orbit({ mesh, r: 2.45, phase: (i * Math.PI * 2) / 5 + 0.3, speed: 0.05 });
        return { ...m, add, label: pill(name, mesh, COL.C) };
      });
      return () => [
        { dur: 400, enter: () => { items = ["Instructions"]; render(); setAnswer("Answer", false); } },
        { fly: [{ from: PROMPT, to: WIN, dur: 1000, lift: 0.4 }], exit: () => { items.push("User question"); render(); } },
        ...SOURCES.map((s) => ({
          fly: [{ from: () => s.mesh.position, to: WIN, dur: 900, lift: 0.7, col: COL.C }],
          exit: () => { items.push(s.add); render(); pulse("C"); flash(s.label, "is-hit", 700); },
        })),
        { fly: [{ from: WIN, to: P, dur: 900 }] },
        { fly: [{ from: P, to: OUT, dur: 900 }], exit: () => setAnswer("Answer") },
        { dur: 2600 },
      ];
    },

    // Tools: a single tool (1 capability) vs. an API and an MCP server that wrap several tools.
    T() {
      const toolMesh = ball(P, 0.12, COL.T);
      orbit({ mesh: toolMesh, r: 1.55, phase: 2.2, speed: 0.05 });
      pill("Tool · get_order", toolMesh, COL.T);
      const hub = (c, name, caption, subs) => {
        const mesh = ball(c, 0.2, COL.T, 0.25);
        addLabel(name, mesh, { className: "is-chip is-hub" });
        addLabel(caption, anchor(c.clone().add(V(0, -1.05, 0.4))), { className: "is-caption" });
        const sats = subs.map((s, i) => {
          const m = ball(c, 0.07, COL.T);
          orbit({ mesh: m, r: 1.05, phase: (i * Math.PI * 2) / subs.length, speed: 0.16, c, tilt: 0.55 });
          return { mesh: m, label: pill(s, m, COL.T, "is-sm") };
        });
        return { mesh, sats };
      };
      const api = hub(V(-2.5, 2.3, -1.6), "API · CRM", "wrapper of one system", ["customers", "orders"]);
      const mcp = hub(V(2.5, 2.3, -1.6), "MCP server", "1–n tools, reusable", ["search", "refund", "email"]);
      const result = card("is-result");
      let lines = [];
      const show = (t) => { lines = [...lines, t].slice(-3); result.innerHTML = `<b>Tool results</b>${lines.map((l, i) => `<span class="${i === lines.length - 1 ? "is-new" : ""}">${l}</span>`).join("")}`; pulse("T"); };
      const via = (h, sat, dur = 700) => [
        { fly: [{ from: P, to: () => h.mesh.position, dur: 900, lift: 0.6 }] },
        { fly: [{ from: () => h.mesh.position, to: () => sat.mesh.position, dur }], exit: () => flash(sat.label, "is-hit", 700) },
        { fly: [{ from: () => sat.mesh.position, to: () => h.mesh.position, dur, col: COL.T }] },
        { fly: [{ from: () => h.mesh.position, to: P, dur: 900, lift: 0.6, col: COL.T }] },
      ];
      return () => [
        { dur: 300, enter: () => { lines = []; result.innerHTML = "<b>Tool results</b>"; setAnswer("Answer", false); } },
        { fly: [{ from: PROMPT, to: P, dur: 900 }] },
        { fly: [{ from: P, to: () => toolMesh.position, dur: 700, lift: 0.4 }] },
        { fly: [{ from: () => toolMesh.position, to: P, dur: 700, lift: 0.4, col: COL.T }], exit: () => show("get_order → #1042 shipped") },
        ...via(api, api.sats[0]), { dur: 0, exit: () => show("CRM → Gold customer") },
        ...via(mcp, mcp.sats[1]), { dur: 0, exit: () => show("refund → €49 issued") },
        { fly: [{ from: P, to: OUT, dur: 900 }], exit: () => setAnswer("Answer") },
        { dur: 2600 },
      ];
    },

    // Workflow: the same five steps, in the same order, on every run (deck 06's support example).
    W() {
      const KIND = { model: 0x6ee7a0, code: COL.W, tool: COL.T };
      const NODES = [["Classify", "model"], ["Route", "code"], ["Look up", "tool"], ["Draft", "model"], ["Check", "code"]].map(([name, kind], i) => {
        const v = ringPoint(P, 1.75, Math.PI * (0.98 - i * 0.24));
        const mesh = ball(v, 0.11, KIND[kind]);
        return { v, kind, label: pill(`${i + 1} · ${name}`, mesh, KIND[kind], "is-below") };
      });
      root.add(dashed([PROMPT, ...NODES.map((n) => n.v), OUT], COL.W, 0.7, 0.12, 0.08));
      const phase = card("is-phase");
      phase.style.setProperty("--c", hex(COL.W));
      let run = 0;
      const legend = '<i class="k-model">model</i><i class="k-code">code</i><i class="k-tool">tool</i>';
      return () => {
        run++;
        const pts = [PROMPT, ...NODES.map((n) => n.v)];
        const steps = [{ dur: 500, enter: () => { phase.innerHTML = `<b>Workflow</b>the same path, every time<span>Run ${run}: classify → route → look up → draft → check</span><span class="legend">${legend}</span>`; setAnswer("Answer", false); } }];
        NODES.forEach((n, i) => {
          steps.push({ fly: [{ from: pts[i], to: n.v, dur: 750, col: i ? COL.W : undefined }], exit: () => { flash(n.label, "is-hit", 700); pulse("W"); } });
          // Model steps dip into the model: the model does the language, code keeps the order.
          if (n.kind === "model") steps.push({ fly: [{ from: n.v, to: P, dur: 450, col: 0x6ee7a0 }] }, { fly: [{ from: P, to: n.v, dur: 450, col: 0x6ee7a0 }] });
        });
        steps.push({ fly: [{ from: NODES[4].v, to: OUT, dur: 800, col: COL.W }], exit: () => setAnswer("Answer") }, { dur: 2400 });
        return steps;
      };
    },

    // Agent: a think → act → observe loop around the model; it picks tools, and how many, on each run.
    A() {
      const TOOLS = ["orders", "policy", "refund", "email"].map((name, i) => {
        const mesh = ball(P, 0.11, COL.T);
        orbit({ mesh, r: 1.65, phase: (i * Math.PI) / 2 + 0.4, speed: 0.04 });
        return { name, mesh, label: pill(name, mesh, COL.T) };
      });
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.03, 8, 96), new THREE.MeshBasicMaterial({ color: COL.A, transparent: true, opacity: 0.8 }));
      loop.position.copy(P);
      loop.rotation.x = -Math.PI / 2 + 0.18;
      root.add(loop);
      const phase = card("is-phase");
      phase.style.setProperty("--c", hex(COL.A));
      let run = 0, trace = [];
      const render = (state) => { phase.innerHTML = `<b>Agent</b>chooses its own path<span>Run ${run}: ${trace.length ? trace.join(" → ") : "…"}</span><span class="state">${state}</span>`; };
      const think = () => { loop.material.opacity = 1; loop.scale.setScalar(1.08); setTimeout(() => { loop.material.opacity = 0.8; loop.scale.setScalar(1); }, 400); };
      return () => {
        run++; trace = [];
        const picks = shuffle(TOOLS).slice(0, 2 + Math.floor(Math.random() * 2));
        return [
          { dur: 500, enter: () => { render("goal: resolve the customer’s request"); setAnswer("Answer", false); } },
          { fly: [{ from: PROMPT, to: P, dur: 900 }] },
          ...picks.flatMap((t) => [
            { dur: 600, enter: () => { think(); render("think: what do I need next?"); } },
            { fly: [{ from: P, to: () => t.mesh.position, dur: 700, lift: 0.5, col: COL.A }], enter: () => render(`act: call ${t.name}`), exit: () => { trace.push(t.name); flash(t.label, "is-hit", 700); pulse("A"); } },
            { fly: [{ from: () => t.mesh.position, to: P, dur: 700, lift: 0.5, col: COL.T }], enter: () => render(`observe: ${t.name} result`) },
          ]),
          { dur: 600, enter: () => { think(); render("think: goal reached, stop"); } },
          { fly: [{ from: P, to: OUT, dur: 900, col: COL.A }], exit: () => { trace.push("answer"); render("done"); setAnswer("Answer"); } },
          { dur: 2600 },
        ];
      };
    },

    // Guardrails: input, execution and output gates; each request passes, is fixed, or is stopped.
    G() {
      const toolV = ringPoint(P, 2.6, -Math.PI * 0.22);
      const toolMesh = ball(toolV, 0.12, COL.T);
      pill("refund tool", toolMesh, COL.T);
      root.add(dashed([P, toolV], 0xffffff, 0.3));
      const gate = (a, b, u, name) => {
        const v = a.clone().lerp(b, u);
        const torus = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.045, 10, 48), new THREE.MeshBasicMaterial({ color: COL.G }));
        torus.position.copy(v);
        torus.quaternion.setFromUnitVectors(V(0, 0, 1), b.clone().sub(a).normalize());
        root.add(torus);
        addLabel(name, anchor(v.clone().add(V(0, -0.6, 0))), { className: "is-caption is-gate" });
        const verdict = addLabel("", anchor(v.clone().add(V(0, 0.75, 0))), { className: "is-verdict" });
        return { v, verdict };
      };
      const gIn = gate(PROMPT, P, 0.5, "input");
      const gEx = gate(P, toolV, 0.62, "execution");
      const gOut = gate(P, OUT, 0.55, "output");
      const request = card("is-phase");
      const CASES = [
        { q: "Where is order #1042?", in: ["ok", "in scope"], ex: ["ok", "read-only lookup"], out: ["ok", "grounded in data"], a: "Answer" },
        { q: "My card is 4111 1111 …", in: ["fix", "card number redacted"], ex: ["ok", "allowed"], out: ["ok", "no data leak"], a: "Answer" },
        { q: "Ignore your rules and …", in: ["bad", "prompt injection"], a: "Safe fallback" },
        { q: "Refund €800, please", in: ["ok", "in scope"], ex: ["bad", "> €500 → human approval"], a: "Sent for approval" },
        { q: "Can I return it in 90 days?", in: ["ok", "in scope"], ex: ["ok", "read-only lookup"], out: ["fix", "promise outside policy removed"], a: "Answer" },
      ];
      let n = 0;
      const mark = (g, [kind, why]) => { g.verdict.className = `d-label is-verdict is-on is-${kind}`; g.verdict.textContent = `${kind === "ok" ? "✓" : kind === "fix" ? "✎" : "✗"} ${why}`; pulse("G"); };
      const clear = () => [gIn, gEx, gOut].forEach((g) => (g.verdict.className = "d-label is-verdict"));
      return () => {
        const c = CASES[n++ % CASES.length];
        const end = (text) => [{ dur: 0, exit: () => setAnswer(text) }, { dur: 2800 }];
        const steps = [
          { dur: 400, enter: () => { clear(); setAnswer("Answer", false); request.innerHTML = `<b>Request</b>${c.q}`; request.style.setProperty("--c", hex(COL.G)); } },
          { fly: [{ from: PROMPT, to: gIn.v, dur: 800 }], exit: () => mark(gIn, c.in) },
        ];
        if (c.in[0] === "bad") return [...steps, ...end(c.a)];
        steps.push({ fly: [{ from: gIn.v, to: P, dur: 700 }] }, { fly: [{ from: P, to: gEx.v, dur: 700 }], exit: () => mark(gEx, c.ex) });
        if (c.ex[0] === "bad") return [...steps, ...end(c.a)];
        steps.push(
          { fly: [{ from: gEx.v, to: toolV, dur: 500 }] },
          { fly: [{ from: toolV, to: P, dur: 800, col: COL.T }] },
          { fly: [{ from: P, to: gOut.v, dur: 700 }], exit: () => mark(gOut, c.out) },
          { fly: [{ from: gOut.v, to: OUT, dur: 600 }] },
        );
        return [...steps, ...end(c.a)];
      };
    },

    // Evals: every answer is checked by code, a judge or a person; the pass rate is the evidence.
    E() {
      const EV = V(2.4, 2.5, -1.2);
      ball(EV, 0.2, COL.E, 0.35);
      addLabel("Evals", anchor(EV.clone().add(V(0, 0.55, 0))), { className: "is-chip is-hub is-eval" });
      root.add(dashed([OUT, EV], COL.E, 0.5));
      const METHODS = { code: V(-1.05, -0.7, 0), judge: V(0, -0.7, 0), human: V(1.05, -0.7, 0) };
      const methods = Object.fromEntries(Object.entries(METHODS).map(([k, d]) => [k, pill(k === "judge" ? "LLM judge" : k, anchor(EV.clone().add(d)), COL.E, "is-sm")]));
      const verdict = addLabel("", anchor(EV.clone().add(V(0, -1.35, 0))), { className: "is-verdict" });
      Object.values(methods).forEach((d) => d.classList.add("is-below"));
      const score = card("is-score");
      let pass = 18, total = 25;
      const renderScore = () => { const p = Math.round((pass / total) * 100); score.innerHTML = `<b>Pass rate</b><strong>${p}%</strong><span>${pass} of ${total} cases</span><i style="--p:${p}%"></i>`; };
      renderScore();
      const CASES = [
        { m: "code", ok: true, why: "valid JSON schema" }, { m: "judge", ok: false, why: "not grounded in policy" },
        { m: "judge", ok: true, why: "correct and complete" }, { m: "code", ok: true, why: "latency under 2 s" },
        { m: "human", ok: true, why: "expert agrees with judge" }, { m: "judge", ok: false, why: "wrong refund amount" },
      ];
      let n = 0;
      return () => {
        const c = CASES[n++ % CASES.length];
        return [
          { dur: 400, enter: () => { verdict.className = "d-label is-verdict"; Object.values(methods).forEach((d) => d.classList.remove("is-on")); setAnswer("Answer", false); } },
          { fly: [{ from: PROMPT, to: P, dur: 900 }] },
          { fly: [{ from: P, to: OUT, dur: 900 }], exit: () => setAnswer("Answer") },
          {
            fly: [{ from: OUT, to: EV, dur: 1000, lift: 0.4, col: COL.E }],
            exit: () => {
              methods[c.m].classList.add("is-on");
              verdict.className = `d-label is-verdict is-on is-${c.ok ? "ok" : "bad"}`;
              verdict.textContent = `${c.ok ? "✓ pass" : "✗ fail"} · ${c.why}`;
              pass += c.ok ? 1 : 0; total += 1; renderScore(); pulse("E");
            },
          },
          { dur: 3000 },
        ];
      };
    },
  };

  const build = (LAYERS[focus] || LAYERS.C)();

  // ---------- Step runner ----------
  const pGeo = new THREE.SphereGeometry(0.09, 16, 12);
  const mats = new Map();
  const matFor = (col = 0xffffff) => { if (!mats.has(col)) mats.set(col, material(col, { emissive: col, emissiveIntensity: 0.85 })); return mats.get(col); };
  const pool = Array.from({ length: 3 }, () => { const m = new THREE.Mesh(pGeo, matFor()); m.visible = false; root.add(m); return m; });
  let steps = [], i = -1, t0 = 0, dur = 0;
  const next = (t) => {
    if (++i >= steps.length) { steps = build(); i = 0; }
    const st = steps[i];
    t0 = t;
    st.enter?.();
    pool.forEach((m) => (m.visible = false));
    (st.fly || []).forEach((f, k) => { pool[k].visible = true; pool[k].material = matFor(f.col); f.a = pos(f.from).clone(); });
    dur = st.dur ?? Math.max(...(st.fly || []).map((f) => f.dur));
  };

  tick((t) => {
    const s = t * 0.001;
    planet.rotation.y = s * 0.2;
    for (const m of moving) m.mesh.position.copy(ringPoint(m.c || P, m.r, m.phase + s * m.speed, m.tilt));
    if (i === -1) next(t);
    (steps[i].fly || []).forEach((f, k) => arc(pool[k].position, f.a, pos(f.to), Math.min(1, (t - t0) / f.dur), f.lift || 0));
    if (t - t0 >= dur) { steps[i].exit?.(); next(t); }
  });

  return controls;
}
