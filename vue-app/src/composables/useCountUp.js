import { ref, onMounted, onUnmounted } from 'vue'

export function useCountUp(targetRef, duration = 2000) {
  const displayValue = ref('0')

  onMounted(() => {
    if (!targetRef.value) return
    const target = parseFloat(targetRef.value.dataset.target || '0')
    const isFloat = String(target).includes('.')
    const decimals = isFloat ? 1 : 0
    const start = performance.now()

    function step(now) {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      displayValue.value = (target * ease).toFixed(decimals)
      if (p < 1) requestAnimationFrame(step)
      else displayValue.value = String(target)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            requestAnimationFrame(step)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(targetRef.value)
  })

  return { displayValue }
}
