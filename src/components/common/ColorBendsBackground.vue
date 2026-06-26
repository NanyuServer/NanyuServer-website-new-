<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  rotation: { type: Number, default: 90 },
  speed: { type: Number, default: 0.2 },
  colors: { type: Array, default: () => ['#5227FF', '#31088b', '#7C3AED'] },
  transparent: { type: Boolean, default: true },
  autoRotate: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  frequency: { type: Number, default: 1 },
  warpStrength: { type: Number, default: 1 },
  mouseInfluence: { type: Number, default: 1 },
  parallax: { type: Number, default: 0.5 },
  noise: { type: Number, default: 0 },
  iterations: { type: Number, default: 1 },
  intensity: { type: Number, default: 1.5 },
  bandWidth: { type: Number, default: 6 }
})

const MAX_COLORS = 8
const containerRef = ref(null)
let rafId = null
let gl = null
let program = null
let uniforms = null
let colorUniforms = null
let colorArray = null
let pointerX = 0, pointerY = 0
let pointerTargetX = 0, pointerTargetY = 0
let startTime = 0
let ro = null

const vertSrc = `attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const fragSrc = `precision highp float;
#define MAX_COLORS ${MAX_COLORS}
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

function hexToRgb(hex) {
  hex = hex.replace('#', '').trim()
  if (hex.length === 3) {
    return [
      parseInt(hex[0] + hex[0], 16) / 255,
      parseInt(hex[1] + hex[1], 16) / 255,
      parseInt(hex[2] + hex[2], 16) / 255
    ]
  }
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  ]
}

function createShader(gl, type, source) {
  const s = gl.createShader(type)
  gl.shaderSource(s, source)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

function createProgram(gl, vs, fs) {
  const v = createShader(gl, gl.VERTEX_SHADER, vs)
  const f = createShader(gl, gl.FRAGMENT_SHADER, fs)
  if (!v || !f) return null
  const p = gl.createProgram()
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('Link error:', gl.getProgramInfoLog(p))
    return null
  }
  return p
}

function onPointerMove(e) {
  const rect = containerRef.value.getBoundingClientRect()
  pointerTargetX = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1
  pointerTargetY = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1)
}

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;'
  container.appendChild(canvas)

  gl = canvas.getContext('webgl', {
    alpha: props.transparent,
    premultipliedAlpha: false,
    antialias: false,
    powerPreference: 'high-performance'
  })
  if (!gl) return

  gl.disable(gl.DEPTH_TEST)
  gl.disable(gl.CULL_FACE)

  program = createProgram(gl, vertSrc, fragSrc)
  if (!program) return
  gl.useProgram(program)

  const posBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  uniforms = {}
  ;['uCanvas', 'uTime', 'uSpeed', 'uRot', 'uColorCount', 'uTransparent', 'uScale', 'uFrequency',
    'uWarpStrength', 'uPointer', 'uMouseInfluence', 'uParallax', 'uNoise', 'uIterations', 'uIntensity', 'uBandWidth'
  ].forEach(n => { uniforms[n] = gl.getUniformLocation(program, n) })

  colorUniforms = []
  for (let i = 0; i < MAX_COLORS; i++) {
    colorUniforms.push(gl.getUniformLocation(program, `uColors[${i}]`))
  }

  const raw = (props.colors || []).filter(Boolean).slice(0, MAX_COLORS)
  colorArray = raw.map(hexToRgb)

  if (props.transparent) {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  }

  container.addEventListener('pointermove', onPointerMove)

  function resize() {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = w * dp
    canvas.height = h * dp
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(container)

  startTime = performance.now() / 1000

  function loop() {
    rafId = requestAnimationFrame(loop)
    const now = performance.now() / 1000
    const elapsed = now - startTime

    const deg = ((props.rotation % 360) + props.autoRotate * elapsed) % 360
    const rad = deg * Math.PI / 180
    const c = Math.cos(rad), s = Math.sin(rad)

    const smooth = 8, dt = 1 / 60
    const amt = Math.min(1, dt * smooth)
    pointerX += (pointerTargetX - pointerX) * amt
    pointerY += (pointerTargetY - pointerY) * amt

    gl.uniform2f(uniforms.uCanvas, canvas.width, canvas.height)
    gl.uniform1f(uniforms.uTime, elapsed)
    gl.uniform1f(uniforms.uSpeed, props.speed)
    gl.uniform2f(uniforms.uRot, c, s)
    gl.uniform1i(uniforms.uColorCount, colorArray.length)
    gl.uniform1i(uniforms.uTransparent, props.transparent ? 1 : 0)
    gl.uniform1f(uniforms.uScale, props.scale)
    gl.uniform1f(uniforms.uFrequency, props.frequency)
    gl.uniform1f(uniforms.uWarpStrength, props.warpStrength)
    gl.uniform2f(uniforms.uPointer, pointerX, pointerY)
    gl.uniform1f(uniforms.uMouseInfluence, props.mouseInfluence)
    gl.uniform1f(uniforms.uParallax, props.parallax)
    gl.uniform1f(uniforms.uNoise, props.noise)
    gl.uniform1i(uniforms.uIterations, props.iterations)
    gl.uniform1f(uniforms.uIntensity, props.intensity)
    gl.uniform1f(uniforms.uBandWidth, props.bandWidth)

    for (let i = 0; i < MAX_COLORS; i++) {
      if (i < colorArray.length) {
        gl.uniform3fv(colorUniforms[i], colorArray[i])
      } else {
        gl.uniform3fv(colorUniforms[i], [0, 0, 0])
      }
    }

    gl.clearColor(0, 0, 0, props.transparent ? 0 : 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
  loop()
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (ro) ro.disconnect()
  if (containerRef.value) {
    containerRef.value.removeEventListener('pointermove', onPointerMove)
    const canvas = containerRef.value.querySelector('canvas')
    if (canvas) containerRef.value.removeChild(canvas)
  }
  if (gl && program) {
    const posBuf = gl.getParameter(gl.ARRAY_BUFFER_BINDING)
    gl.deleteProgram(program)
    if (posBuf) gl.deleteBuffer(posBuf)
  }
})
</script>

<template>
  <div ref="containerRef" class="color-bends-bg"></div>
</template>

<style scoped>
.color-bends-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}
</style>
