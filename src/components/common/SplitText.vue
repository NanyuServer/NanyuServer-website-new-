<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  delay: { type: Number, default: 40 },
  duration: { type: Number, default: 0.8 },
  tag: { type: String, default: 'div' }
})

const el = ref(null)
const revealed = ref(false)
let observer = null

onMounted(() => {
  if (!el.value) return
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealed.value = true
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.2 })
  observer.observe(el.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

const chars = computed(() => {
  // Split into individual characters, preserving spaces
  return props.text.split('').map((char, i) => ({
    char,
    index: i,
    style: {
      transitionDelay: `${i * props.delay}ms`,
      transitionDuration: `${props.duration}s`
    }
  }))
})
</script>

<template>
  <component :is="tag" class="split-text" ref="el" :class="{ revealed }">
    <span
      v-for="c in chars"
      :key="c.index"
      class="split-char"
      :style="c.style"
      :aria-hidden="c.char === ' ' ? true : undefined"
    >{{ c.char === ' ' ? '\u00A0' : c.char }}</span>
  </component>
</template>

<style scoped>
.split-text {
  opacity: 0;
}
.split-text.revealed {
  opacity: 1;
}
.split-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}
.revealed .split-char {
  opacity: 1;
  transform: translateY(0);
}
</style>
