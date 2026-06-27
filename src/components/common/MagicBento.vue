<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps({
  textAutoHide: { type: Boolean, default: true },
  enableSpotlight: { type: Boolean, default: true },
  enableBorderGlow: { type: Boolean, default: true },
  enableTilt: { type: Boolean, default: false },
  spotlightRadius: { type: Number, default: 300 },
  glowColor: { type: String, default: '132, 0, 255' },
  clickEffect: { type: Boolean, default: true },
  cards: {
    type: Array,
    default: () => [
      { color: '#120F17', title: 'Analytics', description: 'Track user behavior', label: 'Insights' },
      { color: '#120F17', title: 'Dashboard', description: 'Centralized data view', label: 'Overview' },
      { color: '#120F17', title: 'Collaboration', description: 'Work together seamlessly', label: 'Teamwork' },
      { color: '#120F17', title: 'Automation', description: 'Streamline workflows', label: 'Efficiency' },
      { color: '#120F17', title: 'Integration', description: 'Connect favorite tools', label: 'Connectivity' },
      { color: '#120F17', title: 'Security', description: 'Enterprise-grade protection', label: 'Protection' }
    ]
  }
})

const gridRef = ref(null)
const spotlightRef = ref(null)

function updateGlow(card, mouseX, mouseY, radius) {
  const rect = card.getBoundingClientRect()
  const x = ((mouseX - rect.left) / rect.width) * 100
  const y = ((mouseY - rect.top) / rect.height) * 100
  card.style.setProperty('--glow-x', `${x}%`)
  card.style.setProperty('--glow-y', `${y}%`)
  card.style.setProperty('--glow-intensity', '1')
  card.style.setProperty('--glow-radius', `${radius}px`)
}

function handleSpotlight(e) {
  if (!spotlightRef.value || !gridRef.value) return
  const section = gridRef.value.closest('.bento-section')
  const rect = section?.getBoundingClientRect()
  const inside = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom

  if (!inside) {
    spotlightRef.value.style.opacity = '0'
    gridRef.value.querySelectorAll('.magic-bento-card').forEach(c => {
      c.style.setProperty('--glow-intensity', '0')
    })
    return
  }

  spotlightRef.value.style.left = e.clientX + 'px'
  spotlightRef.value.style.top = e.clientY + 'px'
  spotlightRef.value.style.opacity = '1'

  gridRef.value.querySelectorAll('.magic-bento-card').forEach(card => {
    updateGlow(card, e.clientX, e.clientY, props.spotlightRadius)
  })
}

function handleTilt(e) {
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const cx = rect.width / 2, cy = rect.height / 2
  const rx = ((y - cy) / cy) * -8
  const ry = ((x - cx) / cx) * 8
  card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`
}

function resetTilt(e) {
  e.currentTarget.style.transform = ''
}

function handleClick(e) {
  if (!props.clickEffect) return
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left, y = e.clientY - rect.top
  const maxD = Math.max(
    Math.hypot(x, y), Math.hypot(x - rect.width, y),
    Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height)
  )
  const ripple = document.createElement('div')
  ripple.style.cssText = `position:absolute;width:${maxD*2}px;height:${maxD*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${props.glowColor},0.4) 0%,rgba(${props.glowColor},0.2) 30%,transparent 70%);left:${x-maxD}px;top:${y-maxD}px;pointer-events:none;z-index:1000;transform:scale(0);opacity:1;transition:transform 0.6s cubic-bezier(0.33,1,0.68,1),opacity 0.6s ease;`
  card.appendChild(ripple)
  requestAnimationFrame(() => {
    ripple.style.transform = 'scale(1)'
    ripple.style.opacity = '0'
  })
  setTimeout(() => ripple.remove(), 700)
}

onMounted(() => {
  if (props.enableSpotlight) {
    document.addEventListener('mousemove', handleSpotlight)
  }
})
onUnmounted(() => {
  document.removeEventListener('mousemove', handleSpotlight)
})
</script>

<template>
  <div ref="gridRef" class="card-grid bento-section">
    <div
      v-for="(card, i) in props.cards"
      :key="i"
      class="magic-bento-card"
      :class="{ 'magic-bento-card--text-autohide': textAutoHide, 'magic-bento-card--border-glow': enableBorderGlow }"
      :style="{ backgroundColor: card.color, '--glow-color': glowColor }"
      @mousemove="enableTilt ? handleTilt($event) : null"
      @mouseleave="enableTilt ? resetTilt($event) : null"
      @click="(e) => { handleClick(e); if (card.link) router.push(card.link) }"
    >
      <div class="magic-bento-card__header">
        <div class="magic-bento-card__label">{{ card.label }}</div>
      </div>
      <div class="magic-bento-card__content">
        <h2 class="magic-bento-card__title">{{ card.title }}</h2>
        <p class="magic-bento-card__description">{{ card.description }}</p>
      </div>
    </div>
    <div v-if="enableSpotlight" ref="spotlightRef" class="global-spotlight" />
  </div>
</template>

<style>
.card-grid {
  display: grid;
  gap: 0.5em;
  padding: 0.75em;
  max-width: 54em;
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.5rem);
}

.magic-bento-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  aspect-ratio: 4/3;
  min-height: 200px;
  width: 100%;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 20px;
  border: 1px solid #2F293A;
  background: #120F17;
  font-weight: 300;
  overflow: hidden;
  transition: all 0.3s ease;
  --glow-x: 50%;
  --glow-y: 50%;
  --glow-intensity: 0;
  --glow-radius: 200px;
}

.magic-bento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.magic-bento-card__header,
.magic-bento-card__content {
  display: flex;
  position: relative;
  color: #fff;
}

.magic-bento-card__header {
  gap: 0.75em;
  justify-content: space-between;
}

.magic-bento-card__content {
  flex-direction: column;
}

.magic-bento-card__label {
  font-size: 16px;
}

.magic-bento-card__title {
  font-weight: 400;
  font-size: 16px;
  margin: 0 0 0.25em;
}

.magic-bento-card__description {
  font-size: 12px;
  line-height: 1.2;
  opacity: 0.9;
}

.magic-bento-card--text-autohide .magic-bento-card__title,
.magic-bento-card--text-autohide .magic-bento-card__description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.magic-bento-card--text-autohide .magic-bento-card__title {
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.magic-bento-card--text-autohide .magic-bento-card__description {
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

@media (max-width: 599px) {
  .card-grid {
    grid-template-columns: 1fr;
    width: 90%;
    margin: 0 auto;
    padding: 0.5em;
  }
  .magic-bento-card {
    width: 100%;
    min-height: 180px;
  }
}

@media (min-width: 600px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .magic-bento-card:nth-child(3) {
    grid-column: span 2;
    grid-row: span 2;
  }
  .magic-bento-card:nth-child(4) {
    grid-column: 1 / span 2;
    grid-row: 2 / span 2;
  }
  .magic-bento-card:nth-child(6) {
    grid-column: 4;
    grid-row: 3;
  }
}

.magic-bento-card--border-glow::after {
  content: '';
  position: absolute;
  inset: 0;
  padding: 6px;
  background: radial-gradient(
    var(--glow-radius) circle at var(--glow-x) var(--glow-y),
    rgba(132, 0, 255, calc(var(--glow-intensity) * 0.8)) 0%,
    rgba(132, 0, 255, calc(var(--glow-intensity) * 0.4)) 30%,
    transparent 60%
  );
  border-radius: inherit;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.magic-bento-card--border-glow:hover::after {
  opacity: 1;
}

.magic-bento-card--border-glow:hover {
  box-shadow:
    0 4px 20px rgba(46, 24, 78, 0.4),
    0 0 30px rgba(132, 0, 255, 0.2);
}

.global-spotlight {
  position: fixed;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle,
    rgba(132, 0, 255, 0.15) 0%,
    rgba(132, 0, 255, 0.08) 15%,
    rgba(132, 0, 255, 0.04) 25%,
    rgba(132, 0, 255, 0.02) 40%,
    rgba(132, 0, 255, 0.01) 65%,
    transparent 70%
  );
  z-index: 200;
  opacity: 0;
  transform: translate(-50%, -50%);
  mix-blend-mode: screen;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.bento-section {
  position: relative;
  user-select: none;
}
</style>
