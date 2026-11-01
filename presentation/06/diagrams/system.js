// Model ≠ GenAI system, seen front-on. Left: the bare model (a glossy sphere).
// Middle: an arrow, "+ harness". Right: the same model inside the mint harness ring,
// with five nodes (the harness functions) feeding particles inward. A dashed boundary
// marks the GenAI system. Labels are HTML (lib.js addLabel), styled in deck.css (.system-diagram).
import { THREE, createStage, material } from "./lib.js";

const R = { model: 1.0, halo: 1.14, harnessIn: 1.2, harnessOut: 2.3, boundary: 2.75 };
const C = { model: 0x0f4a35, halo: 0x9be3bc, harness: 0x5fca9b, rim: 0xe9fbf1, spoke: 0x1d5e43, boundary: 0x8acfaa };
const LEFT = -6.2;  // x of the bare model
const RIGHT = 4.1;  // x of the system
const FUNCTIONS = ["Contextualizes", "Extends", "Coordinates", "Constrains", "Operationalizes"];

const polar = (cx, r, a, z = 0) => new THREE.Vector3(cx + Math.cos(a) * r, Math.sin(a) * r, z);

function dashed(points, color, dash = 0.1, gap = 0.08) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap }),
  );
  line.computeLineDistances();
  return line;
}

function sphereModel(root, x) {
  const model = new THREE.Mesh(
    new THREE.SphereGeometry(R.model, 64, 48),
    new THREE.MeshPhysicalMaterial({ color: C.model, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15, metalness: 0.1 }),
  );
  model.position.x = x;
  root.add(model);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(R.halo, 0.05, 16, 120),
    material(C.halo, { roughness: 0.3, transparent: true, opacity: 0.85 }),
  );
  halo.position.x = x;
  root.add(halo);
  return { model, halo };
}

export function mount(el) {
  const { root, tick, addLabel, controls } = createStage(el, { fov: 35, position: [0, 0, 12.3], spin: false });

  // ---------- Left: the bare model ----------
  const bare = sphereModel(root, LEFT);
  const anchor = (x, y) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, 0);
    root.add(o);
    return o;
  };
  addLabel("MODEL", anchor(LEFT, -1.75), { className: "is-title" });
  addLabel("learned capabilities", anchor(LEFT, -2.35), { className: "is-note" });

  // ---------- Middle: "+ harness" arrow ----------
  const a0 = new THREE.Vector3(LEFT + 1.75, 0, 0);
  const a1 = new THREE.Vector3(RIGHT - R.boundary - 0.45, 0, 0);
  root.add(dashed([a0, a1], 0xffffff, 0.16, 0.1));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 20), material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.3 }));
  head.position.copy(a1);
  head.rotation.z = -Math.PI / 2;
  root.add(head);
  addLabel("+ harness", anchor((a0.x + a1.x) / 2, 0.45), { className: "is-note" });
  const arrowParticles = [0, 0.5].map((phase) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }));
    root.add(m);
    return { mesh: m, phase };
  });

  // ---------- Right: model + harness = GenAI system ----------
  const inner = sphereModel(root, RIGHT);

  const harness = new THREE.Mesh(
    new THREE.RingGeometry(R.harnessIn, R.harnessOut, 160),
    material(C.harness, { roughness: 0.6, emissive: 0x2f9c6b, emissiveIntensity: 0.25, side: THREE.DoubleSide }),
  );
  harness.position.set(RIGHT, 0, -0.02);
  root.add(harness);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R.harnessOut, 0.025, 12, 160), material(C.rim, { roughness: 0.4 }));
  rim.position.x = RIGHT;
  root.add(rim);

  // System boundary: a slowly turning dashed circle.
  const boundaryPts = [];
  for (let i = 0; i <= 200; i++) boundaryPts.push(polar(0, R.boundary, (i / 200) * Math.PI * 2));
  const boundary = dashed(boundaryPts, C.boundary, 0.12, 0.1);
  boundary.position.x = RIGHT;
  root.add(boundary);
  addLabel("GENAI SYSTEM", anchor(RIGHT, -R.boundary - 0.42), { className: "is-title" });

  // Five harness functions: a node on the rim, a label outside, a dashed flow into the model.
  const nodeGeo = new THREE.SphereGeometry(0.1, 20, 14);
  const nodeMat = material(0xffffff, { roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.25 });
  const coneGeo = new THREE.ConeGeometry(0.075, 0.2, 16);
  const coneMat = material(C.spoke, { roughness: 0.5 });
  const particleGeo = new THREE.SphereGeometry(0.05, 12, 10);
  const particleMat = material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 });
  const flows = [];

  FUNCTIONS.forEach((name, k) => {
    const a = Math.PI / 2 - (k * 2 * Math.PI) / FUNCTIONS.length;
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.copy(polar(RIGHT, R.harnessOut, a, 0.05));
    root.add(node);

    // Label just outside the boundary, pushed away from the circle on the sides.
    const cos = Math.cos(a);
    const side = Math.abs(cos) < 0.2 ? "" : cos > 0 ? "is-right" : "is-left";
    addLabel(name, anchor(RIGHT + Math.cos(a) * (R.boundary + 0.25), Math.sin(a) * (R.boundary + 0.25)), {
      className: `is-fn ${side}`,
    });

    const start = polar(RIGHT, R.harnessOut - 0.16, a, 0.03);
    const end = polar(RIGHT, R.halo + 0.16, a, 0.03);
    const curve = new THREE.LineCurve3(start, end);
    root.add(dashed(curve.getPoints(16), C.spoke));
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(end);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(1).normalize());
    root.add(cone);
    for (let j = 0; j < 2; j++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      root.add(p);
      flows.push({ curve, mesh: p, phase: j / 2 + k * 0.11 });
    }
  });

  // ---------- Animation ----------
  tick((t) => {
    const s = 1 + Math.sin(t * 0.0018) * 0.025;
    for (const m of [bare, inner]) {
      m.model.scale.setScalar(s);
      m.halo.material.opacity = 0.65 + Math.sin(t * 0.0018) * 0.2;
    }
    boundary.rotation.z = t * 0.00008;
    for (const f of flows) {
      const u = (t * 0.00035 + f.phase) % 1;
      f.mesh.position.copy(f.curve.getPoint(u));
      f.mesh.scale.setScalar(0.4 + Math.sin(u * Math.PI) * 0.8);
    }
    for (const p of arrowParticles) {
      const u = (t * 0.0003 + p.phase) % 1;
      p.mesh.position.lerpVectors(a0, a1, u);
      p.mesh.scale.setScalar(0.4 + Math.sin(u * Math.PI) * 0.8);
    }
  });

  return controls;
}
