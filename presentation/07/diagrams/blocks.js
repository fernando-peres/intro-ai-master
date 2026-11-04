// Building blocks of a GenAI system (slide 2). The model is the planet inside the harness ring; block badges
// orbit in the ring, wrapped by the context and observability rings. One request loops: prompt → G → context
// window (C) → model → T/W/A/G → E → G → answer, then feedback returns to the harness and starts an experiment (X, upper right).
// There, candidate T/W/A/G badges orbit; a validated one flies into the harness and retires the old one of its type.
// Badges with the same letter on the slide's cards (.blk-badge[data-blk]) pulse in sync.
// data-view="obs" | "exp" (slides 9–10): wide framing, no experiments orbit, and an HTML panel (panels.js)
// fed by the request; in "exp" the panel promotes validated badges from below via promote(id).
import { THREE, createStage, material } from "./lib.js";
import { TILT, COL, hex, ringPoint as kitPoint, addRing, dashed, flash, pulseCards } from "./kit.js";
import { obsPanel, expPanel } from "./panels.js";

const P = new THREE.Vector3(0.3, -0.3, 0); // model
const PROMPT = new THREE.Vector3(-4.75, -0.3, 1.3);
const G_IN = new THREE.Vector3(-3.85, -0.3, 1.3);
const WIN = new THREE.Vector3(-1.3, 1.95, -0.6);
const G_OUT = new THREE.Vector3(4.4, -0.3, 1.3);
const OUT = new THREE.Vector3(4.85, -1.5, 1.8);
const EXP = new THREE.Vector3(3.3, 2.75, -1.4); // experiments orbit centre
const R_EXP = 1.0, EXP_TILT = 0.55; // tilted towards the camera so the small orbit reads

const MOONS = ["T", "W", "A", "G", "E"].map((id, i) => ({ id, phase: 0.4 + (i * Math.PI * 2) / 5 }));
const CANDIDATES = ["T", "W", "A", "G"]; // block types an experiment can promote
const R_MOON = 1.78, R_CTX = 2.82, R_OBS = 3.5, MOON_SPEED = 0.06;

const ringPoint = (r, a, c = P, tilt = TILT) => kitPoint(c, r, a, tilt);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function mount(el) {
  const view = el.dataset.view;
  const camera = view ? { fov: 24, position: [0.3, 6.4, 17.5], target: [0.3, 0.15, 0] } : { fov: 36, position: [0.2, 7.2, 15.0], target: [0.2, -0.1, 0] };
  const { root, tick, addLabel, controls } = createStage(el, { ...camera, spin: false });
  const anchor = (v) => { const o = new THREE.Object3D(); o.position.copy(v); root.add(o); return o; };
  const stage = el.closest(".stage");

  // ---------- Model + harness ----------
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 64, 48),
    new THREE.MeshPhysicalMaterial({ color: 0x0f4a35, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, metalness: 0.1, emissive: 0x06261b, emissiveIntensity: 0.4 }),
  );
  planet.position.copy(P);
  root.add(planet);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(0.92, 48, 32), new THREE.MeshBasicMaterial({ color: 0x6ee7a0, transparent: true, opacity: 0.12, side: THREE.BackSide }));
  atmo.position.copy(P);
  root.add(atmo);
  addLabel("MODEL", anchor(P.clone().add(new THREE.Vector3(0, 0.05, 0.8))), { className: "is-ring is-model" });

  const ring = (rIn, rOut, color, opacity, c = P, tilt = TILT) => addRing(root, c, rIn, rOut, color, opacity, tilt);
  ring(1.1, 2.32, 0x5fca9b, 0.22); // harness
  ring(2.36, 3.2, 0xcdf3df, 0.08); // context
  ring(2.3, 2.34, 0x6ee7a0, 0.9); // frontier between harness and context
  addLabel("HARNESS", anchor(ringPoint(2.1, Math.PI / 2 + 0.6)), { className: "is-ring is-zone is-harness" });
  addLabel("CONTEXT", anchor(ringPoint(3.0, Math.PI / 2 - 0.4)), { className: "is-ring is-zone is-pale" });

  // Observability: the outermost ring, around harness and context; it sees every step.
  ring(3.24, 3.78, COL.O, 0.06);
  ring(3.22, 3.24, COL.O, 0.35); // frontier between context and observability
  const obsPts = Array.from({ length: 161 }, (_, i) => ringPoint(3.79, (i / 160) * Math.PI * 2));
  root.add(dashed(obsPts, COL.O, 0.6, 0.08, 0.1));
  addLabel("OBSERVABILITY", anchor(ringPoint(3.5, Math.PI / 2 + 0.35)), { className: "is-ring is-zone is-obs" });
  // Experiments: a small orbit of its own, above right, fed by feedback (slide 2 only).
  if (!view) {
    ring(R_EXP - 0.3, R_EXP + 0.3, COL.X, 0.1, EXP, EXP_TILT);
    ring(R_EXP + 0.3, R_EXP + 0.32, COL.X, 0.7, EXP, EXP_TILT);
    addLabel("EXPERIMENTS", anchor(ringPoint(R_EXP + 0.6, Math.PI / 2, EXP, EXP_TILT)), { className: "is-ring is-zone is-exp" });
  }
  const obsMesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  root.add(obsMesh);

  // ---------- Badges ----------
  const badges = {}; // id → [label divs]
  const badge = (id, object) => {
    const div = addLabel(id, object, { className: "is-badge" });
    div.style.setProperty("--c", hex(COL[id]));
    (badges[id] ||= []).push(div);
    return div;
  };
  // A moon lives in the harness orbit ("harness"), the experiments orbit ("exp"), or is in transit.
  const moons = [];
  const makeMoon = (id, where, phase) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), material(COL[id], { emissive: COL[id], emissiveIntensity: 0.5 }));
    root.add(mesh);
    const div = addLabel(id, mesh, { className: "is-badge" });
    const m = { id, where, phase, mesh, div };
    setId(m, id);
    moons.push(m);
    return m;
  };
  const setId = (m, id) => {
    m.id = id;
    m.div.textContent = id;
    m.div.style.setProperty("--c", hex(COL[id]));
    m.mesh.material.color.setHex(COL[id]);
    m.mesh.material.emissive.setHex(COL[id]);
    m.div.classList.toggle("is-cand", m.where === "exp");
  };
  MOONS.forEach((m) => makeMoon(m.id, "harness", m.phase));
  if (!view) CANDIDATES.slice(0, 3).forEach((id, i) => makeMoon(id, "exp", (i * Math.PI * 2) / 3));
  const harnessMoon = (id) => moons.find((m) => m.where === "harness" && m.id === id);
  const ctxMoon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), material(COL.C, { emissive: COL.C, emissiveIntensity: 0.5 }));
  root.add(ctxMoon);
  badge("C", ctxMoon);
  badge("O", obsMesh);
  if (!view) badge("X", anchor(EXP));

  // ---------- Input, context window, output ----------
  addLabel("Prompt", anchor(PROMPT), { className: "is-chip" });
  addLabel("user · input", anchor(PROMPT.clone().add(new THREE.Vector3(0, 0.55, 0))), { className: "is-caption" });
  const gIn = anchor(G_IN), gOut = anchor(G_OUT);
  badge("G", gIn);
  badge("G", gOut);

  const win = addLabel("", anchor(WIN), { className: "is-window" });
  const WIN_ITEMS = ["Instructions", "Knowledge", "Memory", "Tool specs"];
  const renderWin = (n) => {
    win.innerHTML = `<b>Context window</b>${WIN_ITEMS.map((t, i) => `<span class="${i < n ? "is-new" : ""}">${t}</span>`).join("")}`;
  };
  renderWin(0);
  badge("C", anchor(WIN.clone().add(new THREE.Vector3(-1.8, 0.05, 0))));

  const outChip = addLabel("Answer", anchor(OUT), { className: "is-chip is-out" });
  addLabel("user · output", anchor(OUT.clone().add(new THREE.Vector3(0, -0.55, 0))), { className: "is-caption" });

  // Static lanes.
  const lanes = [
    [PROMPT.clone().add(new THREE.Vector3(0.55, 0, 0)), G_IN],
    [G_IN, WIN.clone().add(new THREE.Vector3(-0.4, -0.5, 0))],
    [WIN.clone().add(new THREE.Vector3(0.3, -0.5, 0)), P],
    [P, G_OUT],
    [G_OUT, OUT],
  ];
  for (const [a, b] of lanes) root.add(dashed([a, b], 0xffffff, 0.45));

  const FB_END = ringPoint(2.15, -0.2); // feedback re-enters the harness
  const fbCurve = new THREE.QuadraticBezierCurve3(OUT.clone().add(new THREE.Vector3(0.25, 0.3, 0)), new THREE.Vector3(5.6, 1.1, 0.4), FB_END);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(fbCurve, 48, 0.02, 8), new THREE.MeshBasicMaterial({ color: COL.F, transparent: true, opacity: 0.75 })));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 16), new THREE.MeshBasicMaterial({ color: COL.F }));
  head.position.copy(FB_END);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fbCurve.getTangent(1).normalize());
  root.add(head);
  addLabel("Feedback", anchor(fbCurve.getPoint(0.45).add(new THREE.Vector3(0.1, 0.45, 0))), { className: "is-feed" });

  // ---------- Pulses (diagram + slide cards) ----------
  const pulse = (id) => {
    for (const d of badges[id] || []) flash(d, "is-pulse", 900);
    for (const m of moons) if (m.where === "harness" && m.id === id) flash(m.div, "is-pulse", 900);
    pulseCards(stage, id);
    if (id !== "O") pulse("O");
  };

  // ---------- Request timeline ----------
  const at = (v) => () => v;
  const moonAt = (id) => () => harnessMoon(id).mesh.position;
  const STEPS = [
    [{ from: at(PROMPT), to: at(G_IN), dur: 900, hit: "G" }],
    [{ from: at(G_IN), to: at(WIN), dur: 1000, hit: "C", lift: 0.3 }],
    [{ from: at(WIN), to: at(P), dur: 900 }],
    ["T", "W", "A", "G"].map((id) => ({ from: at(P), to: moonAt(id), dur: 800, hit: id, lift: 0.5 })),
    ["T", "W", "A", "G"].map((id) => ({ from: moonAt(id), to: at(P), dur: 700, lift: 0.5 })),
    [{ from: at(P), to: moonAt("E"), dur: 800, hit: "E", lift: 0.5 }],
    [{ from: moonAt("E"), to: at(G_OUT), dur: 900, hit: "G", lift: 0.3 }],
    [{ from: at(G_OUT), to: at(OUT), dur: 700, hit: "OUT" }],
    [{ curve: fbCurve, dur: 1500, col: COL.F, hit: "FB" }],
  ];
  const pGeo = new THREE.SphereGeometry(0.09, 16, 12);
  const pMat = material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.8 });
  const fMat = material(COL.F, { emissive: COL.F, emissiveIntensity: 0.9 });
  const pool = Array.from({ length: 4 }, () => { const m = new THREE.Mesh(pGeo, pMat); m.visible = false; root.add(m); return m; });
  const tmp = new THREE.Vector3(), mid = new THREE.Vector3();
  let step = -1, stepT = 0, restUntil = 0;

  const begin = (t) => {
    step = (step + 1) % (STEPS.length + 1);
    stepT = t;
    pool.forEach((m) => (m.visible = false));
    if (step === STEPS.length) { restUntil = t + 2200; return; } // pause before the next request
    if (step === 0) { renderWin(0); outChip.classList.remove("is-on"); panel?.onRequest(t); }
    STEPS[step].forEach((_, i) => { pool[i].visible = true; pool[i].material = STEPS[step][i].col ? fMat : pMat; });
  };
  const finish = (t) => {
    const hits = STEPS[step].map((f) => f.hit).filter(Boolean);
    panel?.onSpan(hits.length ? hits : ["M"], t);
    for (const f of STEPS[step]) {
      if (f.hit === "OUT") { outChip.classList.add("is-on"); pulse("O"); }
      else if (f.hit === "FB") pulse("O");
      else if (f.hit) pulse(f.hit);
      if (f.hit === "C") renderWin(WIN_ITEMS.length);
      if (f.hit === "FB") { if (panel) panel.onFeedback(); else startEvo(t); } // feedback feeds the next experiment
    }
  };

  // ---------- Evolution: feedback → experiment → validated → harness ----------
  let evo = null; // { cand, old, phase: "validate" | "fly" | "swap", t0, from }
  const startEvo = (t) => {
    if (evo) return;
    const cand = pick(moons.filter((m) => m.where === "exp"));
    cand.div.classList.add("is-valid");
    pulse("X");
    pulse("E");
    evo = { cand, old: harnessMoon(cand.id), phase: "validate", t0: t };
  };
  const stepEvo = (t) => {
    if (!evo) return;
    const { cand, old } = evo;
    if (evo.phase === "validate" && t - evo.t0 > 1300) {
      Object.assign(evo, { phase: "fly", t0: t, from: cand.mesh.position.clone() });
      cand.where = "fly";
    } else if (evo.phase === "fly") {
      const u = Math.min(1, (t - evo.t0) / 1600), b = old.mesh.position;
      mid.copy(evo.from).lerp(b, 0.5).y += 0.9;
      cand.mesh.position.copy(evo.from).multiplyScalar((1 - u) ** 2).addScaledVector(mid, 2 * u * (1 - u)).addScaledVector(b, u * u);
      if (u >= 1) {
        // The validated candidate takes the old block's slot; the old one retires.
        cand.where = "harness"; cand.phase = old.phase;
        cand.div.classList.remove("is-valid", "is-cand");
        flash(cand.div, "is-pulse", 900);
        old.where = "retired"; old.mesh.visible = false; old.div.classList.add("is-gone");
        Object.assign(evo, { phase: "swap", t0: t });
      }
    } else if (evo.phase === "swap" && t - evo.t0 > 900) {
      // Recycle the retired object: a fresh candidate in the experiments orbit, or a hidden spare in views.
      if (view) { old.where = "spare"; evo = null; return; }
      old.where = "exp"; old.phase = Math.random() * Math.PI * 2;
      setId(old, pick(CANDIDATES));
      old.div.classList.remove("is-gone"); old.mesh.visible = true;
      evo = null;
    }
  };

  // ---------- Views: panel under the diagram; "exp" promotes validated badges from below ----------
  const LAUNCH = new THREE.Vector3(0.3, -2.6, 3.4); // just above the panel, below the harness
  const queue = [];
  const promote = (id) => queue.push(id);
  const startPromo = (id, t) => {
    const cand = moons.find((m) => m.where === "spare") || makeMoon(id, "spare", 0);
    cand.where = "launch";
    setId(cand, id);
    cand.mesh.position.copy(LAUNCH);
    cand.mesh.visible = true;
    cand.div.classList.remove("is-gone");
    cand.div.classList.add("is-cand", "is-valid");
    pulse("X");
    evo = { cand, old: harnessMoon(id), phase: "validate", t0: t };
  };
  const panel = view === "obs" ? obsPanel(stage) : view === "exp" ? expPanel(stage, promote) : null;

  tick((t) => {
    const s = t * 0.001;
    panel?.tick(t);
    if (!evo && queue.length) startPromo(queue.shift(), t);
    planet.rotation.y = s * 0.2;
    for (const m of moons) {
      if (m.where === "harness") m.mesh.position.copy(ringPoint(R_MOON, m.phase + s * MOON_SPEED));
      else if (m.where === "exp") m.mesh.position.copy(ringPoint(R_EXP, m.phase + s * 0.3, EXP, EXP_TILT));
    }
    stepEvo(t);
    ctxMoon.position.copy(ringPoint(R_CTX, 2.4 + s * 0.04));
    obsMesh.position.copy(ringPoint(R_OBS, -s * 0.12 + 1.2));

    if (step === -1) begin(t);
    if (step === STEPS.length) { if (t > restUntil) begin(t); return; }
    const flights = STEPS[step];
    const dur = Math.max(...flights.map((f) => f.dur));
    flights.forEach((f, i) => {
      const u = Math.min(1, (t - stepT) / f.dur);
      if (f.curve) pool[i].position.copy(f.curve.getPoint(u));
      else {
        const a = f.from(), b = f.to();
        mid.copy(a).lerp(b, 0.5).y += f.lift || 0;
        // quadratic bezier a → mid → b
        tmp.copy(a).multiplyScalar((1 - u) ** 2).addScaledVector(mid, 2 * u * (1 - u)).addScaledVector(b, u * u);
        pool[i].position.copy(tmp);
      }
    });
    if (t - stepT >= dur) { finish(t); begin(t); }
  });

  return controls;
}
