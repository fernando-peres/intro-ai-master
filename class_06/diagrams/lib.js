// Shared Three.js setup for deck diagrams: renderer, camera, lights, HTML labels,
// drag-to-rotate and a start/stop render loop. Each diagram calls createStage(el).
import * as THREE from "three";

export { THREE };

export const COLORS = {
  green: 0x3ba755,
  greenLight: 0x8fd3a0,
  ink: 0x222222,
  white: 0xffffff,
  grey: 0xc9d1c9,
  red: 0xe3867d,
  amber: 0xe8b04a,
};

export function createStage(el, { fov = 35, position = [0, 4, 12], target = [0, 0, 0], sway = 0 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.append(renderer.domElement);

  const labels = document.createElement("div");
  labels.className = "diagram-labels";
  el.append(labels);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  camera.position.set(...position);
  camera.lookAt(...target);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb7c7b7, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(6, 12, 8);
  scene.add(sun);

  // Everything rotatable goes in root; drag rotates it.
  const root = new THREE.Group();
  scene.add(root);
  let dragging = false;
  let autoSpin = true;
  el.addEventListener("pointerdown", (e) => {
    dragging = true;
    autoSpin = false;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointerup", () => (dragging = false));
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    root.rotation.y += e.movementX * 0.008;
    root.rotation.x = Math.max(-0.6, Math.min(0.6, root.rotation.x + e.movementY * 0.004));
  });
  el.addEventListener("dblclick", () => {
    baseY = root.rotation.y;
    autoSpin = true;
  });

  const tracked = [];
  const v = new THREE.Vector3();
  const addLabel = (text, object, { className = "", offset = [0, 0, 0] } = {}) => {
    const div = document.createElement("div");
    div.className = `d-label ${className}`;
    div.textContent = text;
    labels.append(div);
    tracked.push({ div, object, offset });
    return div;
  };

  const resize = () => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(el);
  resize();

  const hint = document.createElement("div");
  hint.className = "diagram-hint";
  hint.textContent = "drag to rotate · double-click to resume";
  el.append(hint);

  let baseY = 0;
  let frame = 0;
  let onTick = () => {};
  const render = (t) => {
    // sway > 0: rock gently around the start angle instead of spinning.
    if (autoSpin) root.rotation.y = sway ? baseY + Math.sin(t * 0.0005) * sway : root.rotation.y + 0.0022;
    onTick(t);
    renderer.render(scene, camera);
    const w = el.clientWidth;
    const h = el.clientHeight;
    for (const { div, object, offset } of tracked) {
      object.getWorldPosition(v);
      v.x += offset[0];
      v.y += offset[1];
      v.z += offset[2];
      v.project(camera);
      div.style.left = `${((v.x + 1) / 2) * w}px`;
      div.style.top = `${((1 - v.y) / 2) * h}px`;
      div.style.zIndex = String(Math.round((1 - v.z) * 1000));
      div.style.opacity = v.z < 1 ? "1" : "0";
    }
    frame = requestAnimationFrame(render);
  };

  return {
    scene,
    camera,
    root,
    addLabel,
    tick: (fn) => (onTick = fn),
    setBase: (y) => (baseY = root.rotation.y = y),
    controls: {
      start: () => { if (!frame) frame = requestAnimationFrame(render); },
      stop: () => { cancelAnimationFrame(frame); frame = 0; },
    },
  };
}

export const material = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, ...opts });
