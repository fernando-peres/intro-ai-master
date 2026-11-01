// Context engineering inside the harness (slide 25), seen front-on.
// Rings, outer to inner: context (pale), capabilities (mint), adaptive control (dashed), model (sphere).
// On the left edge of the rings sits the context window (an HTML panel). The user's prompt flows into it,
// sources on the rings (tools, retrieval, memory, agents) feed it, and the assembled context flows to the model.
import { THREE, createStage, material } from "./lib.js";

const CX = 2.0; // ring centre (x)
const R = { model: 0.95, halo: 1.08, adaptive: 1.7, capIn: 1.12, capOut: 2.45, ctxOut: 3.05 };
const WIN = new THREE.Vector3(-1.25, 0, 0.2); // context window anchor (left edge of the rings)
const USERS = new THREE.Vector3(-4.85, 0, 0.1);
const PROMPT = new THREE.Vector3(-3.55, 0, 0.1);

const at = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const polar = (r, deg, z = 0) => at(CX + Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r, z);

function dashed(points, color, dash = 0.1, gap = 0.08) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap }),
  );
  line.computeLineDistances();
  return line;
}

export function mount(el) {
  const { root, tick, addLabel, controls } = createStage(el, { fov: 35, position: [0, 0, 12.3], spin: false });
  const anchor = (v) => {
    const o = new THREE.Object3D();
    o.position.copy(v);
    root.add(o);
    return o;
  };

  // ---------- Rings ----------
  const ring = (rIn, rOut, color, emissive, z) => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(rIn, rOut, 160),
      material(color, { roughness: 0.65, emissive, emissiveIntensity: 0.22, side: THREE.DoubleSide }),
    );
    m.position.set(CX, 0, z);
    root.add(m);
    return m;
  };
  ring(R.capOut, R.ctxOut, 0xcdf3df, 0x8fd9b2, -0.03);
  ring(R.capIn, R.capOut, 0x5fca9b, 0x2f9c6b, -0.02);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R.capOut, 0.022, 12, 160), material(0xe9fbf1, { roughness: 0.4 }));
  rim.position.x = CX;
  root.add(rim);

  // Adaptive control: a dashed ring that turns slowly.
  const pts = [];
  for (let i = 0; i <= 200; i++) pts.push(polar(R.adaptive, (i / 200) * 360, 0.01).sub(at(CX, 0)));
  const adaptive = dashed(pts, 0x1d5e43, 0.09, 0.07);
  adaptive.position.x = CX;
  root.add(adaptive);

  // Model at the centre.
  const model = new THREE.Mesh(
    new THREE.SphereGeometry(R.model, 64, 48),
    new THREE.MeshPhysicalMaterial({ color: 0x0f4a35, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15, metalness: 0.1 }),
  );
  model.position.x = CX;
  root.add(model);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(R.halo, 0.045, 16, 120), material(0x9be3bc, { transparent: true, opacity: 0.85 }));
  halo.position.x = CX;
  root.add(halo);

  // Ring names, set on the bands.
  addLabel("CONTEXT", anchor(at(CX, 2.76, 0.1)), { className: "is-ring is-dark" });
  addLabel("CAPABILITIES", anchor(at(CX, 2.08, 0.1)), { className: "is-ring is-dark" });
  addLabel("ADAPTIVE CONTROL", anchor(at(CX, 1.4, 0.1)), { className: "is-ring is-dark" });

  // Layer callouts outside the rings.
  addLabel("CONTEXTUAL LAYER", anchor(polar(R.ctxOut + 0.25, 132)), { className: "is-layer is-left" });
  addLabel("OPERATIONAL LAYER", anchor(polar(R.ctxOut + 0.25, 62)), { className: "is-layer is-right" });

  // ---------- Input flow: Users → Prompt → context window → model ----------
  addLabel("Users", anchor(USERS), { className: "is-chip" });
  addLabel("Prompt", anchor(PROMPT), { className: "is-chip" });
  const winLabel = addLabel("", anchor(WIN), { className: "is-window" });
  winLabel.innerHTML =
    "<b>Context window</b><span>Instructions (prompts)</span><span>Contextual knowledge</span><span>Tool results</span><span>Chat history</span><span>Working memory</span>";

  const flows = [];
  const pGeo = new THREE.SphereGeometry(0.05, 12, 10);
  const pMat = material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 });
  const addFlow = (curve, color, n, speed, offset = 0) => {
    root.add(dashed(curve.getPoints(40), color));
    for (let j = 0; j < n; j++) {
      const mesh = new THREE.Mesh(pGeo, pMat);
      root.add(mesh);
      flows.push({ curve, mesh, phase: j / n + offset, speed });
    }
  };
  addFlow(new THREE.LineCurve3(at(USERS.x + 0.42, 0, 0.1), at(PROMPT.x - 0.5, 0, 0.1)), 0xffffff, 1, 0.00045);
  addFlow(new THREE.LineCurve3(at(PROMPT.x + 0.5, 0, 0.1), at(WIN.x - 1.35, 0, 0.1)), 0xffffff, 1, 0.00045, 0.5);
  addFlow(new THREE.LineCurve3(at(WIN.x + 1.35, 0, 0.12), at(CX - R.halo - 0.12, 0, 0.12)), 0x1d5e43, 2, 0.0004);

  // Sources on the rings, each feeding the context window.
  const SOURCES = [
    ["Tools", R.capOut - 0.4, 140],
    ["Retrieval", R.ctxOut - 0.3, 212],
    ["Memory", R.capOut - 0.4, 232],
    ["Agents", R.capOut - 0.4, 256],
  ];
  const nodeGeo = new THREE.SphereGeometry(0.1, 20, 14);
  const nodeMat = material(0xffffff, { roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.25 });
  for (const [name, r, deg] of SOURCES) {
    const p = polar(r, deg, 0.08);
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.copy(p);
    root.add(node);
    const out = p.clone().sub(at(CX, 0)).normalize().multiplyScalar(0.42);
    addLabel(name, anchor(p.clone().add(out)), { className: "is-src" });
    const end = at(WIN.x + 0.2 * Math.sign(p.x - WIN.x), WIN.y + (p.y > 0 ? 0.85 : -0.95), 0.1);
    const mid = at((p.x + end.x) / 2, (p.y + end.y) / 2 + (p.y > 0 ? 0.25 : -0.25), 0.1);
    addFlow(new THREE.QuadraticBezierCurve3(p, mid, end), 0x1d5e43, 1, 0.0005, deg / 360);
  }

  // ---------- Animation ----------
  tick((t) => {
    const s = 1 + Math.sin(t * 0.0018) * 0.025;
    model.scale.setScalar(s);
    halo.material.opacity = 0.65 + Math.sin(t * 0.0018) * 0.2;
    adaptive.rotation.z = t * 0.0001;
    for (const f of flows) {
      const u = (t * f.speed + f.phase) % 1;
      f.mesh.position.copy(f.curve.getPoint(u));
      f.mesh.scale.setScalar(0.4 + Math.sin(u * Math.PI) * 0.8);
    }
  });

  return controls;
}
