<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  sentence: { type: String, default: 'True Focus' },
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
  if (currentIndex.value < 0) return
  const el = wordRefs.value[currentIndex.value]
  const cont = containerRef.value
  if (!el || !cont) return
  const pr = cont.getBoundingClientRect()
  const ar = el.getBoundingClientRect()
  focusRect.value = {
    x: ar.left - pr.left,
    y: ar.top - pr.top,
    width: ar.width,
    height: ar.height
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
        '--border-color': borderColor,
        '--glow-color': glowColor,
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
  gap: 1em;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  outline: none;
  user-select: none;
}
.focus-word {
  position: relative;
  font-size: 3rem;
  font-weight: 900;
  cursor: pointer;
  transition: filter 0.3s ease, color 0.3s ease;
  outline: none;
  user-select: none;
  color: #fff;
}
.focus-word.active {
  filter: blur(0);
}
.focus-frame {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  box-sizing: content-box;
  border: none;
  z-index: 1;
}
.corner {
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 3px solid var(--border-color, #fff);
  filter: drop-shadow(0px 0px 4px var(--border-color, #fff));
  border-radius: 3px;
  transition: none;
}
.top-left { top: -10px; left: -10px; border-right: none; border-bottom: none; }
.top-right { top: -10px; right: -10px; border-left: none; border-bottom: none; }
.bottom-left { bottom: -10px; left: -10px; border-right: none; border-top: none; }
.bottom-right { bottom: -10px; right: -10px; border-left: none; border-top: none; }
</style>
