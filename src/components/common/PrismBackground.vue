<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const p = defineProps({
  height: { type: Number, default: 3.5 },
  baseWidth: { type: Number, default: 5.5 },
  animationType: { type: String, default: 'rotate' },
  glow: { type: Number, default: 1 },
  noise: { type: Number, default: 0 },
  transparent: { type: Boolean, default: true },
  scale: { type: Number, default: 3.6 },
  hueShift: { type: Number, default: 0 },
  colorFrequency: { type: Number, default: 1 },
  hoverStrength: { type: Number, default: 2 },
  inertia: { type: Number, default: 0.05 },
  bloom: { type: Number, default: 1 },
  timeScale: { type: Number, default: 0.5 }
})

const containerRef = ref(null)
let rafId, gl, program, ro, canvas

const vert = `attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`

const frag = `precision highp float;
uniform vec2  iResolution;
uniform float iTime;
uniform float uHeight;
uniform float uBaseHalf;
uniform mat3  uRot;
uniform int   uUseBaseWobble;
uniform float uGlow;
uniform vec2  uOffsetPx;
uniform float uNoise;
uniform float uSaturation;
uniform float uScale;
uniform float uHueShift;
uniform float uColorFreq;
uniform float uBloom;
uniform float uCenterShift;
uniform float uInvBaseHalf;
uniform float uInvHeight;
uniform float uMinAxis;
uniform float uPxScale;
uniform float uTimeScale;

vec4 tanh4(vec4 x){
  vec4 e2x = exp(2.0*x);
  return (e2x - 1.0) / (e2x + 1.0);
}
float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
}
float sdOctaAnisoInv(vec3 p){
  vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
  float m = q.x + q.y + q.z - 1.0;
  return m * uMinAxis * 0.5773502691896258;
}
float sdPyramidUpInv(vec3 p){
  float oct = sdOctaAnisoInv(p);
  float halfSpace = -p.y;
  return max(oct, halfSpace);
}
mat3 hueRotation(float a){
  float c = cos(a), s = sin(a);
  mat3 W = mat3(0.299,0.587,0.114, 0.299,0.587,0.114, 0.299,0.587,0.114);
  mat3 U = mat3(0.701,-0.587,-0.114, -0.299,0.413,-0.114, -0.300,-0.588,0.886);
  mat3 V = mat3(0.168,-0.331,0.500, 0.328,0.035,-0.500, -0.497,0.296,0.201);
  return W + U * c + V * s;
}
void main(){
  vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;
  float z = 5.0;
  float d = 0.0;
  vec3 p;
  vec4 o = vec4(0.0);
  float centerShift = uCenterShift;
  float cf = uColorFreq;
  mat2 wob = mat2(1.0);
  if (uUseBaseWobble == 1) {
    float t = iTime * uTimeScale;
    float c0 = cos(t + 0.0);
    float c1 = cos(t + 33.0);
    float c2 = cos(t + 11.0);
    wob = mat2(c0, c1, c2, c0);
  }
  for (int i = 0; i < 100; i++) {
    p = vec3(f, z);
    p.xz = p.xz * wob;
    p = uRot * p;
    vec3 q = p;
    q.y += centerShift;
    d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
    z -= d;
    o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
  }
  o = tanh4(o * o * (uGlow * uBloom) / 1e5);
  vec3 col = o.rgb;
  float n = rand(gl_FragCoord.xy + vec2(iTime));
  col += (n - 0.5) * uNoise;
  col = clamp(col, 0.0, 1.0);
  float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);
  if(abs(uHueShift) > 0.0001){
    col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
  }
  gl_FragColor = vec4(col, o.a);
}`

function mkShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('shader err:', gl.getShaderInfoLog(s))
    return null
  }
  return s
}

function mkProgram(gl, vs, fs) {
  const v = mkShader(gl, gl.VERTEX_SHADER, vs)
  const f = mkShader(gl, gl.FRAGMENT_SHADER, fs)
  if (!v || !f) return null
  const pr = gl.createProgram()
  gl.attachShader(pr, v)
  gl.attachShader(pr, f)
  gl.linkProgram(pr)
  return pr
}

function getUni(pr, name) { return gl.getUniformLocation(pr, name) }

onMounted(() => {
  const ct = containerRef.value
  if (!ct) return

  canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;'
  ct.appendChild(canvas)

  gl = canvas.getContext('webgl', {
    alpha: p.transparent,
    antialias: false,
    powerPreference: 'high-performance'
  })
  if (!gl) return
  gl.disable(gl.DEPTH_TEST)
  gl.disable(gl.CULL_FACE)
  gl.disable(gl.BLEND)

  program = mkProgram(gl, vert, frag)
  if (!program) return
  gl.useProgram(program)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const H = Math.max(0.001, p.height)
  const BW = Math.max(0.001, p.baseWidth)
  const BASE_HALF = BW * 0.5
  const SAT = p.transparent ? 1.5 : 1

  function resize() {
    const w = ct.clientWidth || 1
    const h = ct.clientHeight || 1
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = w * dpr
    canvas.height = h * dpr
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(ct)

  const U = {
    iResolution: getUni('iResolution'),
    iTime: getUni('iTime'),
    uHeight: getUni('uHeight'),
    uBaseHalf: getUni('uBaseHalf'),
    uRot: getUni('uRot'),
    uUseBaseWobble: getUni('uUseBaseWobble'),
    uGlow: getUni('uGlow'),
    uOffsetPx: getUni('uOffsetPx'),
    uNoise: getUni('uNoise'),
    uSaturation: getUni('uSaturation'),
    uHueShift: getUni('uHueShift'),
    uColorFreq: getUni('uColorFreq'),
    uBloom: getUni('uBloom'),
    uCenterShift: getUni('uCenterShift'),
    uInvBaseHalf: getUni('uInvBaseHalf'),
    uInvHeight: getUni('uInvHeight'),
    uMinAxis: getUni('uMinAxis'),
    uPxScale: getUni('uPxScale'),
    uTimeScale: getUni('uTimeScale'),
  }

  gl.uniform1f(U.uHeight, H)
  gl.uniform1f(U.uBaseHalf, BASE_HALF)
  gl.uniform1i(U.uUseBaseWobble, 1)
  gl.uniform1f(U.uGlow, p.glow)
  gl.uniform1f(U.uNoise, p.noise)
  gl.uniform1f(U.uSaturation, SAT)
  gl.uniform1f(U.uHueShift, p.hueShift)
  gl.uniform1f(U.uColorFreq, p.colorFrequency)
  gl.uniform1f(U.uBloom, p.bloom)
  gl.uniform1f(U.uCenterShift, H * 0.25)
  gl.uniform1f(U.uInvBaseHalf, 1 / BASE_HALF)
  gl.uniform1f(U.uInvHeight, 1 / H)
  gl.uniform1f(U.uMinAxis, Math.min(BASE_HALF, H))
  gl.uniform1f(U.uTimeScale, p.timeScale)
  gl.uniform2f(U.uOffsetPx, 0, 0)

  const rotBuf = new Float32Array([1,0,0, 0,1,0, 0,0,1])
  const t0 = performance.now()

  function loop() {
    rafId = requestAnimationFrame(loop)
    const time = (performance.now() - t0) * 0.001
    const pxScale = 1 / ((canvas.height || 1) * 0.1 * p.scale)

    gl.uniform2f(U.iResolution, canvas.width, canvas.height)
    gl.uniform1f(U.iTime, time)
    gl.uniform1f(U.uPxScale, pxScale)
    gl.uniformMatrix3fv(U.uRot, false, rotBuf)

    gl.clearColor(0, 0, 0, p.transparent ? 0 : 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  loop()
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (ro) ro.disconnect()
  if (canvas && canvas.parentElement) canvas.parentElement.removeChild(canvas)
  if (gl && program) gl.deleteProgram(program)
})
</script>

<template>
  <div ref="containerRef" class="prism-bg"></div>
</template>

<style scoped>
.prism-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}
</style>
