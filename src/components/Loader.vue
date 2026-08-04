<template>
  <div class="loader-overlay">
    <div class="loader-inner">
      <div class="magic-heart">✨💖✨</div>
      <div class="loader-sub">Welcome to your magical room</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { gsap } from 'gsap';
const emit = defineEmits(['done']);

onMounted(() => {
  const el = document.querySelector('.magic-heart') as HTMLElement;
  gsap.fromTo(el, { scale: 0.6, opacity: 0 }, { scale: 1.6, opacity: 1, duration: 0.9, yoyo: true, repeat: 3, ease: 'power1.inOut' });
  setTimeout(() => emit('done'), 2600);
});
</script>

<style scoped>
.loader-overlay {
  position: fixed; inset: 0; display:flex; align-items:center; justify-content:center;
  background: radial-gradient(circle at 20% 20%, rgba(255,200,240,0.95), rgba(200,160,230,0.95));
  z-index: 9999;
}
.loader-inner { text-align:center; }
.magic-heart { font-size: 64px; transform: scale(1); filter: drop-shadow(0 6px 18px rgba(255,100,200,0.45)); }
.loader-sub { margin-top: 12px; color: #6b2b61; font-weight:600; }
</style>
