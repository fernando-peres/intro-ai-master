// Shared pieces for the deck 07 system diagrams (blocks.js, focus.js): block colours, the ring plane and helpers.
// Points from ringPoint() lie in the same plane as meshes from addRing() with the same centre and tilt.
import { THREE } from "./lib.js";

export const TILT = 0.18; // ring tilt, as in deck 06 slide 32
export const COL = { C: 0x7fb3ff, T: 0xf2c94c, W: 0xe6f57a, A: 0xff4fd8, G: 0xf08a7e, E: 0x7fe0e8, X: 0xc3b6ff, O: 0xcfd8d3, F: 0xffb86b, ok: 0x6ee7a0, bad: 0xff6b6b };
export const hex = (c) => "#" + c.toString(16).padStart(6, "0");

export const ringPoint = (c, r, a, tilt = TILT) => {
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  return new THREE.Vector3(c.x + x, c.y - z * Math.sin(tilt), c.z + z * Math.cos(tilt));
};

export function addRing(root, c, rIn, rOut, color, opacity, tilt = TILT) {
  const m = new THREE.Mesh(new THREE.RingGeometry(rIn, rOut, 160), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide }));
  m.position.copy(c);
  m.rotation.x = -Math.PI / 2 + tilt;
  root.add(m);
  return m;
}

export function dashed(points, color, opacity = 0.6, dash = 0.1, gap = 0.08) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap, transparent: true, opacity }),
  );
  line.computeLineDistances();
  return line;
}

/** Restart a CSS class animation on `node` and drop the class after `ms`. */
export const flash = (node, cls, ms) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); setTimeout(() => node.classList.remove(cls), ms); };

/** Pulse the slide's `.blk-badge[data-blk=id]` badges and light up their cards. */
export function pulseCards(stage, id) {
  stage?.querySelectorAll(`.blk-badge[data-blk="${id}"]`).forEach((b) => {
    flash(b, "is-pulse", 900);
    const card = b.closest(".blk-card");
    if (card) flash(card, "is-live", 1100);
  });
}

/** Point on the quadratic bezier a → (midpoint lifted by `lift`) → b, written into `out`. */
const mid = new THREE.Vector3();
export function arc(out, a, b, u, lift = 0) {
  mid.copy(a).lerp(b, 0.5).y += lift;
  return out.copy(a).multiplyScalar((1 - u) ** 2).addScaledVector(mid, 2 * u * (1 - u)).addScaledVector(b, u * u);
}
