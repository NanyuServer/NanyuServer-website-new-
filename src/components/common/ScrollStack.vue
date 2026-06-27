<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  className: { type: String, default: '' },
  itemDistance: { type: Number, default: 100 },
  itemScale: { type: Number, default: 0.03 },
  itemStackDistance: { type: Number, default: 30 },
  stackPosition: { type: String, default: '20%' },
  scaleEndPosition: { type: String, default: '10%' },
  baseScale: { type: Number, default: 0.85 },
  scaleDuration: { type: Number, default: 0.5 },
  rotationAmount: { type: Number, default: 0 },
  blurAmount: { type: Number, default: 0 },
  useWindowScroll: { type: Boolean, default: true },
  onStackComplete: { type: Function, default: undefined }
})

const scrollerRef = ref(null)
const stackCompletedRef = ref(false)
const cardsRef = ref([])
const lastTransformsRef = new Map()
const isUpdatingRef = ref(false)
let raf = null

function calculateProgress(scrollTop, start, end) {
  if (scrollTop < start) return 0
  if (scrollTop > end) return 1
  return (scrollTop - start) / (end - start)
}

function parsePercentage(value, containerHeight) {
  if (typeof value === 'string' && value.includes('%')) {
    return (parseFloat(value) / 100) * containerHeight
  }
  return parseFloat(value)
}

function getScrollData() {
  if (props.useWindowScroll) {
    return {
      scrollTop: window.scrollY,
      containerHeight: window.innerHeight,
      scrollContainer: document.documentElement
    }
  } else {
    const scroller = scrollerRef.value
    return {
      scrollTop: scroller.scrollTop,
      containerHeight: scroller.clientHeight,
      scrollContainer: scroller
    }
  }
}

function getElementOffset(element) {
  if (props.useWindowScroll) {
    const rect = element.getBoundingClientRect()
    return rect.top + window.scrollY
  } else {
    return element.offsetTop
  }
}

function updateCardTransforms() {
  if (!cardsRef.value.length || isUpdatingRef.value) return

  isUpdatingRef.value = true

  const { scrollTop, containerHeight } = getScrollData()
  const stackPositionPx = parsePercentage(props.stackPosition, containerHeight)
  const scaleEndPositionPx = parsePercentage(props.scaleEndPosition, containerHeight)

  const endElement = props.useWindowScroll
    ? document.querySelector('.scroll-stack-end')
    : scrollerRef.value?.querySelector('.scroll-stack-end')

  const endElementTop = endElement ? getElementOffset(endElement) : 0

  cardsRef.value.forEach((card, i) => {
    if (!card) return

    const cardTop = getElementOffset(card)
    const triggerStart = cardTop - stackPositionPx - props.itemStackDistance * i
    const triggerEnd = cardTop - scaleEndPositionPx
    const pinStart = cardTop - stackPositionPx - props.itemStackDistance * i
    const pinEnd = endElementTop - containerHeight / 2

    const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
    const targetScale = props.baseScale + i * props.itemScale
    const scale = 1 - scaleProgress * (1 - targetScale)
    const rotation = props.rotationAmount ? i * props.rotationAmount * scaleProgress : 0

    let blur = 0
    if (props.blurAmount) {
      let topCardIndex = 0
      for (let j = 0; j < cardsRef.value.length; j++) {
        const jCardTop = getElementOffset(cardsRef.value[j])
        const jTriggerStart = jCardTop - stackPositionPx - props.itemStackDistance * j
        if (scrollTop >= jTriggerStart) {
          topCardIndex = j
        }
      }
      if (i < topCardIndex) {
        const depthInStack = topCardIndex - i
        blur = Math.max(0, depthInStack * props.blurAmount)
      }
    }

    let translateY = 0
    const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd

    if (isPinned) {
      translateY = scrollTop - cardTop + stackPositionPx + props.itemStackDistance * i
    } else if (scrollTop > pinEnd) {
      translateY = pinEnd - cardTop + stackPositionPx + props.itemStackDistance * i
    }

    const newTransform = {
      translateY: Math.round(translateY * 100) / 100,
      scale: Math.round(scale * 1000) / 1000,
      rotation: Math.round(rotation * 100) / 100,
      blur: Math.round(blur * 100) / 100
    }

    const lastTransform = lastTransformsRef.get(i)
    const hasChanged =
      !lastTransform ||
      Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
      Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
      Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
      Math.abs(lastTransform.blur - newTransform.blur) > 0.1

    if (hasChanged) {
      const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`
      const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : ''

      card.style.transform = transform
      card.style.filter = filter

      lastTransformsRef.set(i, newTransform)
    }

    if (i === cardsRef.value.length - 1) {
      const isInView = scrollTop >= pinStart && scrollTop <= pinEnd
      if (isInView && !stackCompletedRef.value) {
        stackCompletedRef.value = true
        if (props.onStackComplete) props.onStackComplete()
      } else if (!isInView && stackCompletedRef.value) {
        stackCompletedRef.value = false
      }
    }
  })

  isUpdatingRef.value = false
}

function handleScroll() {
  if (raf) cancelAnimationFrame(raf)
  raf = requestAnimationFrame(updateCardTransforms)
}

onMounted(async () => {
  await nextTick()
  const scroller = scrollerRef.value
  if (!scroller) return

  const cards = Array.from(
    props.useWindowScroll
      ? document.querySelectorAll('.scroll-stack-card')
      : scroller.querySelectorAll('.scroll-stack-card')
  )

  cardsRef.value = cards

  cards.forEach((card, i) => {
    if (i < cards.length - 1) {
      card.style.marginBottom = `${props.itemDistance}px`
    }
    card.style.willChange = 'transform, filter'
    card.style.transformOrigin = 'top center'
    card.style.backfaceVisibility = 'hidden'
    card.style.transform = 'translateZ(0)'
    card.style.webkitTransform = 'translateZ(0)'
    card.style.perspective = '1000px'
    card.style.webkitPerspective = '1000px'
  })

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })
  updateCardTransforms()
})

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  stackCompletedRef.value = false
  cardsRef.value = []
  lastTransformsRef.clear()
  isUpdatingRef.value = false
})
</script>

<template>
  <div :class="['scroll-stack-scroller', className]" ref="scrollerRef">
    <div class="scroll-stack-inner">
      <slot />
      <div class="scroll-stack-end" />
    </div>
  </div>
</template>


.scroll-stack-scroller {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: visible;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  will-change: scroll-position;
}

.scroll-stack-inner {
  padding: 20vh 5rem 50rem;
  min-height: 100vh;
}

.scroll-stack-card-wrapper {
  position: relative;
}

.scroll-stack-card {
  transform-origin: top center;
  will-change: transform, filter;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
  height: 20rem;
  width: 100%;
  margin: 30px 0;
  padding: 3rem;
  border-radius: 40px;
  box-sizing: border-box;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  position: relative;
}

.scroll-stack-end {
  width: 100%;
  height: 1px;
}

@media (max-width: 768px) {
  .scroll-stack-inner {
    padding: 10vh 1.5rem 40rem;
  }
  .scroll-stack-card {
    height: auto;
    min-height: 16rem;
    padding: 2rem;
    border-radius: 24px;
  }
}
</style>
