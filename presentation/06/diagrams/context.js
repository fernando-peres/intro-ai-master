// Context engineering inside the harness (slide 25), seen front-on.
// Rings, outer to inner: context (pale), capabilities (mint), adaptive control (dashed), model (sphere).
// A pale band carries the request: Users → Prompt → context window (HTML panel on the rings' left edge) → model.
// Four sources spread around the left half of the rings (tools, retrieval, memory, agents) feed the window.
import { THREE, createStage, material } from "./lib.js";

const CX = 2.75; // ring centre (x)
const R = { model: 0.88, halo: 1.0, adaptive: 1.5, capIn: 1.04, capOut: 2.2, ctxOut: 2.78 };
const WIN = new THREE.Vector3(-0.55, 0, 0.3); // context window anchor, overlapping the context ring
const WIN_HALF = 1.32; // half width of the panel in world units (panel is ~232 px)
const USERS = new THREE.Vector3(-4.95, 0, 0.1);
const PROMPT = new THREE.Vector3(-3.25, 0, 0.1);

const at = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const polar = (r, deg, z = 0) => at(CX + Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r, z);

function dashed(points, color, dash = 0.1, gap = 0.08, opacity = 1) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap, transparent: opacity < 1, opacity }),
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

  // ---------- Request band (behind everything) ----------
  const band = new THREE.Mesh(
    new THREE.PlaneGeometry(CX + 5.55, 1.25),
    new THREE.MeshBasicMaterial({ color: 0x1b1b18, transparent: true, opacity: 0.9 }),
  );
  band.position.set((CX - 5.55) / 2, 0, -0.2);
  root.add(band);

  // ---------- Rings ----------
  const ring = (rIn, rOut, color, emissive, z) => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(rIn, rOut, 160),
      material(color, { roughness: 0.65, emissive, emissiveIntensity: 0.22, side: THREE.DoubleSide }),
    );
    m.position.set(CX, 0, z);
    root.add(m);
  };
  ring(R.capOut, R.ctxOut, 0xcdf3df, 0x8fd9b2, -0.03);
  ring(R.capIn, R.capOut, 0x5fca9b, 0x2f9c6b, -0.02);
  for (const r of [R.capOut, R.ctxOut]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 12, 160), material(0xe9fbf1, { roughness: 0.4 }));
    rim.position.x = CX;
    root.add(rim);
  }

  // Adaptive control: a dashed ring that turns slowly.
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const a = (i / 200) * Math.PI * 2;
    pts.push(at(Math.cos(a) * R.adaptive, Math.sin(a) * R.adaptive, 0.01));
  }
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
  addLabel("MODEL", anchor(at(CX, -R.model - 0.32, 0.2)), { className: "is-ring is-dark" });

  // Ring names on the right side of each band, clear of the flows on the left.
  addLabel("CONTEXT", anchor(polar((R.capOut + R.ctxOut) / 2, 72, 0.1)), { className: "is-ring is-dark" });
  addLabel("CAPABILITIES", anchor(polar((R.adaptive + R.capOut) / 2 + 0.08, 68, 0.1)), { className: "is-ring is-dark" });
  addLabel("ADAPTIVE CONTROL", anchor(polar(R.adaptive - 0.24, 90, 0.1)), { className: "is-ring is-dark is-sm" });

  // Layer callouts with leader lines (as on slide 5).
  const leader = (from, to) => {
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineBasicMaterial({ color: 0xbfc8c3 })));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), material(0xffffff));
    dot.position.copy(to);
    root.add(dot);
  };
  const ctxPoint = polar(R.ctxOut, 128, 0.05);
  const ctxLabel = at(ctxPoint.x - 0.75, 3.3, 0.05); // right-aligned: text extends left of this point
  leader(at(ctxLabel.x - 0.5, ctxLabel.y - 0.36, 0.05), ctxPoint);
  addLabel("CONTEXTUAL LAYER", anchor(ctxLabel), { className: "is-layer is-left" });
  const capPoint = polar(R.capOut, 48, 0.05);
  const capLabel = at(5.6, 3.3, 0.05); // right-aligned against the diagram's right edge
  leader(at(capLabel.x - 1.0, capLabel.y - 0.36, 0.05), capPoint);
  addLabel("OPERATIONAL LAYER", anchor(capLabel), { className: "is-layer is-left" });

  // ---------- Request flow: Users → Prompt → context window → model ----------
  addLabel("Users", anchor(USERS), { className: "is-chip" });
  addLabel("Prompt", anchor(PROMPT), { className: "is-chip" });
  const win = addLabel("", anchor(WIN), { className: "is-window" });
  win.innerHTML =
    "<b>Context window</b><span>Instructions (prompts)</span><span>Contextual knowledge</span><span>Tool results</span><span>Chat history</span><span>Working memory</span>";

  const flows = [];
  const pGeo = new THREE.SphereGeometry(0.055, 12, 10);
  const pMat = material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 });
  const arrowGeo = new THREE.ConeGeometry(0.08, 0.2, 16);
  const addFlow = (curve, color, n, speed, offset = 0, arrow = true) => {
    root.add(dashed(curve.getPoints(48), color));
    if (arrow) {
      const cone = new THREE.Mesh(arrowGeo, material(color));
      cone.position.copy(curve.getPoint(1));
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(1).normalize());
      root.add(cone);
    }
    for (let j = 0; j < n; j++) {
      const mesh = new THREE.Mesh(pGeo, pMat);
      root.add(mesh);
      flows.push({ curve, mesh, phase: j / n + offset, speed });
    }
  };
  addFlow(new THREE.LineCurve3(at(USERS.x + 0.55, 0, 0.1), at(PROMPT.x - 0.68, 0, 0.1)), 0xffffff, 1, 0.0005);
  addFlow(new THREE.LineCurve3(at(PROMPT.x + 0.68, 0, 0.1), at(WIN.x - WIN_HALF - 0.12, 0, 0.1)), 0xffffff, 1, 0.0005, 0.5);
  addFlow(new THREE.LineCurve3(at(WIN.x + WIN_HALF + 0.08, 0, 0.12), at(CX - R.halo - 0.1, 0, 0.12)), 0xffffff, 2, 0.00045);

  // Sources, spread around the left half of the rings, each feeding the window from above or below.
  const SOURCES = [
    ["Tools", R.capOut - 0.38, 140],
    ["Agents", R.capOut - 0.38, 118],
    ["Retrieval", R.capOut - 0.38, 220],
    ["Memory", R.capOut - 0.38, 242],
  ];
  const nodeGeo = new THREE.SphereGeometry(0.1, 20, 14);
  const nodeMat = material(0xffffff, { roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.25 });
  SOURCES.forEach(([name, r, deg], k) => {
    const p = polar(r, deg, 0.08);
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.copy(p);
    root.add(node);
    const up = p.y > 0;
    const out = p.clone().sub(at(CX, 0, p.z)).normalize().multiplyScalar(0.42); // label sits radially outward
    addLabel(name, anchor(p.clone().add(out)), { className: "is-src" });
    // Ends on the panel's top or bottom edge, spaced so the curves don't overlap.
    const end = at(WIN.x + 0.35 + (k % 2) * 0.55, up ? 1.18 : -1.18, 0.2);
    const mid = at((p.x + end.x) / 2, up ? Math.max(p.y, end.y) + 0.35 : Math.min(p.y, end.y) - 0.35, 0.15);
    addFlow(new THREE.QuadraticBezierCurve3(p, mid, end), 0x1d5e43, 1, 0.0005, k * 0.25);
  });

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
