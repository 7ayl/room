<template>
  <div id="app">
    <Loader v-if="showLoader" @done="onLoaderDone" />
    <ThreeScene @open-notebook="openNotebook" />
    <Notebook v-if="notebookOpen" @close="closeNotebook" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ThreeScene from './components/ThreeScene.vue';
import Notebook from './components/Notebook.vue';
import Loader from './components/Loader.vue';

const notebookOpen = ref(false);
const showLoader = ref(false);

const key = 'magical_room_last_loader_date';
const today = new Date().toISOString().slice(0,10);
if (localStorage.getItem(key) !== today) {
  showLoader.value = true;
  localStorage.setItem(key, today);
}

function onLoaderDone() {
  showLoader.value = false;
}

function openNotebook() {
  notebookOpen.value = true;
}
function closeNotebook() {
  notebookOpen.value = false;
}
</script>

<style>
html, body, #app { height: 100%; margin: 0; font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
</style>
