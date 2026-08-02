<template>
  <div class="notebook-overlay">
    <div class="notebook-panel">
      <header>
        <h2>我的笔记本</h2>
        <button @click="$emit('close')">关闭</button>
      </header>
      <section class="posts">
        <div v-for="p in posts" :key="p.id" class="post">
          <h3>{{p.title}}</h3>
          <div class="meta">{{formatDate(p.created_at)}}</div>
          <p v-html="p.content"></p>
          <div class="comments">
            <div v-for="c in p.comments" :key="c.id" class="comment">{{c.author}}: {{c.text}}</div>
            <div class="add-comment">
              <input v-model="commentText[p.id]" placeholder="写条评论..." />
              <button @click="postComment(p.id)">发送</button>
            </div>
          </div>
        </div>
      </section>
      <footer>
        <button @click="prevPage" :disabled="page<=1">上一页</button>
        <button @click="nextPage">下一页</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';

const posts = ref<any[]>([]);
const page = ref(1);
const pageSize = 5;
const commentText = ref<Record<number, string>>({});

async function loadPage() {
  const res = await api.get(`/api/posts?page=${page.value}&size=${pageSize}`);
  posts.value = res.data.posts;
  for (const p of posts.value) {
    const c = await api.get(`/api/posts/${p.id}/comments`);
    p.comments = c.data.comments;
  }
}

onMounted(() => { loadPage(); });

function prevPage() { if (page.value > 1) { page.value--; loadPage(); } }
function nextPage() { page.value++; loadPage(); }

async function postComment(postId: number) {
  const text = commentText.value[postId];
  if (!text) return;
  await api.post(`/api/posts/${postId}/comments`, { author: '访客', text });
  commentText.value[postId] = '';
  await loadPage();
}

function formatDate(s: string) { return new Date(s).toLocaleString(); }
</script>

<style scoped>
.notebook-overlay { position:fixed; inset:0; background: rgba(10,10,20,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
.notebook-panel { width:640px; max-height:80vh; overflow:auto; background: linear-gradient(#fff8ff, #fff0fb); border-radius:12px; padding:16px; box-shadow:0 10px 40px rgba(0,0,0,0.25); }
.post { border-bottom:1px dashed rgba(200,150,200,0.3); padding:12px 0; }
.add-comment { display:flex; gap:8px; margin-top:8px; }
.add-comment input { flex:1; padding:8px; border-radius:6px; border:1px solid #f0cde6; }
.add-comment button { background:#ff78c9; color:white; border:none; padding:8px 12px; border-radius:6px; }
</style>
