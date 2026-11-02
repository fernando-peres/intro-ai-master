// Context engineering as a planet system (slide 28). Harness and context are zones on the rings.
// The model is the planet; the harness layers are tilted rings around it. Five sources (Tools, Memory,
// Agents, RAG, Knowledge) are moons on their own orbits. Each moon periodically sends a glowing packet to
// the context window (a station on the near side), which then streams into the model. The user prompt
// arrives along a lane from the left. Camera looks down ~25° and sways slowly so the scene reads as 3D.
import { THREE, createStage, material } from "./lib.js";

const P = new THREE.Vector3(1.6, -0.15, 0); // planet centre
const WIN = new THREE.Vector3(-1.4, -0.6, 1.6); // context window station (near side)
const PROMPT = new THREE.Vector3(-3.35, -0.6, 1.6);
// Moons orbit in the ring plane, in the zone where each source lives:
// harness (green) = agents, workflows · frontier = tools, MCP · context (pale) = memory, RAG, knowledge.
const PLANE = -0.18; // same tilt as the rings
const MOONS = [
  { name: "Agents", col: 0xf08a7e, r: 1.75, speed: 0.16, phase: 0.6, add: "+ agent output", zone: "harness" },
  { name: "Workflows", col: 0xffb86b, r: 1.75, speed: 0.16, phase: 3.74, add: "+ workflow step", zone: "harness" },
  { name: "Tools", col: 0xf2c94c, r: 2.25, speed: 0.11, phase: 1.9, add: "+ tool result", zone: "frontier" },
  { name: "MCP", col: 0x7fe0e8, r: 2.25, speed: 0.11, phase: 5.04, add: "+ MCP data", zone: "frontier" },
  { name: "Memory", col: 0x7fb3ff, r: 2.9, speed: 0.075, phase: 0.2, add: "+ memory", zone: "context" },
  { name: "RAG", col: 0x6ee7a0, r: 2.9, speed: 0.075, phase: 2.3, add: "+ 4 chunks", zone: "context" },
  { name: "Knowledge", col: 0xc3b6ff, r: 2.9, speed: 0.075, phase: 4.4, add: "+ graph facts", zone: "context" },
];

function dashed(points, color, dash = 0.1, gap = 0.08, opacity = 1) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap, transparent: opacity < 1, opacity }),
  );
  line.computeLineDistances();
  return line;
}
const orbitPoint = (m, a) => {
  // circle in the ring plane (XZ tilted around X)
  const x = Math.cos(a) * m.r, z = Math.sin(a) * m.r;
  return new THREE.Vector3(P.x + x, P.y + z * Math.sin(PLANE), P.z + z * Math.cos(PLANE));
};

export function mount(el) {
  const { root, tick, addLabel, controls } = createStage(el, { fov: 34, position: [0.6, 5.6, 10.2], target: [0.4, -0.45, 0], spin: false });
  const anchor = (v) => { const o = new THREE.Object3D(); o.position.copy(v); root.add(o); return o; };

  // ---------- Planet (model) ----------
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 64, 48),
    new THREE.MeshPhysicalMaterial({ color: 0x0f4a35, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, metalness: 0.1, emissive: 0x06261b, emissiveIntensity: 0.4 }),
  );
  planet.position.copy(P);
  root.add(planet);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 32), new THREE.MeshBasicMaterial({ color: 0x6ee7a0, transparent: true, opacity: 0.12, side: THREE.BackSide }));
  atmo.position.copy(P);
  root.add(atmo);
  addLabel("MODEL", anchor(P.clone().add(new THREE.Vector3(0, 0, 1.2))), { className: "is-ring is-model" });

  // Harness layers as planetary rings (tilted discs).
  const ring = (rIn, rOut, color, opacity, tiltX) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(rIn, rOut, 160), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide }));
    m.position.copy(P);
    m.rotation.x = -Math.PI / 2 + tiltX;
    root.add(m);
    return m;
  };
  ring(1.3, 2.15, 0x5fca9b, 0.22, 0.18); // harness
  ring(2.35, 3.35, 0xcdf3df, 0.07, 0.18); // context
  ring(2.23, 2.27, 0xffffff, 0.75, 0.18); // frontier between harness and context
  const ctrl = ring(1.15, 1.18, 0x9be3bc, 0.9, 0.18); // adaptive control (thin)
  const onRing = (r, deg) => { const a = (deg * Math.PI) / 180, z = Math.sin(a) * r; return P.clone().add(new THREE.Vector3(Math.cos(a) * r, -z * Math.sin(0.18), z * Math.cos(0.18))); };
  addLabel("HARNESS", anchor(onRing(1.8, 80)), { className: "is-ring is-zone" });
  addLabel("CONTEXT", anchor(onRing(3.1, 60)), { className: "is-ring is-zone is-pale" });
  addLabel("frontier", anchor(onRing(2.25, 4).add(new THREE.Vector3(0.42, 0, 0))), { className: "is-ring is-frontier" });

  // ---------- Moons (sources) ----------
  const moons = MOONS.map((m) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(m.zone === "harness" ? 0.17 : 0.2, 32, 24), material(m.col, { roughness: 0.35, emissive: m.col, emissiveIntensity: 0.35 }));
    root.add(mesh);
    const lab = addLabel(m.name, mesh, { className: "is-src", offset: [0, 0.36, 0] });
    lab.style.setProperty("--moon", "#" + m.col.toString(16).padStart(6, "0"));
    return { ...m, mesh, packets: [] };
  });

  // ---------- Context window station + request lane ----------
  const station = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), material(0x6ee7a0, { emissive: 0x2f9c6b, emissiveIntensity: 0.5, transparent: true, opacity: 0.0 }));
  station.position.copy(WIN);
  root.add(station);
  const win = addLabel("", station, { className: "is-window" });
  const ITEMS = ["Instructions (prompt)"];
  const renderWin = (flash) => {
    win.innerHTML = `<b>Context window</b>${ITEMS.slice(-8).map((t, i, a) => `<span class="${flash && i === a.length - 1 ? "is-new" : ""}">${t}</span>`).join("")}`;
  };
  renderWin(false);

  addLabel("User prompt", anchor(PROMPT), { className: "is-chip" });
  const pGeo = new THREE.SphereGeometry(0.06, 12, 10);
  const white = material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 });
  const lanes = [];
  const lane = (a, b, n, speed) => {
    const curve = new THREE.LineCurve3(a, b);
    root.add(dashed(curve.getPoints(30), 0xffffff, 0.12, 0.1, 0.6));
    for (let j = 0; j < n; j++) { const m = new THREE.Mesh(pGeo, white); root.add(m); lanes.push({ curve, m, phase: j / n, speed }); }
  };
  lane(PROMPT.clone().add(new THREE.Vector3(0.8, 0, 0)), WIN.clone().add(new THREE.Vector3(-1.3, 0, 0)), 1, 0.0005);
  // window → planet stream
  const feed = new THREE.QuadraticBezierCurve3(WIN.clone().add(new THREE.Vector3(1.3, 0.1, 0)), new THREE.Vector3(0.6, 0.4, 1.4), P.clone().add(new THREE.Vector3(-0.85, 0.05, 0.45)));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(feed, 48, 0.07, 12), new THREE.MeshBasicMaterial({ color: 0x6ee7a0, transparent: true, opacity: 0.35 })));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(feed, 48, 0.025, 8), new THREE.MeshBasicMaterial({ color: 0xcdf3df })));
  addLabel("feeds the model", anchor(feed.getPoint(0.3).add(new THREE.Vector3(0, -0.4, 0.2))), { className: "is-feed" });
  for (let j = 0; j < 3; j++) { const m = new THREE.Mesh(pGeo, white); root.add(m); lanes.push({ curve: feed, m, phase: j / 3, speed: 0.0006 }); }

  // ---------- Output: after every source has delivered, the model generates an answer ----------
  const OUT = P.clone().add(new THREE.Vector3(1.05, -1.4, 2.35));
  const outCurve = new THREE.QuadraticBezierCurve3(P.clone().add(new THREE.Vector3(0.7, -0.3, 0.6)), P.clone().add(new THREE.Vector3(1.6, -1.0, 2.2)), OUT);
  const outLine = new THREE.Mesh(new THREE.TubeGeometry(outCurve, 40, 0.025, 8), new THREE.MeshBasicMaterial({ color: 0xf2c94c, transparent: true, opacity: 0 }));
  root.add(outLine);
  const outBall = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), material(0xf2c94c, { emissive: 0xf2c94c, emissiveIntensity: 1 }));
  outBall.visible = false;
  root.add(outBall);
  const outLabel = addLabel("", anchor(OUT), { className: "is-output" });
  const ANSWERS = [
    "“Yes, you can return it until 11 Nov. I’ve emailed you a free return label.”",
    "“Your Trail Shell isn’t affected by recall R-17. Re-proof it once a season.”",
    "“Booked: pickup Thursday 10–12h. Refund of €189 within 5 days.”",
  ];
  let phase = "collect", phaseT = 0, answerN = 0;

  // ---------- Packets: moon → window, one moon at a time ----------
  const packetGeo = new THREE.SphereGeometry(0.11, 16, 12);
  const flights = [];
  let nextLaunch = 0, turn = 0;
  const launch = (t) => {
    const m = moons[turn++ % moons.length];
    const from = m.mesh.position.clone(), to = WIN.clone().add(new THREE.Vector3(0.9, 0.15, 0));
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 1.4, 0.4));
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const mesh = new THREE.Mesh(packetGeo, material(m.col, { emissive: m.col, emissiveIntensity: 0.9 }));
    const trail = dashed(curve.getPoints(40), m.col, 0.06, 0.06, 0.7);
    root.add(mesh, trail);
    flights.push({ m, curve, mesh, trail, t0: t });
  };

  // ---------- Animation ----------
  tick((t) => {
    const s = t * 0.001;
    root.rotation.y = Math.sin(s * 0.25) * 0.12; // gentle orbit sway
    planet.rotation.y = s * 0.2;
    planet.scale.setScalar(1 + Math.sin(s * 1.8) * 0.02);
    ctrl.rotation.z = s * 0.15;
    for (const m of moons) m.mesh.position.copy(orbitPoint(m, m.phase + s * m.speed));
    for (const l of lanes) {
      const u = (t * l.speed + l.phase) % 1;
      l.m.position.copy(l.curve.getPoint(u));
      l.m.scale.setScalar(0.5 + Math.sin(u * Math.PI) * 0.8);
    }
    if (phase === "collect" && t > nextLaunch && turn < moons.length * (answerN + 1)) { launch(t); nextLaunch = t + 1300; }
    if (phase === "collect" && turn >= moons.length * (answerN + 1) && !flights.length) { phase = "generate"; phaseT = t; outBall.visible = true; }
    if (phase === "generate") {
      const u = Math.min(1, (t - phaseT) / 1600);
      outBall.position.copy(outCurve.getPoint(u));
      outLine.material.opacity = 0.7 * u;
      if (u >= 1) {
        phase = "show"; phaseT = t; outBall.visible = false;
        outLabel.innerHTML = `<b>Model output</b>${ANSWERS[answerN % ANSWERS.length]}`;
        outLabel.classList.add("is-on");
      }
    }
    if (phase === "show" && t - phaseT > 4500) {
      phase = "collect"; answerN++; nextLaunch = t + 400;
      outLabel.classList.remove("is-on"); outLine.material.opacity = 0;
      ITEMS.length = 1; renderWin(false);
    }
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i], u = (t - f.t0) / 1400;
      if (u >= 1) {
        root.remove(f.mesh, f.trail);
        ITEMS.push(f.m.add);
        renderWin(true);
        flights.splice(i, 1);
      } else {
        f.mesh.position.copy(f.curve.getPoint(u));
        f.trail.material.opacity = 0.7 * (1 - u);
      }
    }
  });

  return controls;
}
