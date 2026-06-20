<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  displacementScale: { type: Number, default: 64 },
  blurAmount: { type: Number, default: 0.08 },
  saturation: { type: Number, default: 150 },
  aberrationIntensity: { type: Number, default: 2 },
  elasticity: { type: Number, default: 0.25 },
  cornerRadius: { type: Number, default: 24 },
  overLight: { type: Boolean, default: false }
})

const containerRef = ref(null)
const mouseX = ref(0.5)
const mouseY = ref(0.5)
const isHovering = ref(false)
const filterId = computed(() => `liquid-glass-${Math.random().toString(36).slice(2, 8)}`)

const scale = props.displacementScale

function onMouseMove(e) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  mouseX.value = (e.clientX - rect.left) / rect.width
  mouseY.value = (e.clientY - rect.top) / rect.height
  isHovering.value = true
}

function onMouseLeave() {
  isHovering.value = false
  mouseX.value = 0.5
  mouseY.value = 0.5
}

const style = computed(() => ({
  borderRadius: props.cornerRadius + 'px',
  backdropFilter: `blur(${props.blurAmount * 16}px) saturate(${props.saturation}%)`,
  WebkitBackdropFilter: `blur(${props.blurAmount * 16}px) saturate(${props.saturation}%)`,
  filter: `url(#${filterId.value})`,
  transform: isHovering.value
    ? `translate(${(mouseX.value - 0.5) * props.elasticity * 8}px, ${(mouseY.value - 0.5) * props.elasticity * 8}px)`
    : 'none',
  transition: isHovering.value ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
  background: props.overLight
    ? 'rgba(255, 255, 255, 0.15)'
    : 'rgba(30, 10, 50, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05),
    0 0 ${isHovering.value ? '24px' : '12px'} rgba(179, 136, 255, ${isHovering.value ? 0.15 : 0.08})
  `
}))

const displacementX = computed(() => {
  const base = scale * 0.5
  const mouseEffect = (mouseX.value - 0.5) * scale * 0.8
  return base + mouseEffect
})

const displacementY = computed(() => {
  const base = scale * 0.5
  const mouseEffect = (mouseY.value - 0.5) * scale * 0.8
  return base + mouseEffect
})
</script>

<template>
  <svg :id="filterId" style="position: absolute; width: 0; height: 0;">
    <defs>
      <filter :id="filterId" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.008"
          numOctaves="3"
          seed="2"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2" result="blurredNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurredNoise"
          :scale="displacementScale"
          xChannelSelector="R"
          yChannelSelector="G"
          result="displaced"
        />
      </filter>
    </defs>
  </svg>

  <div
    ref="containerRef"
    class="liquid-glass"
    :style="style"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <div class="liquid-glass-highlight" />
    <div class="liquid-glass-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.liquid-glass {
  position: relative;
  overflow: hidden;
  will-change: transform, filter;
  pointer-events: auto;
}

.liquid-glass-highlight {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    transparent 40%,
    transparent 60%,
    rgba(255, 255, 255, 0.05) 100%
  );
  z-index: 1;
}

.liquid-glass-content {
  position: relative;
  z-index: 2;
}
</style>
