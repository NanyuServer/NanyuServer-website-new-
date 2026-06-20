<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import LiquidGlass from '@/components/common/LiquidGlass.vue'

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

function toggleMobile() { mobileOpen.value = !mobileOpen.value }
function closeMobile() { mobileOpen.value = false }
function goQQ() { window.open('https://qm.qq.com/q/FHAbiDBIQO', '_blank') }
</script>

<template>
  <Transition name="mobile-nav">
    <div v-if="mobileOpen" class="mobile-nav-drawer">
      <router-link
        v-for="link in links" :key="link.to" :to="link.to"
        class="mobile-nav-link" @click="closeMobile"
      >{{ link.label }}</router-link>
      <LiquidGlass :cornerRadius="12" :displacementScale="40" :elasticity="0.3">
        <button class="mobile-cta-btn" @click="goQQ(); closeMobile()">立即进入</button>
      </LiquidGlass>
    </div>
  </Transition>

  <nav class="navbar">
    <router-link to="/" class="navbar-logo" @click="closeMobile">
      <img src="/logo.webp" alt="南渝万能墙" />
    </router-link>

    <ul class="navbar-links">
      <li v-for="link in links" :key="link.to">
        <router-link :to="link.to" class="nav-link" :class="{ active: route.path === link.to }">
          {{ link.label }}
        </router-link>
      </li>
    </ul>

    <LiquidGlass :cornerRadius="100" :displacementScale="50" :elasticity="0.35" :blurAmount="0.1" :aberrationIntensity="3">
      <button class="nav-cta-btn" @click="goQQ">
        <span>立即进入</span>
      </button>
    </LiquidGlass>

    <button class="hamburger" :class="{ open: mobileOpen }" @click="toggleMobile" aria-label="菜单">
      <span /><span /><span />
    </button>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.5rem 0.5rem 4px;
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  background: rgba(15, 10, 26, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 20px rgba(179, 136, 255, 0.06);
  animation: fadeDown 0.8s var(--ease-out) both;
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: none; }
}

.navbar-logo {
  display: flex;
  align-items: center;
  margin-left: 20px;
}
.navbar-logo img {
  height: 2.6rem;
  width: auto;
}

.navbar-links {
  display: flex;
  gap: 0.6rem;
  list-style: none;
}

.nav-link {
  font-family: var(--font-ui);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  position: relative;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  transition: color 0.3s, background 0.3s;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 60%;
  height: 1.5px;
  background: var(--accent-gold);
  transform: translateX(-50%) scaleX(0);
  transition: transform 0.35s var(--ease-out);
}
.nav-link:hover, .nav-link.active {
  color: var(--accent-gold);
  background: rgba(179, 136, 255, 0.08);
}
.nav-link:hover::after, .nav-link.active::after {
  transform: translateX(-50%) scaleX(1);
}

.nav-cta-btn {
  padding: 0.5rem 1.4rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-ui);
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: color 0.3s;
}
.nav-cta-btn:hover {
  color: var(--accent-gold);
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
.hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

.mobile-nav-drawer {
  position: fixed;
  top: 76px;
  left: 12px;
  right: 12px;
  z-index: 4900;
  max-width: 520px;
  margin: 0 auto;
  border-radius: 20px;
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  background: rgba(15, 10, 26, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.12);
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
  border-radius: 12px;
  transition: color 0.2s, background 0.2s;
}
.mobile-nav-link:hover {
  color: var(--accent-gold);
  background: rgba(179, 136, 255, 0.08);
}
.mobile-cta-btn {
  width: 100%;
  padding: 0.7rem 1.2rem;
  background: transparent;
  border: none;
  color: var(--accent-gold);
  font-family: var(--font-ui);
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  border-radius: 12px;
}

.mobile-nav-enter-active { transition: all 0.3s var(--ease-out); }
.mobile-nav-leave-active { transition: all 0.2s ease-in; }
.mobile-nav-enter-from, .mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 900px) {
  .navbar-links, .nav-cta-btn { display: none; }
  .hamburger { display: flex; }
  .navbar { padding: 0.5rem 1rem 0.5rem 4px; top: 8px; left: 8px; right: 8px; }
  .navbar-logo { margin-left: 12px; }
  .navbar-logo img { height: 2rem; }
}
</style>
