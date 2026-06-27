<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const open = ref(false)
const busy = ref(false)
const panelRef = ref(null)
const itemRefs = ref([])

const items = [
  { label: '首页', link: '/' },
  { label: '稿件查询', link: '/query' },
  { label: '有求必应', link: '/feedback' },
  { label: '公益课程', link: '/course' },
  { label: '合作与共创', link: '/cooperation' },
  { label: '招贤纳士', link: '/recruit' },
  { label: '关于我们', link: '/about' }
]

const socialItems = [
  { label: 'QQ万能墙', link: 'https://qm.qq.com/q/FHAbiDBIQO' },
  { label: '北关鱼的驿站', link: 'https://www.douyin.com/user/MS4wLjABAAAAVgKoJHBKLxQ4nQk-FQp_9sJZk3NBZ3FD2vN7R8QnWqI' },
  { label: 'BEIGUANYU驿站', link: 'https://www.douyin.com/user/MS4wLjABAAAAVgKoJHBKLxQ4nQk-FQp_9sJZk3NBZ3FD2vN7R8QnWqI' }
]

function toggleMenu() {
  if (busy.value) return
  busy.value = true
  open.value = !open.value
  if (open.value) {
    document.body.style.overflow = 'hidden'
  }
  setTimeout(() => { busy.value = false }, 800)
}

function closeMenu() {
  if (!open.value || busy.value) return
  busy.value = true
  open.value = false
  setTimeout(() => {
    document.body.style.overflow = ''
    busy.value = false
  }, 500)
}

function handleItemClick(link) {
  closeMenu()
}

watch(() => route.path, () => {
  if (open.value) closeMenu()
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="sm-wrapper" :data-open="open || undefined">
    <div class="sm-prelayers" aria-hidden="true">
      <div class="sm-prelayer sm-prelayer-1" />
      <div class="sm-prelayer sm-prelayer-2" />
    </div>

    <button
      class="sm-toggle"
      :class="{ open }"
      @click="toggleMenu"
      :aria-label="open ? '关闭菜单' : '打开菜单'"
      :aria-expanded="open"
      type="button"
    >
      <span class="sm-toggle-text">{{ open ? 'Close' : 'Menu' }}</span>
      <span class="sm-icon" :class="{ spin: open }">
        <span class="sm-icon-h" />
        <span class="sm-icon-v" />
      </span>
    </button>

    <aside ref="panelRef" class="sm-panel" :class="{ visible: open }" :aria-hidden="!open">
      <div class="sm-panel-inner">
        <ul class="sm-panel-list">
          <li
            v-for="(item, idx) in items"
            :key="item.label"
            class="sm-panel-itemWrap"
            :class="{ visible: open }"
            :style="{ transitionDelay: open ? (0.15 + idx * 0.08) + 's' : '0s' }"
          >
            <router-link
              :to="item.link"
              class="sm-panel-item"
              :data-index="String(idx + 1).padStart(2, '0')"
              @click="handleItemClick(item.link)"
            >
              <span class="sm-panel-itemLabel">{{ item.label }}</span>
            </router-link>
          </li>
        </ul>

        <div class="sm-socials" :class="{ visible: open }" :style="{ transitionDelay: open ? '0.8s' : '0s' }">
          <h3 class="sm-socials-title">进入万能墙</h3>
          <ul class="sm-socials-list">
            <li v-for="s in socialItems" :key="s.label">
              <a :href="s.link" target="_blank" rel="noopener noreferrer" class="sm-socials-link" @click="closeMenu">
                {{ s.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.sm-wrapper {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9500;
  pointer-events: none;
}

.sm-wrapper[data-open] {
  pointer-events: auto;
}

@media (max-width: 768px) {
  .sm-wrapper {
    display: block;
  }
}

.sm-toggle {
  position: fixed;
  top: 1.2em;
  right: 1.5em;
  z-index: 9510;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #e9e9ef;
  font-weight: 500;
  font-size: 0.82rem;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  line-height: 1;
  overflow: visible;
  pointer-events: auto;
  transition: color 0.3s ease;
}

.sm-toggle.open {
  color: #fff;
}

.sm-toggle-text {
  position: relative;
  display: inline-block;
  overflow: hidden;
  height: 1em;
  min-width: 3em;
}

.sm-toggle-text::after {
  content: attr(data-text);
  position: absolute;
  top: 100%;
  left: 0;
}

.sm-icon {
  position: relative;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.6s cubic-bezier(0.33, 1, 0.68, 1);
}

.sm-icon.spin {
  transform: rotate(225deg);
}

.sm-icon-h,
.sm-icon-v {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 2px;
  background: currentColor;
  border-radius: 2px;
  transform: translate(-50%, -50%);
  transition: transform 0.3s ease;
}

.sm-icon-v {
  transform: translate(-50%, -50%) rotate(90deg);
}

.sm-prelayers {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  pointer-events: none;
  z-index: 9505;
}

.sm-prelayer {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  transform: translateX(100%);
  transition: transform 0.5s cubic-bezier(0.33, 1, 0.68, 1);
  opacity: 0;
}

.sm-prelayer-1 {
  background: rgba(59, 31, 126, 0.9);
  transition-delay: 0s;
}
.sm-prelayer-2 {
  background: rgba(45, 27, 107, 0.95);
  transition-delay: 0.07s;
}

.sm-wrapper[data-open] .sm-prelayer {
  transform: translateX(0);
  opacity: 1;
}

.sm-wrapper[data-open] .sm-prelayer-1 { transition-delay: 0s; }
.sm-wrapper[data-open] .sm-prelayer-2 { transition-delay: 0.07s; }

.sm-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: rgba(30, 15, 60, 0.97);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  display: flex;
  flex-direction: column;
  padding: 7em 2em 2em 2em;
  overflow-y: auto;
  z-index: 9506;
  pointer-events: auto;
  transform: translateX(100%);
  opacity: 0;
  transition: transform 0.55s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.3s ease;
  transition-delay: 0.08s;
}

.sm-panel.visible {
  transform: translateX(0);
  opacity: 1;
  transition-delay: 0.08s;
}

.sm-panel-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.sm-panel-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.sm-panel-itemWrap {
  overflow: hidden;
  line-height: 1;
}

.sm-panel-itemWrap .sm-panel-itemLabel {
  display: inline-block;
  transform: translateY(140%) rotate(10deg);
  opacity: 0;
  transition: transform 0.7s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.5s ease;
}

.sm-panel-itemWrap.visible .sm-panel-itemLabel {
  transform: translateY(0) rotate(0deg);
  opacity: 1;
}

.sm-panel-item {
  position: relative;
  color: #f0e6ff;
  font-weight: 700;
  font-size: clamp(2rem, 7vw, 3.2rem);
  cursor: pointer;
  line-height: 1.2;
  letter-spacing: -1px;
  text-transform: none;
  display: inline-block;
  text-decoration: none;
  padding: 0.15em 2em 0.15em 0;
  transition: color 0.25s ease;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
}

.sm-panel-item::after {
  content: attr(data-index);
  position: absolute;
  top: 0.15em;
  right: 0;
  font-size: 0.85rem;
  font-weight: 400;
  color: rgba(179, 136, 255, 0.4);
  letter-spacing: 0;
  pointer-events: none;
}

.sm-panel-item:hover {
  color: #b388ff;
}

.sm-socials {
  margin-top: auto;
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.sm-socials.visible {
  opacity: 1;
  transform: translateY(0);
}

.sm-socials-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 500;
  color: #b388ff;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
}

.sm-socials-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
}

.sm-socials-link {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(224, 215, 255, 0.7);
  text-decoration: none;
  padding: 4px 0;
  display: inline-block;
  transition: color 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
}

.sm-socials-link:hover {
  color: #fff;
}
</style>
