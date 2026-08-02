<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls, GLTFLoader, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass } from 'three-stdlib';
import pixelPaletteShader from '../shaders/pixelPalette';
import { settings } from '../store';
import { AnimationMixer, LoopRepeat } from 'three';
import gsap from 'gsap';

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
let composer: any;

let avatarMixer: THREE.AnimationMixer | null = null;
let avatarActions: Record<string, THREE.AnimationAction> = {};
let currentAction: THREE.AnimationAction | null = null;
let avatarRoot: THREE.Object3D | null = null;
let catRoot: THREE.Object3D | null = null;

// default palette
const PALETTE = [
  '#fff0fb', '#ffbfdc', '#ff78c9', '#b76fa3', '#7f3b6e', '#ffd9f2'
];

onMounted(() => { init(); animate(); });
onBeforeUnmount(() => { if (animationId) cancelAnimationFrame(animationId); renderer.dispose(); window.removeEventListener('resize', onWindowResize); });

function emitEvent(name: string, detail?: any) { container.value?.dispatchEvent(new CustomEvent(name, { detail })); }

async function init() {
  const el = container.value!;
  const width = el.clientWidth || window.innerWidth;
  const height = el.clientHeight || window.innerHeight;

  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(width, height);
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

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ color: 0xfffbf7 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ color: 0xfff6fa }));
  back.position.set(0, 3, -4);
  scene.add(back);

  // Load models
  const loader = new GLTFLoader();
  try {
    const avatar = await loader.loadAsync('/models/avatar.glb');
    avatarRoot = avatar.scene;
    avatarRoot.scale.set(1.0,1.0,1.0);
    avatarRoot.position.set(0.8, 0, -0.6);
    avatarRoot.userData = { type: 'avatar' };
    scene.add(avatarRoot);

    if (avatar.animations && avatar.animations.length > 0) {
      avatarMixer = new AnimationMixer(avatarRoot);
      // add all clips
      avatar.animations.forEach((clip: any) => {
        const name = clip.name || ('clip' + Math.random().toString(36).slice(2,6));
        const action = avatarMixer!.clipAction(clip);
        avatarActions[name] = action;
      });
      // try to find common names
      if (avatarActions['Idle']) { playActionByName('Idle'); }
      else { // play first
        const first = Object.keys(avatarActions)[0]; if (first) playActionByName(first);
      }
    }
  } catch (e) {
    // placeholder avatar
    const girlGeo = new THREE.ConeGeometry(0.45, 1.4, 8);
    const girlMat = new THREE.MeshStandardMaterial({ color: 0xffc7e9, emissive: 0x220033 });
    const girl = new THREE.Mesh(girlGeo, girlMat);
    girl.position.set(0.8, 0.9, -0.6);
    girl.rotation.x = Math.PI;
    girl.userData = { type: 'avatar' };
    scene.add(girl);
    avatarRoot = girl;
    // create simple procedural animations using GSAP
    gsap.to(girl.rotation, { y: '+=6.28', duration: 20, repeat: -1, ease: 'none' });
  }

  try {
    const catg = await loader.loadAsync('/models/cat.glb');
    catRoot = catg.scene;
    catRoot.scale.set(1,1,1);
    catRoot.position.set(1.6, 0.6, -0.3);
    catRoot.userData = { type: 'cat' };
    scene.add(catRoot);
    // if no wing animation, add procedural wings
    if (!catg.animations || catg.animations.length === 0) {
      addProceduralWings(catRoot);
    }
  } catch (e) {
    const cat = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffe0f3 }));
    body.position.set(0, 0.18, 0);
    cat.add(body);
    cat.position.set(1.6, 1.1, -0.3);
    cat.userData = { type: 'cat' };
    scene.add(cat);
    catRoot = cat;
    addProceduralWings(catRoot);
  }

  // magic particles
  const pointsGeo = new THREE.BufferGeometry();
  const pts: number[] = [];
  for (let i=0;i<160;i++) { pts.push((Math.random()-0.5)*6, Math.random()*3+0.7, (Math.random()-0.5)*4); }
  pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const particles = new THREE.Points(pointsGeo, new THREE.PointsMaterial({ color: 0xff88ff, size: 0.06, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
  scene.add(particles);

  // setup raycast
  el.addEventListener('pointerdown', (ev: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const o = intersects[0].object as any;
      if (o.userData?.type === 'notebook') { emitEvent('open-notebook'); }
      if (o.userData?.type === 'avatar') { if (avatarRoot) gsap.to(avatarRoot.rotation, { y: '+=1.8', duration: 0.6 }); }
    }
  });

  // render target and composer
  setupRenderTargets(width, height);

  // listen to avatar action events
  window.addEventListener('avatar-action', (ev: any) => { playActionByName(ev.detail); });
}

function addProceduralWings(cat: THREE.Object3D) {
  // attach two simple wing planes
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xffc0e6, side: THREE.DoubleSide, emissive: 0xff9ee6 });
  const wingGeo = new THREE.PlaneGeometry(0.3, 0.18, 2, 2);
  const left = new THREE.Mesh(wingGeo, wingMat);
  const right = new THREE.Mesh(wingGeo, wingMat);
  left.position.set(-0.15, 0.08, 0);
  left.rotation.set(0, 0, 0.6);
  right.position.set(0.15, 0.08, 0);
  right.rotation.set(0, 0, -0.6);
  const wingGroup = new THREE.Group();
  wingGroup.add(left); wingGroup.add(right);
  wingGroup.position.set(0, 0.12, 0);
  cat.add(wingGroup);
  // flap animation
  gsap.to(left.rotation, { z: 0.1, duration: 0.28, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to(right.rotation, { z: -0.1, duration: 0.28, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

function setupRenderTargets(width: number, height: number) {
  const pixelScale = settings.pixelScale;
  const rtW = Math.max(1, Math.floor(width / pixelScale));
  const rtH = Math.max(1, Math.floor(height / pixelScale));

  if (renderTarget) renderTarget.dispose();
  renderTarget = new THREE.WebGLRenderTarget(rtW, rtH, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, depthBuffer: true });

  // composer for bloom at low-res
  if (composer) composer.dispose();
  composer = new EffectComposer(renderer, renderTarget);
  composer.setSize(rtW, rtH);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(rtW, rtH), settings.bloomStrength, settings.bloomRadius, settings.bloomThreshold);
  composer.addPass(bloomPass);

  // screen quad
  screenScene = new THREE.Scene();
  screenCamera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const geometry = new THREE.PlaneGeometry(2,2);
  const paletteColors = PALETTE.map(h => new THREE.Color(h));
  screenMaterial = new THREE.ShaderMaterial({
    defines: { PALETTE_SIZE: String(PALETTE.length) },
    uniforms: THREE.UniformsUtils.merge([
      { uTexture: { value: composer.readBuffer.texture } },
      { uResolution: { value: new THREE.Vector2(rtW, rtH) } },
      { palette: { value: paletteColors } },
      { uTime: { value: 0 } }
    ]),
    vertexShader: pixelPaletteShader.vertex,
    fragmentShader: pixelPaletteShader.fragment,
    depthWrite: false
  });
  screenMesh = new THREE.Mesh(geometry, screenMaterial);
  screenScene.add(screenMesh);
}

function playActionByName(name: string) {
  if (avatarMixer && avatarActions && avatarActions[name]) {
    const next = avatarActions[name];
    if (currentAction) { currentAction.fadeOut(0.2); }
    next.reset().fadeIn(0.2).play();
    currentAction = next;
    return;
  }
  // fallback procedural actions
  if (!avatarRoot) return;
  if (name === 'wave') {
    gsap.to(avatarRoot.rotation, { y: '+=1.8', duration: 0.6 });
  } else if (name === 'sit') {
    gsap.to(avatarRoot.position, { y: 0.5, duration: 0.4, yoyo: true, repeat: 1 });
  } else {
    // idle - small breathing
    gsap.to(avatarRoot.position, { y: '+=0.03', duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
}

function onWindowResize() {
  const el = container.value!;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  setupRenderTargets(w, h);
}

function animate() {
  const time = performance.now() * 0.001;
  if (avatarMixer) avatarMixer.update(0.016);

  scene.traverse((o: any) => {
    if (o.userData?.type === 'cat') {
      if (!o.userData._floatBase) o.userData._floatBase = o.position.y;
      o.position.y = o.userData._floatBase + Math.sin(time * 2) * 0.06;
    }
  });

  // update composer bloom params in case settings changed
  // (three-stdlib UnrealBloomPass stores strength/radius/threshold)
  const bloomPass = composer && composer.passes && composer.passes.find((p: any) => p instanceof UnrealBloomPass);
  if (bloomPass) {
    bloomPass.strength = settings.bloomStrength;
    bloomPass.radius = settings.bloomRadius;
    bloomPass.threshold = settings.bloomThreshold;
  }

  // render scene through composer (to low-res target with bloom)
  composer.render();

  // update shader texture and uniforms
  if (screenMaterial) {
    screenMaterial.uniforms.uTexture.value = composer.readBuffer.texture;
    screenMaterial.uniforms.uTime.value = time;
  }

  renderer.setRenderTarget(null);
  renderer.render(screenScene, screenCamera as THREE.Camera);

  animationId = requestAnimationFrame(animate);
}

// react to settings.pixelScale changes
watch(() => settings.pixelScale, (val) => {
  const el = container.value!;
  setupRenderTargets(el.clientWidth || window.innerWidth, el.clientHeight || window.innerHeight);
});

// expose method to parent via DOM ref
const vm: any = {};
(vm as any).playAvatarAction = (name: string) => playActionByName(name);

// attach to element so parent can call methods via ref
onMounted(() => { if (container.value) (container.value as any).__SCENE_API__ = vm; });

</script>

<style scoped>
.three-container { width:100%; height:100vh; overflow:hidden; }
</style>
