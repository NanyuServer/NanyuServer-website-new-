import { ref, onMounted, onUnmounted } from 'vue'

export function useScrollReveal() {
  const elements = ref([])

  onMounted(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('revealed'), i * 90)
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('[data-reveal]').forEach(el => {
      observer.observe(el)
      elements.value.push(el)
    })

    elements.value._observer = observer
  })

  onUnmounted(() => {
    elements.value._observer?.disconnect()
  })
}
