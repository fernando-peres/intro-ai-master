// Model + harness + context and knowledge, as three nested layers seen front-on.
// Model: the sphere in the centre. Harness: the mint annulus whose spokes push inward.
// Context and knowledge: the pale outer ring. Particles flow along the spokes toward the model.
// Sized so 1 world unit ≈ 80 px in the 600×620 box on slide 5; the leader lines in
// index.html point at these radii, so keep them in step if you change the sizes.
import { THREE, createStage, material } from "./lib.js";

const R = { model: 1.06, halo: 1.2, harnessIn: 1.22, harnessOut: 2.45, contextOut: 3.1 };
const C = {
  model: 0x0f4a35,
  halo: 0x9be3bc,
  harness: 0x5fca9b,
  context: 0xcdf3df,
  rim: 0xe9fbf1,
  spoke: 0x1d5e43,
  node: 0xffffff,
};

const polar = (r, a, z = 0) => new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z);

function circle(radius, color, { dashed = false, z = 0.01 } = {}) {
  const pts = [];
  for (let i = 0; i <= 160; i++) pts.push(polar(radius, (i / 160) * Math.PI * 2, z));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.04, gapSize: 0.06, transparent: true, opacity: 0.8 })
    : new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geo, mat);
  if (dashed) line.computeLineDistances();
  return line;
}

function dashedCurve(curve, color) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
    new THREE.LineDashedMaterial({ color, dashSize: 0.1, gapSize: 0.08 }),
  );
  line.computeLineDistances();
  return line;
}

export function mount(el) {
  const { root, tick, controls } = createStage(el, { fov: 35, position: [0, 0, 12.3], spin: false });

  // ---------- Context and knowledge: outer pale ring ----------
  const context = new THREE.Mesh(
    new THREE.RingGeometry(R.harnessOut, R.contextOut, 160),
    material(C.context, { roughness: 0.7, emissive: 0x8fd9b2, emissiveIntensity: 0.25, side: THREE.DoubleSide }),
  );
  context.position.z = -0.02;
  root.add(context);
  const outerRim = new THREE.Mesh(new THREE.TorusGeometry(R.contextOut, 0.035, 12, 160), material(C.halo, { roughness: 0.4 }));
  root.add(outerRim);
  root.add(circle(2.85, 0x8acfaa, { dashed: true }));

  // ---------- Harness: mint annulus ----------
  const harness = new THREE.Mesh(
    new THREE.RingGeometry(R.harnessIn, R.harnessOut, 160),
    material(C.harness, { roughness: 0.6, emissive: 0x2f9c6b, emissiveIntensity: 0.25, side: THREE.DoubleSide }),
  );
  root.add(harness);
  const harnessRim = new THREE.Mesh(new THREE.TorusGeometry(R.harnessOut, 0.025, 12, 160), material(C.rim, { roughness: 0.4 }));
  root.add(harnessRim);
  root.add(circle(1.95, 0x3e9c71, { dashed: true }));

  // ---------- Model: glossy sphere with a halo ----------
  const model = new THREE.Mesh(
    new THREE.SphereGeometry(R.model, 64, 48),
    new THREE.MeshPhysicalMaterial({ color: C.model, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15, metalness: 0.1 }),
  );
  root.add(model);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(R.halo, 0.05, 16, 120), material(C.halo, { roughness: 0.3, transparent: true, opacity: 0.85 }));
  root.add(halo);

  // ---------- Spokes: 8 inward flows from the harness to the model ----------
  const nodeGeo = new THREE.SphereGeometry(0.085, 20, 14);
  const nodeMat = material(C.node, { roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.25 });
  const node = (p) => {
    const m = new THREE.Mesh(nodeGeo, nodeMat);
    m.position.copy(p);
    root.add(m);
    return m;
  };
  const coneGeo = new THREE.ConeGeometry(0.075, 0.2, 16);
  const coneMat = material(C.spoke, { roughness: 0.5 });
  const particleGeo = new THREE.SphereGeometry(0.05, 12, 10);
  const particleMat = material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 });

  const flows = [];
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 2 - (k * Math.PI) / 4;
    const diagonal = k % 2 === 1;
    const z = 0.03;

    const outer = node(polar(R.contextOut, a, 0.04));
    const mid = node(polar(R.harnessOut, a, 0.05));

    // Context → harness: straight dotted link on the axes, an S-curve on the diagonals.
    const link = diagonal
      ? new THREE.CatmullRomCurve3([outer.position, polar(2.86, a + 0.12, z), polar(2.62, a - 0.1, z), mid.position])
      : new THREE.LineCurve3(outer.position, mid.position);
    const linkLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(link.getPoints(32)),
      new THREE.LineBasicMaterial({ color: diagonal ? 0x1d5e43 : 0x8acfaa }),
    );
    root.add(linkLine);

    // Harness → model: dashed arrow; curved on the diagonals, straight on the axes.
    const start = polar(R.harnessOut - 0.16, a, z);
    const end = polar(R.halo + 0.16, a, z);
    const flow = diagonal
      ? new THREE.QuadraticBezierCurve3(start, polar(1.85, a + 0.28, z), end)
      : new THREE.LineCurve3(start, end);
    root.add(dashedCurve(flow, C.spoke));

    // Arrowhead at the model end, pointing along the curve.
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(end);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), flow.getTangent(1).normalize());
    root.add(cone);

    // Two particles per spoke, travelling inward.
    for (let j = 0; j < 2; j++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      root.add(p);
      flows.push({ curve: flow, mesh: p, phase: j / 2 + k * 0.07 });
    }
  }

  // ---------- Animation: model breathes, particles flow inward ----------
  tick((t) => {
    const s = 1 + Math.sin(t * 0.0018) * 0.025;
    model.scale.setScalar(s);
    halo.material.opacity = 0.65 + Math.sin(t * 0.0018) * 0.2;
    for (const f of flows) {
      const u = (t * 0.00035 + f.phase) % 1;
      f.mesh.position.copy(f.curve.getPoint(u));
      const fade = Math.sin(u * Math.PI);
      f.mesh.scale.setScalar(0.4 + fade * 0.8);
    }
  });

  return controls;
}
