<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls, GLTFLoader } from 'three-stdlib';
import pixelPaletteShader from '../shaders/pixelPalette';

const container = ref<HTMLElement | null>(null);
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let animationId: number | null = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Screen pass objects
let screenScene: THREE.Scene;
let screenCamera: THREE.OrthographicCamera;
let screenMaterial: THREE.ShaderMaterial;
let screenMesh: THREE.Mesh;
let renderTarget: THREE.WebGLRenderTarget;

// Config: how many screen pixels per rendered pixel (pixelScale)
const pixelScale = 4; // larger -> blockier pixel art
const PALETTE = [
  '#fff0fb', // very light pink
  '#ffbfdc',
  '#ff78c9',
  '#b76fa3',
  '#7f3b6e',
  '#ffd9f2'
];

onMounted(() => { init(); animate(); });
onBeforeUnmount(() => { if (animationId) cancelAnimationFrame(animationId); renderer.dispose(); window.removeEventListener('resize', onWindowResize); });

function emitEvent(name: string, detail?: any) {
  container.value?.dispatchEvent(new CustomEvent(name, { detail }));
}

async function init() {
  const el = container.value!;
  const width = el.clientWidth || window.innerWidth;
  const height = el.clientHeight || window.innerHeight;

  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1); // fixed low pixel ratio for pixelation
  renderer.domElement.style.imageRendering = 'pixelated';
  el.appendChild(renderer.domElement);

  // Main scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfff0fb);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 2.2, 5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.4, 0);
  controls.enableDamping = true;
  controls.minDistance = 3;
  controls.maxDistance = 12;

  // Lights
  const hemi = new THREE.HemisphereLight(0xfff2fb, 0x666666, 0.6);
  scene.add(hemi);
  const point = new THREE.PointLight(0xffb6f0, 1.2, 20);
  point.position.set(2, 5, 2);
  scene.add(point);

  // Floor & walls
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ color: 0xfffbf7 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ color: 0xfff6fa }));
  back.position.set(0, 3, -4);
  scene.add(back);

  // Load models (try GLTF, fallback to placeholders)
  const loader = new GLTFLoader();
  // avatar
  try {
    const avatar = await loader.loadAsync('/models/avatar.glb');
    const avatarRoot = avatar.scene;
    avatarRoot.scale.set(1.0, 1.0, 1.0);
    avatarRoot.position.set(0.8, 0, -0.6);
    avatarRoot.userData = { type: 'avatar' };
    scene.add(avatarRoot);
  } catch (e) {
    // placeholder cone
    const girlGeo = new THREE.ConeGeometry(0.45, 1.4, 8);
    const girlMat = new THREE.MeshStandardMaterial({ color: 0xffc7e9 });
    const girl = new THREE.Mesh(girlGeo, girlMat);
    girl.position.set(0.8, 0.9, -0.6);
    girl.rotation.x = Math.PI;
    girl.userData = { type: 'avatar' };
    scene.add(girl);
  }

  // cat
  try {
    const catg = await loader.loadAsync('/models/cat.glb');
    const catRoot = catg.scene;
    catRoot.scale.set(1,1,1);
    catRoot.position.set(1.6, 0.6, -0.3);
    catRoot.userData = { type: 'cat' };
    scene.add(catRoot);
  } catch (e) {
    const cat = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffe0f3 }));
    cat.position.set(1.6, 1.1, -0.3);
    cat.userData = { type: 'cat' };
    scene.add(cat);
  }

  // notebook
  let notebookObj: THREE.Object3D | null = null;
  try {
    const nb = await loader.loadAsync('/models/notebook.glb');
    notebookObj = nb.scene;
    notebookObj.position.set(-1.5, 0.75, -0.8);
    notebookObj.userData = { type: 'notebook' };
    scene.add(notebookObj);
  } catch (e) {
    const nbGeo = new THREE.BoxGeometry(0.9, 0.02, 0.6);
    const nbMat = new THREE.MeshStandardMaterial({ color: 0xfff6ee });
    const notebook = new THREE.Mesh(nbGeo, nbMat);
    notebook.position.set(-1.5, 0.75, -0.8);
    notebook.userData = { type: 'notebook' };
    scene.add(notebook);
  }

  // particles
  const pointsGeo = new THREE.BufferGeometry();
  const pts: number[] = [];
  for (let i=0;i<160;i++) {
    pts.push((Math.random()-0.5)*6, Math.random()*3+0.7, (Math.random()-0.5)*4);
  }
  pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const particles = new THREE.Points(pointsGeo, new THREE.PointsMaterial({ color: 0xff88ff, size: 0.06, transparent: true, opacity: 0.9 }));
  scene.add(particles);

  // Raycast clicks
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
        o.rotation.y += 0.8;
      }
    }
  });

  // Setup low-res render target and full-screen pass
  const rtWidth = Math.max(1, Math.floor(width / pixelScale));
  const rtHeight = Math.max(1, Math.floor(height / pixelScale));
  renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    depthBuffer: true
  });

  screenScene = new THREE.Scene();
  screenCamera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const geometry = new THREE.PlaneGeometry(2,2);

  // build palette uniform array as THREE.Color[]
  const paletteColors = PALETTE.map((h) => new THREE.Color(h));

  screenMaterial = new THREE.ShaderMaterial({
    defines: { PALETTE_SIZE: String(PALETTE.length) },
    uniforms: THREE.UniformsUtils.merge([
      { uTexture: { value: renderTarget.texture } },
      { uResolution: { value: new THREE.Vector2(rtWidth, rtHeight) } },
      { palette: { value: paletteColors } },
      { uTime: { value: 0 } }
    ]),
    vertexShader: pixelPaletteShader.vertex,
    fragmentShader: pixelPaletteShader.fragment,
    depthWrite: false
  });

  screenMesh = new THREE.Mesh(geometry, screenMaterial);
  screenScene.add(screenMesh);

  function onWindowResize() {
    const w = el.clientWidth || window.innerWidth;
    const h = el.clientHeight || window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);

    const newW = Math.max(1, Math.floor(w / pixelScale));
    const newH = Math.max(1, Math.floor(h / pixelScale));
    if (renderTarget) renderTarget.setSize(newW, newH);
    screenMaterial.uniforms.uResolution.value.set(newW, newH);
  }
  window.addEventListener('resize', onWindowResize);
}

function animate() {
  const time = performance.now() * 0.001;
  // animate small things
  scene.traverse((o: any) => {
    if (o.userData?.type === 'cat') {
      o.position.y = 1.1 + Math.sin(time * 2) * 0.06;
      o.rotation.y += 0.01;
    }
  });

  // render main scene to low-res target
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  // update shader uniforms
  if (screenMaterial) screenMaterial.uniforms.uTime.value = time;

  // render the screen quad (this will display the renderTarget, pixelated by nearest filter)
  renderer.render(screenScene, screenCamera as THREE.Camera);

  animationId = requestAnimationFrame(animate);
}
</script>

<style scoped>
.three-container { width:100%; height:100vh; overflow:hidden; }
</style>
