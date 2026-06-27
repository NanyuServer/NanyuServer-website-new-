<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  className: { type: String, default: '' },
  itemDistance: { type: Number, default: 100 },
  itemScale: { type: Number, default: 0.03 },
  itemStackDistance: { type: Number, default: 30 },
  stackPosition: { type: Number, default: 0.2 },
  scaleEndPosition: { type: Number, default: 0.1 },
  baseScale: { type: Number, default: 0.85 },
  rotationAmount: { type: Number, default: 0 },
  blurAmount: { type: Number, default: 0 }
})

const scrollerRef = ref(null)
const cardsRef = ref([])
const lastTransforms = new Map()
let raf = null

function calculateProgress(scrollTop, start, end) {
  if (scrollTop < start) return 0
  if (scrollTop > end) return 1
  return (scrollTop - start) / (end - start)
}

function updateCardTransforms() {
  if (!cardsRef.value.length) return

  const scrollTop = window.scrollY
  const containerHeight = window.innerHeight
  const stackPositionPx = props.stackPosition * containerHeight
  const scaleEndPositionPx = props.scaleEndPosition * containerHeight

  const endEl = scrollerRef.value?.querySelector('.scroll-stack-end')
  const endElementTop = endEl ? endEl.getBoundingClientRect().top + window.scrollY : 0

  cardsRef.value.forEach((card, i) => {
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cardTop = rect.top + window.scrollY

    const triggerStart = cardTop - stackPositionPx - props.itemStackDistance * i
    const triggerEnd = cardTop - scaleEndPositionPx
    const pinStart = triggerStart
    const pinEnd = endElementTop - containerHeight / 2

    const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
    const targetScale = props.baseScale + i * props.itemScale
    const scale = 1 - scaleProgress * (1 - targetScale)
    const rotation = props.rotationAmount ? i * props.rotationAmount * scaleProgress : 0

    let blur = 0
    if (props.blurAmount) {
      let topCardIndex = 0
      for (let j = 0; j < cardsRef.value.length; j++) {
        if (!cardsRef.value[j]) continue
        const jRect = cardsRef.value[j].getBoundingClientRect()
        const jTop = jRect.top + window.scrollY
        const jTriggerStart = jTop - stackPositionPx - props.itemStackDistance * j
        if (scrollTop >= jTriggerStart) topCardIndex = j
      }
      if (i < topCardIndex) {
        blur = Math.max(0, (topCardIndex - i) * props.blurAmount)
      }
    }

    let translateY = 0
    const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd
    if (isPinned) {
      translateY = scrollTop - cardTop + stackPositionPx + props.itemStackDistance * i
    } else if (scrollTop > pinEnd) {
      translateY = pinEnd - cardTop + stackPositionPx + props.itemStackDistance * i
    }

    const newT = {
      translateY: Math.round(translateY * 100) / 100,
      scale: Math.round(scale * 1000) / 1000,
      rotation: Math.round(rotation * 100) / 100,
      blur: Math.round(blur * 100) / 100
    }

    const last = lastTransforms.get(i)
    const changed = !last ||
      Math.abs(last.translateY - newT.translateY) > 0.1 ||
      Math.abs(last.scale - newT.scale) > 0.001 ||
      Math.abs(last.rotation - newT.rotation) > 0.1 ||
      Math.abs(last.blur - newT.blur) > 0.1

    if (changed) {
      card.style.transform = `translate3d(0, ${newT.translateY}px, 0) scale(${newT.scale}) rotate(${newT.rotation}deg)`
      card.style.filter = newT.blur > 0 ? `blur(${newT.blur}px)` : ''
      lastTransforms.set(i, newT)
    }
  })
}

function onScroll() {
  if (raf) cancelAnimationFrame(raf)
  raf = requestAnimationFrame(updateCardTransforms)
}

onMounted(async () => {
  await nextTick()
  const scroller = scrollerRef.value
  if (!scroller) return

  const cards = Array.from(scroller.querySelectorAll('.scroll-stack-card'))
  cardsRef.value = cards

  cards.forEach((card, i) => {
    if (i < cards.length - 1) {
      card.style.marginBottom = `${props.itemDistance}px`
    }
    card.style.willChange = 'transform, filter'
    card.style.transformOrigin = 'top center'
    card.style.backfaceVisibility = 'hidden'
  })

  window.addEventListener('scroll', onScroll, { passive: true })
  updateCardTransforms()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  if (raf) cancelAnimationFrame(raf)
  cardsRef.value = []
  lastTransforms.clear()
})
</script>

<template>
  <div ref="scrollerRef" :class="['scroll-stack-scroller', className]">
    <div class="scroll-stack-inner">
      <slot />
      <div class="scroll-stack-end" />
    </div>
  </div>
</template>

<style scoped>
.scroll-stack-scroller {
  position: relative;
  width: 100%;
  overflow: visible;
}

.scroll-stack-inner {
  padding: 0 0 30rem;
  min-height: 100vh;
}

.scroll-stack-end {
  width: 100%;
  height: 1px;
}
</style>
