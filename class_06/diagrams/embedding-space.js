// Sentences as points in a meaning space: similar sentences sit close together.
// Positions are hand-placed to illustrate the idea; notebook embeddings_01 computes real ones.
import { THREE, COLORS, createStage, material } from "./lib.js";

const CLUSTERS = [
  {
    color: COLORS.green,
    centre: [-6.4, 1.8, 0.4],
    items: ["The cat is sleeping on the couch.", "A dog is lying on the couch.", "My puppy chews everything."],
  },
  { color: COLORS.greenLight, centre: [-2.4, -2.2, 3.0], items: ["The sofa is comfortable.", "We bought a new armchair."] },
  { color: COLORS.amber, centre: [6.6, 2.2, -0.6], items: ["The car is red.", "The bus is late again."] },
  { color: COLORS.ink, centre: [4.6, -2.4, -2.0], items: ["I love programming with Python.", "This function returns a list."] },
];

export function mount(el) {
  const { root, addLabel, tick, controls } = createStage(el, { position: [0, 3.5, 20], target: [0, 0, 0], sway: 0.35 });

  // Axes hint that this is a space, not a chart.
  const axes = new THREE.Group();
  for (const dir of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
    const pts = [new THREE.Vector3(...dir).multiplyScalar(-8), new THREE.Vector3(...dir).multiplyScalar(8)];
    axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xc9d1c9 })));
  }
  root.add(axes);

  const points = [];
  CLUSTERS.forEach(({ color, centre, items }, c) => {
    items.forEach((text, i) => {
      const a = (i / items.length) * Math.PI * 2 + c;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16), material(color));
      m.position.set(centre[0] + Math.cos(a) * 0.9, centre[1] + i * 0.9 - (items.length - 1) * 0.45, centre[2] + Math.sin(a) * 0.9);
      root.add(m);
      addLabel(text, m, { className: "is-small", offset: [0, 0.55, 0] });
      points.push(m);
    });
  });

  // A query lands among its nearest neighbours: this is semantic search.
  const query = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.38),
    material(COLORS.white, { emissive: 0x3ba755, emissiveIntensity: 0.35 }),
  );
  query.position.set(-4.4, -0.3, 1.8);
  root.add(query);
  addLabel("Query: “Where can my pet nap?”", query, { className: "is-strong", offset: [-4.8, 0, 0] });

  const nearest = [...points]
    .sort((a, b) => a.position.distanceTo(query.position) - b.position.distanceTo(query.position))
    .slice(0, 3);
  for (const p of nearest) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([query.position, p.position]),
      new THREE.LineDashedMaterial({ color: COLORS.green, dashSize: 0.15, gapSize: 0.1 }),
    );
    line.computeLineDistances();
    root.add(line);
  }

  tick((t) => {
    query.rotation.y = t * 0.002;
    query.position.y = -0.3 + Math.sin(t * 0.002) * 0.12;
  });

  return controls;
}
