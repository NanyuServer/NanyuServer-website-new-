<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import StaggeredMenu from './StaggeredMenu.vue'

const route = useRoute()
const scrolled = ref(false)

const navLinks = [
  { label: '稿件查询', to: '/query' },
  { label: '有求必应', to: '/feedback' },
  { label: '公益课程', to: '/course' },
  { label: '共创计划', to: '/cooperation' },
  { label: '招贤纳士', to: '/recruit' },
  { label: '关于我们', to: '/about' }
]

function goQQ() {
  window.open('https://qm.qq.com/q/FHAbiDBIQO', '_blank')
}

function onScroll() {
  scrolled.value = window.scrollY > 30
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <StaggeredMenu />
  <!-- 桌面端导航栏 -->
  <div class="nav-desktop">
    <nav class="nav-pill" :class="{ scrolled }">
      <!-- 左侧 Logo -->
      <router-link to="/" class="nav-logo">
        <img src="/logomini.webp" alt="Logo" class="nav-logo-img" />
        <span class="nav-logo-text">南渝万能墙</span>
      </router-link>

      <!-- 中间导航链接 -->
      <div class="nav-links">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ active: route.path === link.to }"
        >
          {{ link.label }}
        </router-link>
      </div>

      <!-- 右侧按钮 -->
      <button class="nav-cta" @click="goQQ">立即进入</button>
    </nav>
  </div>
</template>

<style scoped>
.nav-desktop {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 94%;
  max-width: 960px;
  z-index: 9000;
}

.nav-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 58px;
  padding: 0 0.6rem 0 1.2rem;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(28px) saturate(200%);
  -webkit-backdrop-filter: blur(28px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 100px;
  box-shadow:
    0 4px 20px rgba(179, 157, 219, 0.1),
    0 1px 4px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-pill.scrolled {
  background: rgba(255, 255, 255, 0.75);
  box-shadow:
    0 8px 36px rgba(179, 157, 219, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* Logo */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  flex-shrink: 0;
}

.nav-logo-img {
  height: 30px;
  width: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(179, 157, 219, 0.2);
}

.nav-logo-text {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

/* 导航链接 */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.nav-link {
  font-family: var(--font-ui);
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.45rem 0.8rem;
  border-radius: 100px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.nav-link:hover {
  color: var(--text-primary);
  background: rgba(179, 157, 219, 0.1);
}

.nav-link.active {
  color: var(--accent-dark);
  background: rgba(179, 157, 219, 0.15);
  font-weight: 600;
}

/* CTA 按钮 */
.nav-cta {
  flex-shrink: 0;
  background: var(--text-primary);
  color: white;
  border: none;
  border-radius: 100px;
  padding: 0 1.2rem;
  height: 38px;
  font-family: var(--font-ui);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  letter-spacing: 0.03em;
  position: relative;
  overflow: hidden;
}

.nav-cta::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.nav-cta:hover {
  background: var(--accent-deep);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(81, 45, 168, 0.25);
}

/* 移动端隐藏桌面导航 */
@media (max-width: 768px) {
  .nav-desktop {
    display: none;
  }
}

/* 小屏隐藏部分链接 */
@media (max-width: 900px) {
  .nav-links .nav-link:nth-child(n+5) {
    display: none;
  }
}

@media (max-width: 700px) {
  .nav-links .nav-link:nth-child(n+4) {
    display: none;
  }
}
</style>
