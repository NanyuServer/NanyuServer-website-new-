<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="notfound-page">
    <div class="nf-orb nf-orb-1" />
    <div class="nf-orb nf-orb-2" />

    <div class="nf-card glass-card">
      <div class="nf-code">404</div>
      <div class="nf-title">页面走丢了</div>
      <div class="nf-desc">你访问的页面不存在或已被移除，返回首页继续探索吧。</div>
      <div class="nf-actions">
        <button class="glass-btn glass-btn-primary" @click="goHome">返回首页</button>
        <button class="glass-btn glass-btn-ghost" @click="router.back()">返回上一页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notfound-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.nf-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}
.nf-orb-1 {
  width: 420px;
  height: 420px;
  top: -80px;
  left: -60px;
  background: radial-gradient(circle, rgba(179, 157, 219, 0.28) 0%, transparent 70%);
  animation: float 9s ease-in-out infinite;
}
.nf-orb-2 {
  width: 360px;
  height: 360px;
  bottom: -60px;
  right: -40px;
  background: radial-gradient(circle, rgba(248, 187, 208, 0.22) 0%, transparent 70%);
  animation: float 11s ease-in-out infinite 2s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}

.nf-card {
  max-width: 520px;
  width: 100%;
  padding: 3.5rem 2.5rem;
  text-align: center;
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: none; }
}

.nf-code {
  font-family: var(--font-title);
  font-size: clamp(4rem, 12vw, 6.5rem);
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-primary), var(--text-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
}

.nf-title {
  font-family: var(--font-title);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.8rem;
}

.nf-desc {
  font-size: 0.95rem;
  line-height: 1.9;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.nf-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
