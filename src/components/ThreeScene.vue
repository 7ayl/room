<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

const container = ref<HTMLElement | null>(null);
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let animationId: number | null = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

onMounted(() => { init(); animate(); });
onBeforeUnmount(() => { if (animationId) cancelAnimationFrame(animationId); renderer.dispose(); window.removeEventListener('resize', onWindowResize); });

function emitEvent(name: string, detail?: any) {
  container.value?.dispatchEvent(new CustomEvent(name, { detail }));
}

function init() {
  const el = container.value!;
  const width = el.clientWidth || window.innerWidth;
  const height = el.clientHeight || window.innerHeight;

  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(width, height);
  // keep low pixelRatio for pixel look
  renderer.setPixelRatio(1);
  renderer.domElement.style.imageRendering = 'pixelated';
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfff0fb);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 2.2, 5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.4, 0);
  controls.enableDamping = true;
  controls.minDistance = 3;
  controls.maxDistance = 12;

  const hemi = new THREE.HemisphereLight(0xfff2fb, 0x666666, 0.6);
  scene.add(hemi);
  const point = new THREE.PointLight(0xffb6f0, 1.2, 20);
  point.position.set(2, 5, 2);
  scene.add(point);

  // floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ color: 0xfffbf7 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  // back wall
  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ color: 0xfff6fa }));
  back.position.set(0, 3, -4);
  scene.add(back);

  // Notebook placeholder
  const nbGeo = new THREE.BoxGeometry(0.9, 0.02, 0.6);
  const nbMat = new THREE.MeshStandardMaterial({ color: 0xfff6ee });
  const notebook = new THREE.Mesh(nbGeo, nbMat);
  notebook.position.set(-1.5, 0.75, -0.8);
  notebook.userData = { type: 'notebook' };
  scene.add(notebook);

  // Avatar placeholder
  const girlGeo = new THREE.ConeGeometry(0.45, 1.4, 8);
  const girlMat = new THREE.MeshStandardMaterial({ color: 0xffc7e9 });
  const girl = new THREE.Mesh(girlGeo, girlMat);
  girl.position.set(0.8, 0.9, -0.6);
  girl.rotation.x = Math.PI;
  girl.userData = { type: 'avatar' };
  scene.add(girl);

  // Winged cat placeholder
  const cat = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffe0f3 }));
  cat.position.set(1.6, 1.1, -0.3);
  cat.userData = { type: 'cat' };
  scene.add(cat);

  // magic particles
  const pointsGeo = new THREE.BufferGeometry();
  const pts: number[] = [];
  for (let i=0;i<140;i++) {
    pts.push((Math.random()-0.5)*6, Math.random()*3+0.7, (Math.random()-0.5)*4);
  }
  pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const particles = new THREE.Points(pointsGeo, new THREE.PointsMaterial({ color: 0xff88ff, size: 0.06, transparent: true, opacity: 0.9 }));
  scene.add(particles);

  // handle clicks
  el.addEventListener('pointerdown', (ev: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const o = intersects[0].object as any;
      if (o.userData?.type === 'notebook') {
        emitEvent('open-notebook');
      }
      if (o.userData?.type === 'avatar') {
        // example: rotate avatar slightly
        o.rotation.y += 0.8;
      }
    }
  });

  function onWindowResize() {
    const w = el.clientWidth || window.innerWidth;
    const h = el.clientHeight || window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onWindowResize);
}

function animate() {
  const time = performance.now() * 0.001;
  scene.traverse((o: any) => {
    if (o.userData?.type === 'cat') {
      o.position.y = 1.1 + Math.sin(time * 2) * 0.06;
      o.rotation.y += 0.01;
    }
  });

  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}
</script>

<style scoped>
.three-container { width:100%; height:100vh; overflow:hidden; }
</style>
