<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const cursorX = ref(0)
const cursorY = ref(0)
const ringX = ref(0)
const ringY = ref(0)
const isMobile = ref(false)

let animId = null

function onMove(e) {
  cursorX.value = e.clientX
  cursorY.value = e.clientY
}

function animate() {
  ringX.value += (cursorX.value - ringX.value) * 0.12
  ringY.value += (cursorY.value - ringY.value) * 0.12
  animId = requestAnimationFrame(animate)
}

onMounted(() => {
  isMobile.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (!isMobile.value) {
    document.addEventListener('mousemove', onMove)
    animate()
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMove)
  cancelAnimationFrame(animId)
})
</script>

<template>
  <template v-if="!isMobile">
    <div
      class="custom-cursor"
      :style="{ left: cursorX + 'px', top: cursorY + 'px' }"
    />
    <div
      class="cursor-ring"
      :style="{ left: ringX + 'px', top: ringY + 'px' }"
    />
  </template>
</template>

<style scoped>
.custom-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 99999;
  width: 12px;
  height: 12px;
  background: var(--accent-light);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s, background 0.3s;
  mix-blend-mode: screen;
}

.cursor-ring {
  position: fixed;
  pointer-events: none;
  z-index: 99998;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(168, 127, 232, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.25s var(--ease-out), width 0.4s, height 0.4s, border-color 0.3s;
}
</style>
