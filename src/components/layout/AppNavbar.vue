<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const expanded = ref(false)
const scrolled = ref(false)
const animating = ref(false)
const barsRef = ref(null)

const menuItems = [
  {
    label: '万能墙服务',
    color: '#3b1f7e',
    textColor: '#e0d7ff',
    links: [
      { label: '稿件查询', to: '/query' },
      { label: '有求必应', to: '/feedback' },
      { label: '公益课程', to: '/course' }
    ]
  },
  {
    label: '合作服务',
    color: '#2d1b6b',
    textColor: '#e0d7ff',
    links: [
      { label: '合作与共创', to: '/cooperation' }
    ]
  },
  {
    label: '关于我们',
    color: '#1f1250',
    textColor: '#e0d7ff',
    links: [
      { label: '招贤纳士', to: '/recruit' },
      { label: '关于我们', to: '/about' }
    ]
  }
]

const isActive = (path) => route.path === path

function toggle() {
  if (animating.value) return
  animating.value = true
  expanded.value = !expanded.value
  if (expanded.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  setTimeout(() => { animating.value = false }, 500)
}

function closeMenu() {
  if (!expanded.value) return
  expanded.value = false
  document.body.style.overflow = ''
}

function goQQ() {
  window.open('https://qm.qq.com/q/FHAbiDBIQO', '_blank')
}

const cardStyle = (item) => ({
  background: `linear-gradient(180deg, ${item.color}dd 0%, ${item.color}66 100%)`,
  color: item.textColor,
  borderColor: `${item.color}66`
})

let scrollHandler = null
onMounted(() => {
  scrollHandler = () => { scrolled.value = window.scrollY > 80 }
  window.addEventListener('scroll', scrollHandler, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', scrollHandler)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="cardnav-wrap" :class="{ expanded, scrolled }">
    <nav class="cardnav" ref="barsRef">
      <!-- Fluid Glass top bar -->
      <div class="cardnav-bar">
        <button
          class="cardnav-hamburger"
          :class="{ open: expanded }"
          @click="toggle"
          :aria-label="expanded ? '关闭菜单' : '打开菜单'"
          :aria-expanded="expanded"
        >
          <div class="ham-line ham-top" />
          <div class="ham-line ham-bottom" />
        </button>

        <router-link to="/" class="cardnav-logo" @click="closeMenu">
          <img src="/logo.webp" alt="南渝万能墙" />
        </router-link>

        <button class="cardnav-cta" @click="goQQ">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-right:6px">
            <path d="M12.67 0H3.33C1.49 0 0 1.49 0 3.33v9.34C0 14.51 1.49 16 3.33 16h9.34C14.51 16 16 14.51 16 12.67V3.33C16 1.49 14.51 0 12.67 0zM5.33 12.67H3.33V5.33h2v7.34zM4.33 4.49a1.16 1.16 0 110-2.32 1.16 1.16 0 010 2.32zM13.33 12.67h-2V8.93c0-2.24-3.67-2.07-3.67.01v3.73h-2V5.33h2v1.18c.93-1.72 4.67-1.85 4.67 1.65v4.51z" fill="currentColor"/>
          </svg>
          进入万能墙
        </button>
      </div>

      <!-- Expandable card area -->
      <div class="cardnav-content" :inert="!expanded || undefined">
        <div
          v-for="(item, idx) in menuItems"
          :key="idx"
          class="cardnav-card"
          :style="cardStyle(item)"
        >
          <div class="card-label">{{ item.label }}</div>
          <div class="card-links">
            <router-link
              v-for="link in item.links"
              :key="link.to"
              :to="link.to"
              class="card-link"
              :class="{ active: isActive(link.to) }"
              @click="closeMenu"
            >
              <svg class="card-link-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
              {{ link.label }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Fluid Glass border glow -->
      <div class="cardnav-glow" />
    </nav>

    <!-- Backdrop overlay when expanded -->
    <div class="cardnav-backdrop" :class="{ visible: expanded }" @click="closeMenu" />
  </div>
</template>

<style scoped>
/* ── Container ── */
.cardnav-wrap {
  position: fixed;
  top: 1.6em;
  left: 50%;
  transform: translateX(-50%);
  width: min(90%, 420px);
  z-index: 9000;
  transition: width 0.4s var(--ease-out);
}

.cardnav-wrap.expanded {
  width: min(92%, 680px);
}

.cardnav {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  transition: box-shadow 0.5s ease, border-color 0.5s ease;
  border: 1px solid rgba(179, 136, 255, 0.18);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 40px rgba(123, 85, 212, 0.08);
}

.cardnav-wrap.scrolled .cardnav {
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 60px rgba(123, 85, 212, 0.12);
  border-color: rgba(179, 136, 255, 0.25);
}

.cardnav-wrap.expanded .cardnav {
  box-shadow:
    0 12px 56px rgba(0, 0, 0, 0.65),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 72px rgba(123, 85, 212, 0.15);
  border-color: rgba(179, 136, 255, 0.3);
}

/* ── Fluid Glass background ── */
.cardnav {
  background: rgba(18, 10, 32, 0.78);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
}

.cardnav::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(179, 136, 255, 0.03) 30%,
    transparent 60%,
    rgba(123, 85, 212, 0.04) 100%
  );
  pointer-events: none;
  z-index: 5;
}

.cardnav-glow {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  pointer-events: none;
  z-index: 4;
  opacity: 0;
  transition: opacity 0.5s ease;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(179, 136, 255, 0.15) 30%,
    transparent 50%,
    rgba(232, 111, 163, 0.12) 70%,
    transparent 100%
  );
  background-size: 200% 200%;
  animation: glowShift 6s ease infinite paused;
}

.cardnav-wrap.expanded .cardnav-glow {
  opacity: 1;
  animation-play-state: running;
}

@keyframes glowShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* ── Top Bar ── */
.cardnav-bar {
  position: relative;
  z-index: 6;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem 0 1.2rem;
  background: transparent;
}

/* ── Hamburger ── */
.cardnav-hamburger {
  width: 44px;
  height: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.3s;
}
.cardnav-hamburger:hover {
  background: rgba(179, 136, 255, 0.1);
}

.ham-line {
  width: 22px;
  height: 2px;
  background: rgba(236, 234, 239, 0.85);
  border-radius: 2px;
  transition: transform 0.35s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.25s;
  transform-origin: 50% 50%;
}
.cardnav-hamburger:hover .ham-line {
  background: #b388ff;
}
.cardnav-hamburger.open .ham-top {
  transform: translateY(4px) rotate(45deg);
}
.cardnav-hamburger.open .ham-bottom {
  transform: translateY(-4px) rotate(-45deg);
}

/* ── Logo ── */
.cardnav-logo {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  z-index: 7;
  text-decoration: none;
}
.cardnav-logo img {
  height: 1.8rem;
  width: auto;
  filter: brightness(1.15);
}

/* ── CTA ── */
.cardnav-cta {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 1rem;
  border: none;
  border-radius: 0.6rem;
  background: rgba(123, 85, 212, 0.35);
  color: #f0e6ff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  white-space: nowrap;
  position: relative;
  z-index: 7;
}
.cardnav-cta:hover {
  background: rgba(123, 85, 212, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(75, 47, 163, 0.4);
}

/* ── Expandable Content ── */
.cardnav-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 0fr;
  gap: 10px;
  padding: 0 0.5rem 0 0.5rem;
  overflow: hidden;
  transition: grid-template-rows 0.45s cubic-bezier(0.77, 0, 0.175, 1);
  position: relative;
  z-index: 3;
}

.cardnav-wrap.expanded .cardnav-content {
  padding-bottom: 14px;
}

.cardnav-wrap.expanded .cardnav-content {
  grid-template-rows: 1fr;
}

.cardnav-content > * {
  overflow: hidden;
  min-height: 0;
}

/* ── Cards ── */
.cardnav-card {
  border-radius: 0.7rem;
  border: 1px solid rgba(179, 136, 255, 0.18);
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.35s cubic-bezier(0.77, 0, 0.175, 1),
    transform 0.35s cubic-bezier(0.77, 0, 0.175, 1),
    border-color 0.3s;
  position: relative;
}

.cardnav-wrap.expanded .cardnav-card {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered card entrance */
.cardnav-wrap.expanded .cardnav-card:nth-child(1) { transition-delay: 0.1s; }
.cardnav-wrap.expanded .cardnav-card:nth-child(2) { transition-delay: 0.16s; }
.cardnav-wrap.expanded .cardnav-card:nth-child(3) { transition-delay: 0.22s; }

.cardnav-card:not(:defined) {
  transition-delay: 0s;
}

.cardnav-card:hover {
  border-color: rgba(179, 136, 255, 0.4);
}

.cardnav-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    transparent 50%,
    transparent 100%
  );
}

.card-label {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #f0e6ff;
}

.card-links {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: auto;
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 0.88rem;
  color: rgba(224, 215, 255, 0.7);
  text-decoration: none;
  padding: 5px 8px;
  border-radius: 6px;
  transition: color 0.25s, background 0.25s, transform 0.2s;
  width: fit-content;
}
.card-link:hover {
  color: #ffffff;
  background: rgba(179, 136, 255, 0.15);
  transform: translateX(3px);
}
.card-link.active {
  color: #b388ff;
  background: rgba(179, 136, 255, 0.12);
}

.card-link-arrow {
  flex-shrink: 0;
  opacity: 0.5;
  transition: opacity 0.25s, transform 0.25s;
}
.card-link:hover .card-link-arrow {
  opacity: 1;
  transform: translate(2px, -2px);
}

/* ── Backdrop ── */
.cardnav-backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
.cardnav-backdrop.visible {
  opacity: 1;
  pointer-events: auto;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .cardnav-wrap {
    width: min(90%, 380px);
    top: 1em;
  }

  .cardnav-wrap.expanded {
    width: min(92%, 500px);
  }

  .cardnav-content {
    grid-template-columns: 1fr;
    grid-template-rows: 0fr;
    gap: 8px;
  }

  .cardnav-wrap.expanded .cardnav-content {
    grid-template-rows: 1fr;
    padding-bottom: 12px;
  }

  .cardnav-card {
    padding: 12px 14px;
  }

  .card-label {
    font-size: 1.05rem;
  }

  .card-link {
    font-size: 0.85rem;
  }

  .cardnav-cta {
    font-size: 0.72rem;
    padding: 0 0.7rem;
  }
  .cardnav-cta svg {
    display: none;
  }
}

@media (max-width: 480px) {
  .cardnav-wrap {
    width: 94%;
    top: 0.7em;
  }
  .cardnav-bar {
    padding: 0 0.6rem 0 0.8rem;
  }
  .cardnav-logo img {
    height: 1.5rem;
  }
}
</style>
