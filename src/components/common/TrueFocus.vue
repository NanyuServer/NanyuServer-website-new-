<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  sentence: { type: String, default: '南渝 万能墙' },
  separator: { type: String, default: ' ' },
  blurAmount: { type: Number, default: 5 },
  borderColor: { type: String, default: '#7b55d4' },
  glowColor: { type: String, default: 'rgba(123, 85, 212, 0.6)' },
  animationDuration: { type: Number, default: 0.5 },
  pauseBetweenAnimations: { type: Number, default: 1 }
})

const words = computed(() => props.sentence.split(props.separator))
const currentIndex = ref(0)
const containerRef = ref(null)
const wordRefs = ref([])
const focusRect = ref({ x: 0, y: 0, width: 0, height: 0 })

let interval = null
let resizeObserver = null

function updateFocusRect() {
  if (currentIndex.value < 0 || !wordRefs.value[currentIndex.value] || !containerRef.value) return
  const parentRect = containerRef.value.getBoundingClientRect()
  const activeEl = wordRefs.value[currentIndex.value]
  if (!activeEl) return
  const activeRect = activeEl.getBoundingClientRect()
  focusRect.value = {
    x: activeRect.left - parentRect.left,
    y: activeRect.top - parentRect.top,
    width: activeRect.width,
    height: activeRect.height
  }
}

onMounted(() => {
  interval = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % words.value.length
    setTimeout(updateFocusRect, 0)
  }, (props.animationDuration + props.pauseBetweenAnimations) * 1000)
  setTimeout(updateFocusRect, 200)

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => updateFocusRect())
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  clearInterval(interval)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <div class="focus-container" ref="containerRef">
    <span
      v-for="(word, index) in words"
      :key="index"
      :ref="el => { if (el) wordRefs[index] = el }"
      class="focus-word"
      :class="{ active: index === currentIndex }"
      :style="{
        filter: index === currentIndex ? 'blur(0px)' : `blur(${blurAmount}px)`,
        transition: `filter ${animationDuration}s ease`
      }"
    >{{ word }}</span>

    <div
      class="focus-frame"
      :style="{
        '--border-color': borderColor,
        '--glow-color': glowColor,
        left: focusRect.x + 'px',
        top: focusRect.y + 'px',
        width: focusRect.width + 'px',
        height: focusRect.height + 'px',
        opacity: currentIndex >= 0 ? 1 : 0,
        transition: `left ${animationDuration}s cubic-bezier(0.34,1.56,0.64,1), top ${animationDuration}s cubic-bezier(0.34,1.56,0.64,1), width ${animationDuration}s cubic-bezier(0.34,1.56,0.64,1), height ${animationDuration}s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s`
      }"
    >
      <span class="corner top-left"></span>
      <span class="corner top-right"></span>
      <span class="corner bottom-left"></span>
      <span class="corner bottom-right"></span>
    </div>
  </div>
</template>

<style scoped>
.focus-container {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3em;
  justify-content: center;
}
.focus-word {
  display: inline-block;
  will-change: filter;
  color: #fff;
}
.focus-frame {
  position: absolute;
  pointer-events: none;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 0 20px var(--glow-color), 0 0 60px var(--glow-color);
  z-index: 1;
}
.corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: var(--border-color);
  border-style: solid;
}
.top-left { top: -2px; left: -2px; border-width: 3px 0 0 3px; border-radius: 6px 0 0 0; }
.top-right { top: -2px; right: -2px; border-width: 3px 3px 0 0; border-radius: 0 6px 0 0; }
.bottom-left { bottom: -2px; left: -2px; border-width: 0 0 3px 3px; border-radius: 0 0 0 6px; }
.bottom-right { bottom: -2px; right: -2px; border-width: 0 3px 3px 0; border-radius: 0 0 6px 0; }
</style>
