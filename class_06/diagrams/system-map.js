// A model at the centre, surrounded by the six parts that turn it into a system.
// Green blocks = build (units 1–4); dark blocks = improve (units 5–6).
import { THREE, COLORS, createStage, material } from "./lib.js";

export function mount(el) {
  const { root, addLabel, tick, controls } = createStage(el, { position: [0, 8, 21], target: [0, -0.3, 0] });

  const model = new THREE.Mesh(new THREE.SphereGeometry(1.35, 48, 32), material(COLORS.ink, { roughness: 0.35 }));
  root.add(model);
  addLabel("Model", model, { className: "is-strong" });

  const parts = [
    ["Knowledge · embeddings", "build"],
    ["Tools", "build"],
    ["MCP", "build"],
    ["Skills", "build"],
    ["Evals", "improve"],
    ["Guardrails", "improve"],
  ];
  const radius = 4.8;
  const blocks = parts.map(([name, kind], i) => {
    const a = (i / parts.length) * Math.PI * 2;
    const pos = new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.3, 1.3),
      material(kind === "build" ? COLORS.green : COLORS.white, { roughness: 0.55 }),
    );
    block.position.copy(pos);
    root.add(block);

    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), pos]),
      new THREE.LineDashedMaterial({ color: 0x8a948a, dashSize: 0.25, gapSize: 0.18 }),
    );
    line.computeLineDistances();
    root.add(line);

    addLabel(name, block, { className: kind === "build" ? "is-green" : "", offset: [0, 1.25, 0] });
    return block;
  });

  // Small packets travelling between the model and each part.
  const packets = blocks.map((b) => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), material(COLORS.amber));
    root.add(p);
    return { p, target: b.position };
  });

  tick((t) => {
    blocks.forEach((b, i) => {
      b.rotation.y = t * 0.0006 + i;
      b.position.y = Math.sin(t * 0.0012 + i) * 0.18;
    });
    packets.forEach(({ p, target }, i) => {
      const k = (Math.sin(t * 0.0011 + i * 1.3) + 1) / 2;
      p.position.lerpVectors(new THREE.Vector3(), target, k);
    });
  });

  return controls;
}
