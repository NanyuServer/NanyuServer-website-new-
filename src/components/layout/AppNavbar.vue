<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const navRef = ref(null)
const isHamburgerOpen = ref(false)
const isExpanded = ref(false)
const cardsRef = ref([])

const menuItems = [
  {
    label: '万能墙服务',
    bgColor: 'rgba(59, 31, 126, 0.55)',
    textColor: '#e0d7ff',
    links: [
      { label: '稿件查询', to: '/query', ariaLabel: '稿件查询' },
      { label: '有求必应', to: '/feedback', ariaLabel: '有求必应' },
      { label: '公益课程', to: '/course', ariaLabel: '公益课程' }
    ]
  },
  {
    label: '合作服务',
    bgColor: 'rgba(45, 27, 107, 0.55)',
    textColor: '#e0d7ff',
    links: [
      { label: '合作与共创', to: '/cooperation', ariaLabel: '合作与共创' }
    ]
  },
  {
    label: '关于我们',
    bgColor: 'rgba(31, 18, 80, 0.55)',
    textColor: '#e0d7ff',
    links: [
      { label: '招贤纳士', to: '/recruit', ariaLabel: '招贤纳士' },
      { label: '关于我们', to: '/about', ariaLabel: '关于我们' }
    ]
  }
]

const expandedHeight = 260
let animating = false

function calculateHeight() {
  const navEl = navRef.value
  if (!navEl) return expandedHeight
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  if (isMobile) {
    const contentEl = navEl.querySelector('.card-nav-content')
    if (contentEl) {
      const topBar = 60
      const padding = 16
      const contentHeight = contentEl.scrollHeight
      return topBar + contentHeight + padding
    }
  }
  return expandedHeight
}

function animateHeight(from, to, duration, onDone) {
  const navEl = navRef.value
  if (!navEl) return
  const start = performance.now()
  function tick(now) {
    const t = Math.min((now - start) / duration, 1)
    const ease = 1 - Math.pow(1 - t, 3)
    navEl.style.height = (from + (to - from) * ease) + 'px'
    if (t < 1) requestAnimationFrame(tick)
    else if (onDone) onDone()
  }
  requestAnimationFrame(tick)
}

function animateCards(show, delayBase) {
  const cards = cardsRef.value
  cards.forEach((card, i) => {
    if (!card) return
    const delay = delayBase + i * 80
    if (show) {
      card.style.transition = 'none'
      card.style.transform = 'translateY(50px)'
      card.style.opacity = '0'
      card.offsetHeight
      setTimeout(() => {
        card.style.transition = 'transform 0.4s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.4s cubic-bezier(0.33, 1, 0.68, 1)'
        card.style.transform = 'translateY(0)'
        card.style.opacity = '1'
      }, delay)
    } else {
      card.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
      card.style.transform = 'translateY(30px)'
      card.style.opacity = '0'
    }
  })
}

function toggleMenu() {
  const navEl = navRef.value
  if (!navEl || animating) return

  if (!isHamburgerOpen.value) {
    isHamburgerOpen.value = true
    isExpanded.value = true
    animating = true
    document.body.style.overflow = 'hidden'

    nextTick(() => {
      const targetH = calculateHeight()
      animateHeight(60, targetH, 400, () => { animating = false })
      animateCards(true, 100)
    })
  } else {
    isHamburgerOpen.value = false
    animating = true

    animateCards(false, 0)
    setTimeout(() => {
      const currentH = navRef.value ? navRef.value.offsetHeight : expandedHeight
      animateHeight(currentH, 60, 350, () => {
        isExpanded.value = false
        animating = false
        document.body.style.overflow = ''
      })
    }, 100)
  }
}

function closeMenu() {
  if (!isExpanded.value || !navRef.value) return
  isHamburgerOpen.value = false
  animating = true

  animateCards(false, 0)
  setTimeout(() => {
    const currentH = navRef.value ? navRef.value.offsetHeight : expandedHeight
    animateHeight(currentH, 60, 350, () => {
      isExpanded.value = false
      animating = false
      document.body.style.overflow = ''
    })
  }, 100)
}

function goQQ() {
  window.open('https://qm.qq.com/q/FHAbiDBIQO', '_blank')
}

function setCardRef(i) {
  return (el) => { if (el) cardsRef.value[i] = el }
}

let resizeHandler = null
onMounted(() => {
  resizeHandler = () => {
    if (isExpanded.value && navRef.value) {
      navRef.value.style.height = calculateHeight() + 'px'
    }
  }
  window.addEventListener('resize', resizeHandler)
})
onUnmounted(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="card-nav-container">
    <nav ref="navRef" class="card-nav" :class="{ open: isExpanded }">
      <div class="card-nav-top">
        <div
          class="hamburger-menu"
          :class="{ open: isHamburgerOpen }"
          @click="toggleMenu"
          role="button"
          :aria-label="isExpanded ? '关闭菜单' : '打开菜单'"
          :aria-expanded="isExpanded"
          tabindex="0"
          @keydown.enter="toggleMenu"
          @keydown.space.prevent="toggleMenu"
        >
          <div class="hamburger-line" />
          <div class="hamburger-line" />
        </div>

        <div class="logo-container">
          <router-link to="/" class="logo-link" @click="closeMenu">
            <img src="/logo.webp" alt="南渝万能墙" class="logo" />
          </router-link>
        </div>

        <button type="button" class="card-nav-cta-button" @click="goQQ">
          进入万能墙
        </button>
      </div>

      <div class="card-nav-content" :aria-hidden="!isExpanded">
        <div
          v-for="(item, idx) in menuItems"
          :key="item.label"
          :ref="setCardRef(idx)"
          class="nav-card"
          :style="{ backgroundColor: item.bgColor, color: item.textColor }"
        >
          <div class="nav-card-label">{{ item.label }}</div>
          <div class="nav-card-links">
            <router-link
              v-for="link in item.links"
              :key="link.to"
              :to="link.to"
              class="nav-card-link"
              :aria-label="link.ariaLabel"
              @click="closeMenu"
            >
              <svg class="nav-card-link-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
              {{ link.label }}
            </router-link>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.card-nav-container {
  position: fixed;
  top: 2em;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 800px;
  z-index: 9000;
  box-sizing: border-box;
}

.card-nav {
  display: block;
  height: 60px;
  padding: 0;
  background: rgba(18, 10, 32, 0.65);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 8px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
  will-change: height;
}

.card-nav-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.45rem 0.55rem 1.1rem;
  z-index: 2;
}

.hamburger-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  gap: 6px;
  border-radius: 6px;
  padding: 0 4px;
  transition: background 0.2s;
}
.hamburger-menu:hover {
  background: rgba(179, 136, 255, 0.1);
}

.hamburger-line {
  width: 30px;
  height: 2px;
  background-color: rgba(236, 234, 239, 0.9);
  transition:
    transform 0.25s ease,
    opacity 0.2s ease,
    margin 0.3s ease;
  transform-origin: 50% 50%;
}

.hamburger-menu.open .hamburger-line:first-child {
  transform: translateY(4px) rotate(45deg);
}
.hamburger-menu.open .hamburger-line:last-child {
  transform: translateY(-4px) rotate(-45deg);
}

.logo-container {
  display: flex;
  align-items: center;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}
.logo {
  height: 28px;
  filter: brightness(1.15);
}

.card-nav-cta-button {
  background: rgba(123, 85, 212, 0.35);
  color: white;
  border: 1px solid rgba(179, 136, 255, 0.2);
  border-radius: calc(0.75rem - 0.35rem);
  padding: 0 1rem;
  height: 100%;
  font-weight: 500;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.card-nav-cta-button:hover {
  background: rgba(123, 85, 212, 0.55);
}

.card-nav-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 60px;
  bottom: 0;
  padding: 0.5rem;
  display: flex;
  align-items: stretch;
  gap: 12px;
  visibility: hidden;
  pointer-events: none;
  z-index: 1;
}

.card-nav.open .card-nav-content {
  visibility: visible;
  pointer-events: auto;
}

.nav-card {
  flex: 1 1 0;
  min-width: 0;
  border-radius: calc(0.75rem - 0.2rem);
  border: 1px solid rgba(255, 255, 255, 0.12);
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  gap: 8px;
  user-select: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0;
  transform: translateY(50px);
}

.nav-card-label {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
  font-weight: 600;
  font-size: 22px;
  letter-spacing: -0.5px;
  color: #f0e6ff;
}

.nav-card-links {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-card-link {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 16px;
  cursor: pointer;
  text-decoration: none;
  color: rgba(224, 215, 255, 0.7);
  transition: color 0.25s, opacity 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}
.nav-card-link:hover {
  color: #ffffff;
  opacity: 1;
}

.nav-card-link-icon {
  flex-shrink: 0;
  opacity: 0.5;
  transition: opacity 0.25s, transform 0.25s;
}
.nav-card-link:hover .nav-card-link-icon {
  opacity: 1;
  transform: translate(2px, -2px);
}

@media (max-width: 768px) {
  .card-nav-container {
    width: 90%;
    top: 1.2em;
  }

  .card-nav-top {
    padding: 0.5rem 1rem;
    justify-content: space-between;
  }

  .hamburger-menu {
    order: 2;
  }

  .logo-container {
    position: static;
    transform: none;
    order: 1;
  }

  .card-nav-cta-button {
    display: none;
  }

  .card-nav-content {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 0.5rem;
    bottom: 0;
    justify-content: flex-start;
  }

  .nav-card {
    height: auto;
    min-height: 60px;
    flex: 1 1 auto;
    max-height: none;
  }

  .nav-card-label {
    font-size: 18px;
  }

  .nav-card-link {
    font-size: 15px;
  }
}
</style>
