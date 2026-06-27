<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  borderRadius: { type: Number, default: 24 },
  glowRadius: { type: Number, default: 40 },
  edgeSensitivity: { type: Number, default: 30 },
  coneSpread: { type: Number, default: 25 },
  glowIntensity: { type: Number, default: 1 },
  fillOpacity: { type: Number, default: 0.5 },
  colors: { type: Array, default: () => ['#a87fe8', '#e86fa3', '#5de8d0'] },
  glowColor: { type: String, default: '268 80 80' },
  backgroundColor: { type: String, default: '' }
})

const cardRef = ref(null)
const edgeProximity = ref(0)
const cursorAngle = ref(45)

const colorSensitivity = computed(() => props.edgeSensitivity + 20)

function getEdgeProximity(el, x, y) {
  const w = el.clientWidth
  const h = el.clientHeight
  const cx = w / 2
  const cy = h / 2
  const dx = x - cx
  const dy = y - cy
  let kx = Infinity, ky = Infinity
  if (dx !== 0) kx = cx / Math.abs(dx)
  if (dy !== 0) ky = cy / Math.abs(dy)
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
}

function getCursorAngle(el, x, y) {
  const cx = el.clientWidth / 2
  const cy = el.clientHeight / 2
  const dx = x - cx
  const dy = y - cy
  if (dx === 0 && dy === 0) return 0
  const rad = Math.atan2(dy, dx)
  let deg = rad * (180 / Math.PI) + 90
  if (deg < 0) deg += 360
  return deg
}

function onPointerMove(e) {
  const el = cardRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  edgeProximity.value = getEdgeProximity(el, x, y) * 100
  cursorAngle.value = getCursorAngle(el, x, y)
}

function onPointerLeave() {
  edgeProximity.value = 0
}

function parseHSL(hslStr) {
  const m = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!m) return { h: 268, s: 80, l: 80 }
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) }
}

const glowHSL = computed(() => {
  const { h, s, l } = parseHSL(props.glowColor)
  const base = `${h}deg ${s}% ${l}%`
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const result = {}
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']
  for (let i = 0; i < opacities.length; i++) {
    result[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * props.glowIntensity, 100)}%)`
  }
  return result
})

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1]

const gradientVars = computed(() => {
  const vars = {}
  for (let i = 0; i < 7; i++) {
    const c = props.colors[Math.min(COLOR_MAP[i], props.colors.length - 1)]
    vars[`--gb-${i}`] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`
  }
  vars['--gb-base'] = `linear-gradient(${props.colors[0]} 0 100%)`
  return vars
})

const cardStyle = computed(() => ({
  '--edge-proximity': edgeProximity.value.toFixed(3),
  '--cursor-angle': cursorAngle.value.toFixed(3) + 'deg',
  '--edge-sensitivity': props.edgeSensitivity,
  '--border-radius': props.borderRadius + 'px',
  '--glow-padding': props.glowRadius + 'px',
  '--cone-spread': props.coneSpread,
  '--fill-opacity': props.fillOpacity,
  '--colour-sensitivity': colorSensitivity.value,
  ...(props.backgroundColor ? { '--card-bg': props.backgroundColor } : {}),
  ...glowHSL.value,
  ...gradientVars.value
}))
</script>

<template>
  <div
    ref="cardRef"
    class="border-glow-card"
    :style="cardStyle"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <span class="edge-light" />
    <div class="border-glow-inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.border-glow-card {
  --edge-proximity: 0;
  --cursor-angle: 45deg;
  --edge-sensitivity: 30;
  --colour-sensitivity: 50;
  --border-radius: 24px;
  --glow-padding: 40px;
  --cone-spread: 25;
  --fill-opacity: 0.5;

  position: relative;
  border-radius: var(--border-radius);
  isolation: isolate;
  transform: translate3d(0, 0, 0.01px);
  display: grid;
  border: 1px solid rgb(255 255 255 / 12%);
  background: var(--card-bg, rgba(30, 10, 50, 0.35));
  overflow: visible;
  box-shadow:
    rgba(0, 0, 0, 0.1) 0px 1px 2px,
    rgba(0, 0, 0, 0.1) 0px 2px 4px,
    rgba(0, 0, 0, 0.1) 0px 4px 8px,
    rgba(0, 0, 0, 0.1) 0px 8px 16px,
    rgba(0, 0, 0, 0.1) 0px 16px 32px,
    rgba(0, 0, 0, 0.1) 0px 32px 64px;
}

.border-glow-card::before,
.border-glow-card::after,
.edge-light {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transition: opacity 0.25s ease-out;
  z-index: -1;
}

.border-glow-card:not(:hover)::before,
.border-glow-card:not(:hover)::after,
.border-glow-card:not(:hover) > .edge-light {
  opacity: 0;
  transition: opacity 0.65s ease-in-out;
}

/* Mesh gradient border */
.border-glow-card::before {
  border: 1px solid transparent;
  background:
    linear-gradient(var(--card-bg, rgba(30, 10, 50, 0.35)) 0 100%) padding-box,
    linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box,
    var(--gb-0, radial-gradient(at 80% 55%, #a87fe8 0px, transparent 50%)) border-box,
    var(--gb-1, radial-gradient(at 69% 34%, #e86fa3 0px, transparent 50%)) border-box,
    var(--gb-2, radial-gradient(at 8% 6%, #5de8d0 0px, transparent 50%)) border-box,
    var(--gb-3, radial-gradient(at 41% 38%, #a87fe8 0px, transparent 50%)) border-box,
    var(--gb-4, radial-gradient(at 86% 85%, #e86fa3 0px, transparent 50%)) border-box,
    var(--gb-5, radial-gradient(at 82% 18%, #5de8d0 0px, transparent 50%)) border-box,
    var(--gb-6, radial-gradient(at 51% 4%, #e86fa3 0px, transparent 50%)) border-box,
    var(--gb-base, linear-gradient(#a87fe8 0 100%)) border-box;

  opacity: calc((var(--edge-proximity) - var(--colour-sensitivity)) / (100 - var(--colour-sensitivity)));
  mask-image: conic-gradient(
    from var(--cursor-angle) at center,
    black calc(var(--cone-spread) * 1%),
    transparent calc((var(--cone-spread) + 15) * 1%),
    transparent calc((100 - var(--cone-spread) - 15) * 1%),
    black calc((100 - var(--cone-spread)) * 1%)
  );
}

/* Inner color fill near edges */
.border-glow-card::after {
  border: 1px solid transparent;
  background:
    var(--gb-0, radial-gradient(at 80% 55%, #a87fe8 0px, transparent 50%)) padding-box,
    var(--gb-1, radial-gradient(at 69% 34%, #e86fa3 0px, transparent 50%)) padding-box,
    var(--gb-2, radial-gradient(at 8% 6%, #5de8d0 0px, transparent 50%)) padding-box,
    var(--gb-3, radial-gradient(at 41% 38%, #a87fe8 0px, transparent 50%)) padding-box,
    var(--gb-4, radial-gradient(at 86% 85%, #e86fa3 0px, transparent 50%)) padding-box,
    var(--gb-5, radial-gradient(at 82% 18%, #5de8d0 0px, transparent 50%)) padding-box,
    var(--gb-6, radial-gradient(at 51% 4%, #e86fa3 0px, transparent 50%)) padding-box,
    var(--gb-base, linear-gradient(#a87fe8 0 100%)) padding-box;

  mask-image:
    linear-gradient(to bottom, black, black),
    radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%),
    radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%),
    radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%),
    radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%),
    radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%),
    conic-gradient(from var(--cursor-angle) at center, transparent 5%, black 15%, black 85%, transparent 95%);
  mask-composite: exclude, add, add, add, add, add;
  -webkit-mask-composite: source-out, source-over, source-over, source-over, source-over, source-over;
  opacity: calc(
    var(--fill-opacity) *
    (var(--edge-proximity) - var(--colour-sensitivity)) /
    (100 - var(--colour-sensitivity))
  );
  mix-blend-mode: soft-light;
}

/* Outer glow */
.edge-light {
  inset: calc(var(--glow-padding) * -1);
  pointer-events: none;
  z-index: 1;
  mask-image: conic-gradient(
    from var(--cursor-angle) at center,
    black 2.5%, transparent 10%, transparent 90%, black 97.5%
  );
  opacity: calc(
    (var(--edge-proximity) - var(--edge-sensitivity)) /
    (100 - var(--edge-sensitivity))
  );
  mix-blend-mode: plus-lighter;
}

.edge-light::before {
  content: "";
  position: absolute;
  inset: var(--glow-padding);
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px var(--glow-color, hsl(268deg 80% 80% / 100%)),
    inset 0 0 1px 0 var(--glow-color-60, hsl(268deg 80% 80% / 60%)),
    inset 0 0 3px 0 var(--glow-color-50, hsl(268deg 80% 80% / 50%)),
    inset 0 0 6px 0 var(--glow-color-40, hsl(268deg 80% 80% / 40%)),
    inset 0 0 15px 0 var(--glow-color-30, hsl(268deg 80% 80% / 30%)),
    inset 0 0 25px 2px var(--glow-color-20, hsl(268deg 80% 80% / 20%)),
    inset 0 0 50px 2px var(--glow-color-10, hsl(268deg 80% 80% / 10%)),
    0 0 1px 0 var(--glow-color-60, hsl(268deg 80% 80% / 60%)),
    0 0 3px 0 var(--glow-color-50, hsl(268deg 80% 80% / 50%)),
    0 0 6px 0 var(--glow-color-40, hsl(268deg 80% 80% / 40%)),
    0 0 15px 0 var(--glow-color-30, hsl(268deg 80% 80% / 30%)),
    0 0 25px 2px var(--glow-color-20, hsl(268deg 80% 80% / 20%)),
    0 0 50px 2px var(--glow-color-10, hsl(268deg 80% 80% / 10%));
}

.border-glow-inner {
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;
  z-index: 1;
  border-radius: inherit;
}
</style>
