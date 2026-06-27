<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  className: { type: String, default: '' },
  rotation: { type: Number, default: 90 },
  speed: { type: Number, default: 0.2 },
  colors: { type: Array, default: () => [] },
  transparent: { type: Boolean, default: true },
  autoRotate: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  frequency: { type: Number, default: 1 },
  warpStrength: { type: Number, default: 1 },
  mouseInfluence: { type: Number, default: 1 },
  parallax: { type: Number, default: 0.5 },
  noise: { type: Number, default: 0.15 },
  iterations: { type: Number, default: 1 },
  intensity: { type: Number, default: 1.5 },
  bandWidth: { type: Number, default: 6 }
})

const MAX_COLORS = 8
const containerRef = ref(null)
let renderer = null, raf = null, material = null, ro = null
let rotationRef = 0, autoRotateRef = 0
let pointerTarget = null, pointerCurrent = null
const pointerSmooth = 8

const frag = `#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

  for (int j = 0; j < 5; j++) {
    if (j >= uIterations - 1) break;
    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
    q += (rr - q) * 0.15;
  }

  vec3 col = vec3(0.0);
  float a = 1.0;

  if (uColorCount > 0) {
    vec2 s = q;
    vec3 sumCol = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < MAX_COLORS; ++i) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, kMix);
      float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
      sumCol += uColors[i] * w;
      cover = max(cover, w);
    }
    col = clamp(sumCol, 0.0, 1.0);
    a = uTransparent > 0 ? cover : 1.0;
  } else {
    vec2 s = q;
    for (int k = 0; k < 3; ++k) {
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float m = mix(m0, m1, kMix);
      col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
    }
    a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
  }

  col *= uIntensity;

  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);
  }

  vec3 rgb = (uTransparent > 0) ? col * a : col;
  gl_FragColor = vec4(rgb, a);
}`

const vert = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}`

function hexToVec3(hex) {
  const h = hex.replace('#', '').trim()
  const v = h.length === 3
    ? [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)]
    : [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
  return [v[0]/255, v[1]/255, v[2]/255]
}

function init() {
  const T = window.THREE
  if (!T) { setTimeout(init, 100); return }
  const container = containerRef.value
  if (!container || container.clientWidth < 2) { setTimeout(init, 100); return }

  const scene = new T.Scene()
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geometry = new T.PlaneGeometry(2, 2)

  const uColorsArray = Array.from({ length: MAX_COLORS }, () => new T.Vector3(0, 0, 0))
  const colorsArr = (props.colors || []).filter(Boolean).slice(0, MAX_COLORS).map(hexToVec3)
  for (let i = 0; i < MAX_COLORS; i++) {
    if (i < colorsArr.length) uColorsArray[i].set(colorsArr[i][0], colorsArr[i][1], colorsArr[i][2])
  }

  material = new T.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uCanvas: { value: new T.Vector2(1, 1) },
      uTime: { value: 0 },
      uSpeed: { value: props.speed },
      uRot: { value: new T.Vector2(1, 0) },
      uColorCount: { value: colorsArr.length },
      uColors: { value: uColorsArray },
      uTransparent: { value: props.transparent ? 1 : 0 },
      uScale: { value: props.scale },
      uFrequency: { value: props.frequency },
      uWarpStrength: { value: props.warpStrength },
      uPointer: { value: new T.Vector2(0, 0) },
      uMouseInfluence: { value: props.mouseInfluence },
      uParallax: { value: props.parallax },
      uNoise: { value: props.noise },
      uIterations: { value: props.iterations },
      uIntensity: { value: props.intensity },
      uBandWidth: { value: props.bandWidth }
    },
    premultipliedAlpha: true,
    transparent: true
  })

  const mesh = new T.Mesh(geometry, material)
  scene.add(mesh)

  renderer = new T.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: true })
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, props.transparent ? 0 : 1)
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;'
  container.appendChild(renderer.domElement)

  rotationRef = props.rotation
  autoRotateRef = props.autoRotate
  pointerTarget = new T.Vector2(0, 0)
  pointerCurrent = new T.Vector2(0, 0)

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1
    renderer.setSize(w, h, false)
    material.uniforms.uCanvas.value.set(w, h)
  }
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(container)

  const canvas = renderer.domElement
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1
    const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1)
    pointerTarget.set(x, y)
  })

  const clock = new T.Clock()
  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = clock.getDelta()
    const elapsed = clock.elapsedTime
    material.uniforms.uTime.value = elapsed

    const deg = (rotationRef % 360) + autoRotateRef * elapsed
    const rad = (deg * Math.PI) / 180
    material.uniforms.uRot.value.set(Math.cos(rad), Math.sin(rad))

    const amt = Math.min(1, dt * pointerSmooth)
    pointerCurrent.lerp(pointerTarget, amt)
    material.uniforms.uPointer.value.copy(pointerCurrent)
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(loop)
}

onMounted(() => setTimeout(init, 50))

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
  if (ro) ro.disconnect()
  if (renderer) { renderer.dispose(); renderer.forceContextLoss() }
  const canvas = containerRef.value?.querySelector('canvas')
  if (canvas) canvas.remove()
})
</script>

<template>
  <div ref="containerRef" :class="['color-bends-container', className]" />
</template>

<style scoped>
.color-bends-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}
</style>
