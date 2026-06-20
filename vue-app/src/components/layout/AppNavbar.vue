<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const mobileOpen = ref(false)

const links = [
  { to: '/', label: '首页' },
  { to: '/query', label: '稿件查询' },
  { to: '/course', label: '公益课程' },
  { to: '/feedback', label: '有求必应' },
  { to: '/cooperation', label: '合作与共创' },
  { to: '/recruit', label: '招贤纳士' },
  { to: '/about', label: '关于我们' }
]

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

function closeMobile() {
  mobileOpen.value = false
}

function goQQ() {
  window.open('https://qm.qq.com/q/FHAbiDBIQO', '_blank')
}
</script>

<template>
  <!-- Mobile nav drawer -->
  <Transition name="mobile-nav">
    <div v-if="mobileOpen" class="mobile-nav-drawer">
      <router-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="mobile-nav-link"
        @click="closeMobile"
      >
        {{ link.label }}
      </router-link>
      <button class="glass-btn glass-btn-primary glass-btn-sm mobile-cta-btn" @click="goQQ(); closeMobile()">
        立即进入
      </button>
    </div>
  </Transition>

  <!-- Navbar -->
  <nav class="navbar">
    <router-link to="/" class="navbar-logo" @click="closeMobile">
      <img src="/logo.webp" alt="南渝万能墙" />
    </router-link>

    <ul class="navbar-links">
      <li v-for="link in links" :key="link.to">
        <router-link
          :to="link.to"
          class="nav-link"
          :class="{ active: route.path === link.to }"
        >
          {{ link.label }}
        </router-link>
      </li>
    </ul>

    <button class="glass-btn glass-btn-ghost glass-btn-sm nav-cta" @click="goQQ">
      <span>立即进入</span>
    </button>

    <button
      class="hamburger"
      :class="{ open: mobileOpen }"
      @click="toggleMobile"
      aria-label="菜单"
    >
      <span /><span /><span />
    </button>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 2rem 0.8rem 4px;
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  background: rgba(15, 10, 26, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
  animation: fadeDown 0.8s var(--ease-out) both;
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: none; }
}

.navbar-logo {
  display: flex;
  align-items: center;
  margin-left: 24px;
}
.navbar-logo img {
  height: 3rem;
  width: auto;
}

.navbar-links {
  display: flex;
  gap: 0.8rem;
  list-style: none;
}

.nav-link {
  font-family: var(--font-ui);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  position: relative;
  transition: color 0.3s;
  padding: 0.3rem 0;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 1.5px;
  background: var(--accent-gold);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.4s var(--ease-out);
}
.nav-link:hover, .nav-link.active {
  color: var(--accent-gold);
}
.nav-link:hover::after, .nav-link.active::after {
  transform: scaleX(1);
  transform-origin: left;
}

.nav-cta {
  margin-right: 1rem;
}

.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: 8px;
  background: none;
  border: none;
  z-index: 6000;
}
.hamburger span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--text-secondary);
  border-radius: 2px;
  transition: all 0.3s var(--ease-out);
}
.hamburger.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.hamburger.open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}
.hamburger.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile nav drawer */
.mobile-nav-drawer {
  position: fixed;
  top: 68px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4900;
  width: calc(100% - 48px);
  max-width: 520px;
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  padding: 0.4rem;
}

.mobile-nav-link {
  font-family: var(--font-ui);
  font-size: 1rem;
  color: var(--text-secondary);
  text-decoration: none;
  letter-spacing: 0.04em;
  padding: 0.7rem 1rem;
  transition: color 0.2s;
  border-bottom: 1px solid rgba(123, 85, 212, 0.06);
}
.mobile-nav-link:last-of-type {
  border-bottom: none;
}
.mobile-nav-link:hover {
  color: var(--accent-gold);
}

.mobile-cta-btn {
  margin: 0.4rem;
}

.mobile-nav-enter-active {
  transition: all 0.3s var(--ease-out);
}
.mobile-nav-leave-active {
  transition: all 0.2s ease-in;
}
.mobile-nav-enter-from, .mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-10px) translateX(-50%);
}

@media (max-width: 900px) {
  .navbar-links, .nav-cta { display: none; }
  .hamburger { display: flex; }
  .navbar { padding: 0.8rem 1.2rem 0.8rem 4px; }
  .navbar-logo { margin-left: 12px; }
  .navbar-logo img { height: 2rem; }
}
</style>
