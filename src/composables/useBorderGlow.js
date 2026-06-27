import { ref, onMounted, onUnmounted, computed } from 'vue'

export function useBorderGlow(options = {}) {
  const {
    edgeSensitivity = 30,
    coneSpread = 25,
    glowRadius = 40,
    fillOpacity = 0.5,
    colors = ['#a87fe8', '#e86fa3', '#5de8d0'],
    glowColor = '268 80 80',
    glowIntensity = 1,
    backgroundColor = ''
  } = options

  const elRef = ref(null)
  const edgeProximity = ref(0)
  const cursorAngle = ref(45)
  const isHovering = ref(false)

  const colorSensitivity = edgeSensitivity + 20

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
    const el = elRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    edgeProximity.value = getEdgeProximity(el, x, y) * 100
    cursorAngle.value = getCursorAngle(el, x, y)
    isHovering.value = true
  }

  function onPointerLeave() {
    edgeProximity.value = 0
    isHovering.value = false
  }

  onMounted(() => {
    const el = elRef.value
    if (!el) return
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerleave', onPointerLeave)
  })

  onUnmounted(() => {
    const el = elRef.value
    if (!el) return
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerleave', onPointerLeave)
  })

  function parseHSL(hslStr) {
    const m = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
    if (!m) return { h: 268, s: 80, l: 80 }
    return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) }
  }

  const glowHSL = computed(() => {
    const { h, s, l } = parseHSL(glowColor)
    const base = `${h}deg ${s}% ${l}%`
    const opacities = [100, 60, 50, 40, 30, 20, 10]
    const result = {}
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']
    for (let i = 0; i < opacities.length; i++) {
      result[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * glowIntensity, 100)}%)`
    }
    return result
  })

  const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
  const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1]

  const gradientVars = computed(() => {
    const vars = {}
    for (let i = 0; i < 7; i++) {
      const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)]
      vars[`--gb-${i}`] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`
    }
    vars['--gb-base'] = `linear-gradient(${colors[0]} 0 100%)`
    return vars
  })

  const glowStyle = computed(() => ({
    ...(backgroundColor ? { '--card-bg': backgroundColor } : {}),
    ...glowHSL.value,
    ...gradientVars.value,
    '--edge-proximity': edgeProximity.value.toFixed(3),
    '--cursor-angle': cursorAngle.value.toFixed(3) + 'deg',
    '--edge-sensitivity': edgeSensitivity,
    '--colour-sensitivity': colorSensitivity,
    '--glow-padding': glowRadius + 'px',
    '--cone-spread': coneSpread,
    '--fill-opacity': fillOpacity
  }))

  return { elRef, glowStyle, isHovering }
}
