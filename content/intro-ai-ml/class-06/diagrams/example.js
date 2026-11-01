// Example diagram: a GenAI system as three stacked layers (context → model → output).
// Contract for every diagram module: export mount(el) → { start(), stop() }.
// img2threejs output can be dropped in by building its model inside mount().
import * as THREE from "three";

export function mount(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(7, 5.5, 9);
  camera.lookAt(0, 0.6, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb59f, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(5, 10, 6);
  scene.add(sun);

  const system = new THREE.Group();
  const layers = [
    { color: 0xffffff, y: 0 },
    { color: 0x51b265, y: 1.1 },
    { color: 0x262626, y: 2.2 },
  ];
  for (const { color, y } of layers) {
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.6, 4),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55 }),
    );
    slab.position.y = y;
    system.add(slab);
  }
  scene.add(system);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = el;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(el);
  resize();

  let frame = 0;
  const tick = (t) => {
    system.rotation.y = t * 0.0003;
    system.children.forEach((m, i) => (m.position.y = layers[i].y + Math.sin(t * 0.0015 + i) * 0.08));
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };

  return {
    start: () => { if (!frame) frame = requestAnimationFrame(tick); },
    stop: () => { cancelAnimationFrame(frame); frame = 0; },
  };
}
