<template>
  <div class="control-panel">
    <div class="group">
      <label>像素化 (pixelScale): {{settings.pixelScale}}</label>
      <input type="range" min="1" max="10" v-model.number="settings.pixelScale" />
    </div>
    <div class="group">
      <label>Bloom 强度: {{settings.bloomStrength.toFixed(2)}}</label>
      <input type="range" min="0" max="2" step="0.05" v-model.number="settings.bloomStrength" />
    </div>
    <div class="group">
      <label>Avatar 动作</label>
      <div class="actions">
        <button @click="playAction('idle')">静止</button>
        <button @click="playAction('wave')">挥手</button>
        <button @click="playAction('sit')">坐下</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { settings } from '../store';
import { defineEmits } from 'vue';
const emit = defineEmits(['action']);

function playAction(name: string) { emit('action', name); }
</script>

<style scoped>
.control-panel { position: fixed; right: 12px; top: 12px; width: 220px; background: rgba(255,245,251,0.9); border-radius: 10px; padding: 12px; box-shadow: 0 8px 24px rgba(100,50,100,0.12); font-size: 13px; }
.group { margin-bottom: 10px; }
.actions { display:flex; gap:8px; }
button { background:#ff78c9; color:white; border:none; padding:6px 8px; border-radius:6px; cursor:pointer; }
input[type='range'] { width: 100%; }
</style>
