<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const scrolled = ref(false)

const links = [
  { href: '#features', label: '平台功能', isHash: true },
  { to: '/query', label: '稿件查询', isHash: false },
  { to: '/course', label: '公益课程', isHash: false },
  { to: '/feedback', label: '有求必应', isHash: false },
  { to: '/cooperation', label: '合作与共创', isHash: false },
  { to: '/about', label: '关于我们', isHash: false }
]

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

function closeMenu() {
  menuOpen.value = false
  document.body.style.overflow = ''
}

function goQQ() {
  window.open('https://qm.qq.com/q/FHAbiDBIQO', '_blank')
}

function handleNav(link) {
  closeMenu()
  if (link.isHash) {
    if (route.path !== '/') {
      router.push('/').then(() => {
        setTimeout(() => {
          const el = document.querySelector(link.href)
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })
    } else {
      const el = document.querySelector(link.href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

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
  <nav class="navbar" :class="{ scrolled }">
    <div class="navbar-inner">
      <router-link to="/" class="navbar-logo" @click="closeMenu">
        <img src="/logo.webp" alt="南渝万能墙" />
      </router-link>

      <div class="navbar-links-desktop">
        <template v-for="link in links" :key="link.label">
          <router-link v-if="!link.isHash" :to="link.to" class="nav-text-link" data-hover-text>
            <span class="nav-text-top">{{ link.label }}</span>
            <span class="nav-text-bottom">{{ link.label }}</span>
          </router-link>
          <a v-else :href="link.href" class="nav-text-link" data-hover-text @click.prevent="handleNav(link)">
            <span class="nav-text-top">{{ link.label }}</span>
            <span class="nav-text-bottom">{{ link.label }}</span>
          </a>
        </template>
      </div>

      <div class="navbar-right">
        <button class="nav-social-btn" @click="goQQ" aria-label="QQ">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12.67 0H3.33C1.49 0 0 1.49 0 3.33v9.34C0 14.51 1.49 16 3.33 16h9.34C14.51 16 16 14.51 16 12.67V3.33C16 1.49 14.51 0 12.67 0zM5.33 12.67H3.33V5.33h2v7.34zM4.33 4.49a1.16 1.16 0 110-2.32 1.16 1.16 0 010 2.32zM13.33 12.67h-2V8.93c0-2.24-3.67-2.07-3.67.01v3.73h-2V5.33h2v1.18c.93-1.72 4.67-1.85 4.67 1.65v4.51z" fill="currentColor"/></svg>
        </button>
        <button class="navbar-menu-btn" :class="{ 'is-clicked': menuOpen }" @click="toggleMenu" aria-label="菜单">
          <div class="menu-line line-closed-top"></div>
          <div class="menu-line line-closed-bottom"></div>
          <div class="menu-line line-opened-top"></div>
          <div class="menu-line line-opened-bottom"></div>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div class="menu-overlay" :class="{ 'is-open': menuOpen }">
        <div class="menu-content">
          <div class="menu-links">
            <template v-for="link in links" :key="'m-' + link.label">
              <router-link v-if="!link.isHash" :to="link.to" class="menu-link" data-hover-text @click="closeMenu">
                <span class="nav-text-top">{{ link.label }}</span>
                <span class="nav-text-bottom">{{ link.label }}</span>
              </router-link>
              <a v-else :href="link.href" class="menu-link" data-hover-text @click.prevent="handleNav(link)">
                <span class="nav-text-top">{{ link.label }}</span>
                <span class="nav-text-bottom">{{ link.label }}</span>
              </a>
            </template>
          </div>
          <div class="menu-footer">
            <router-link to="/recruit" class="menu-contact" data-hover-text @click="closeMenu">
              <span class="nav-text-top">加入运营队</span>
              <span class="nav-text-bottom">加入运营队</span>
            </router-link>
          </div>
        </div>
      </div>
    </Teleport>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9000;
  padding: 1.2rem 0;
  transition: background 0.4s, backdrop-filter 0.4s;
}
.navbar.scrolled {
  background: rgba(9, 9, 10, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.navbar-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 4vw, 5rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.navbar-logo {
  display: flex;
  align-items: center;
  z-index: 9001;
  text-decoration: none;
}
.navbar-logo img {
  height: 2.2rem;
  width: auto;
  filter: brightness(1.1);
}
.navbar-links-desktop {
  display: flex;
  gap: 2.5rem;
  align-items: center;
}
.nav-text-link {
  position: relative;
  display: inline-flex;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
}

[data-hover-text] {
  position: relative;
  overflow: hidden;
  display: inline-block;
}
.nav-text-top, .nav-text-bottom {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: rgba(236, 234, 239, 0.8);
  transition: opacity 0.4s, transform 0.4s cubic-bezier(0.77, 0, 0.175, 1);
}
.menu-link .nav-text-top, .menu-link .nav-text-bottom {
  font-size: clamp(2rem, 5.5vw, 4.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgba(236, 234, 239, 0.9);
}
.nav-text-bottom {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  color: #7b55d4;
}
[data-hover-text]:hover .nav-text-top {
  transform: translateY(-100%);
  opacity: 0;
}
[data-hover-text]:hover .nav-text-bottom {
  transform: translateY(-100%);
  opacity: 1;
}
.navbar-right {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  z-index: 9001;
}
.nav-social-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(236, 234, 239, 0.15);
  background: none;
  color: rgba(236, 234, 239, 0.6);
  cursor: pointer;
  transition: color 0.3s, border-color 0.3s, transform 0.3s;
}
.nav-social-btn:hover {
  color: #7b55d4;
  border-color: #7b55d4;
  transform: translateY(-2px);
}

.navbar-menu-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  z-index: 9010;
}
.menu-line {
  position: absolute;
  width: 24px;
  height: 2px;
  background: rgba(236, 234, 239, 0.9);
  border-radius: 2px;
  transition: transform 0.4s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.3s;
}
.line-closed-top { transform: translateY(-4px); }
.line-closed-bottom { transform: translateY(4px); }
.line-opened-top { transform: rotate(45deg); opacity: 0; }
.line-opened-bottom { transform: rotate(-45deg); opacity: 0; }
.navbar-menu-btn.is-clicked .line-closed-top { transform: translateX(-40px); opacity: 0; }
.navbar-menu-btn.is-clicked .line-closed-bottom { transform: translateX(40px); opacity: 0; }
.navbar-menu-btn.is-clicked .line-opened-top { transform: rotate(45deg); opacity: 1; }
.navbar-menu-btn.is-clicked .line-opened-bottom { transform: rotate(-45deg); opacity: 1; }

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(9, 9, 10, 0.97);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  clip-path: inset(0 0 100% 0);
  transition: clip-path 0.8s cubic-bezier(0.77, 0, 0.175, 1);
  pointer-events: none;
  overflow-y: auto;
}
.menu-overlay.is-open {
  clip-path: inset(0 0 0% 0);
  pointer-events: auto;
}
.menu-overlay::-webkit-scrollbar { display: none; }
.menu-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8rem clamp(2rem, 6vw, 8rem) 4rem;
}
.menu-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.menu-link {
  text-decoration: none;
  display: inline-flex;
  overflow: hidden;
  padding: 0.6rem 0;
  width: max-content;
}
.menu-footer {
  margin-top: 4rem;
}
.menu-contact {
  display: inline-flex;
  overflow: hidden;
  text-decoration: none;
}
.menu-contact .nav-text-top, .menu-contact .nav-text-bottom {
  font-size: 1.2rem;
  font-weight: 400;
  color: rgba(236, 234, 239, 0.6);
}

@media (max-width: 900px) {
  .navbar-links-desktop { display: none; }
  .nav-social-btn { display: none; }
}
</style>
