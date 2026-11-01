// Requests flow left to right through three gates: input, execution (on the way to
// real systems) and output. Some are stopped at a gate and turn red.
import { THREE, COLORS, createStage, material } from "./lib.js";

const PATH_MAIN = [[-7, 0, 0], [7, 0, 0]];
const GATES = [
  { name: "1 · Input checks", pos: [-4, 0, 0], axis: "x" },
  { name: "2 · Execution checks", pos: [0, -2.4, 0], axis: "y" },
  { name: "3 · Output checks", pos: [4, 0, 0], axis: "x" },
];

export function mount(el) {
  const { root, addLabel, tick, controls, setBase } = createStage(el, { position: [0, 3.5, 21], target: [0, -1.6, 0], sway: 0.3 });
  setBase(-0.2);

  const lineMat = new THREE.LineBasicMaterial({ color: 0xb7c2b7 });
  const line = (pts) => root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))), lineMat));
  line(PATH_MAIN);
  line([[-1, 0, 0], [-1, -4.3, 0]]);
  line([[1, 0, 0], [1, -4.3, 0]]);

  const user = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16), material(COLORS.grey));
  user.position.set(-7, 0, 0);
  root.add(user);
  addLabel("User request", user, { offset: [0, 0.9, 0] });

  const reader = user.clone();
  reader.position.set(7, 0, 0);
  root.add(reader);
  addLabel("User reads", reader, { offset: [0, 0.9, 0] });

  const model = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), material(COLORS.ink, { roughness: 0.35 }));
  root.add(model);
  addLabel("Model", model, { className: "is-strong" });

  const systems = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.4), material(COLORS.white));
  systems.position.set(0, -4.6, 0);
  root.add(systems);
  addLabel("Real systems: refunds, orders, email", systems, { offset: [0, -0.9, 0] });

  for (const g of GATES) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.13, 16, 48), material(COLORS.green));
    ring.position.set(...g.pos);
    if (g.axis === "x") ring.rotation.y = Math.PI / 2;
    else ring.rotation.x = Math.PI / 2;
    root.add(ring);
    addLabel(g.name, ring, { className: "is-green", offset: [0, g.axis === "x" ? 1.5 : 0, g.axis === "x" ? 0 : 0] });
  }

  // Each packet follows a route; blocked ones stop at a gate and turn red.
  const routes = {
    pass: [[-7, 0, 0], [-1, 0, 0], [1, 0, 0], [7, 0, 0]],
    tool: [[-7, 0, 0], [-1, 0, 0], [-1, -4.3, 0], [1, -4.3, 0], [1, 0, 0], [7, 0, 0]],
    stopInput: [[-7, 0, 0], [-4, 0, 0]],
    stopExec: [[-7, 0, 0], [-1, 0, 0], [-1, -2.4, 0]],
    stopOutput: [[-7, 0, 0], [-1, 0, 0], [1, 0, 0], [4, 0, 0]],
  };
  const fates = ["pass", "tool", "pass", "stopInput", "tool", "stopExec", "pass", "stopOutput"];
  const packets = fates.map((fate, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), material(COLORS.amber));
    root.add(m);
    return { m, route: routes[fate].map((p) => new THREE.Vector3(...p)), blocked: fate.startsWith("stop"), phase: i / fates.length };
  });

  const PERIOD = 9000;
  tick((t) => {
    for (const pk of packets) {
      const k = ((t / PERIOD + pk.phase) % 1) * 1.25; // last 20% of the cycle: rest at the end
      const segs = pk.route.length - 1;
      const lengths = pk.route.slice(1).map((p, i) => p.distanceTo(pk.route[i]));
      const total = lengths.reduce((a, b) => a + b, 0);
      // Blocked routes are shorter; scale speed by distance so all move at the same pace.
      let d = Math.min(k * 22, total);
      let i = 0;
      while (i < segs - 1 && d > lengths[i]) d -= lengths[i++];
      pk.m.position.lerpVectors(pk.route[i], pk.route[i + 1], Math.min(1, d / lengths[i]));
      const arrived = k * 22 >= total;
      pk.m.material.color.setHex(arrived && pk.blocked ? COLORS.red : COLORS.amber);
      pk.m.scale.setScalar(arrived && pk.blocked ? 1.5 : 1);
      pk.m.visible = !(arrived && !pk.blocked && k > 1.15);
    }
  });

  return controls;
}
