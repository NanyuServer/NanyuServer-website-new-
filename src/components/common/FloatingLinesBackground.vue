<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  linesGradient: { type: Array, default: () => ['#7C3AED', '#7b63f1'] },
  animationSpeed: { type: Number, default: 1.4 },
  interactive: { type: Boolean, default: true },
  bendRadius: { type: Number, default: 5 },
  bendStrength: { type: Number, default: -0.5 },
  mouseDamping: { type: Number, default: 0.11 },
  parallax: { type: Boolean, default: true },
  parallaxStrength: { type: Number, default: 0.2 },
  lineCount: { type: Number, default: 9 },
  enabledWaves: { type: Array, default: () => ['top', 'middle', 'bottom'] }
})

const MAX_GRADIENT = 8
const MAX_LINES = 12
const containerRef = ref(null)
let raf = 0, active = true, renderer, ro

const VERT = `void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`

const FRAG = `precision highp float;
uniform float iTime,iResolutionW,iResolutionH,animationSpeed,topLineDistance,middleLineDistance,bottomLineDistance,bendRadius,bendStrength,bendInfluence,parallaxStrength;
uniform bool enableTop,enableMiddle,enableBottom,interactive,parallax;
uniform int topLineCount,middleLineCount,bottomLineCount;
uniform vec3 topWavePos,middleWavePos,bottomWavePos,lineGradient[8];
uniform int lineGradientCount;
uniform vec2 iMouse,parallaxOffset;

vec3 getLineColor(float t,vec3 baseColor){
  if(lineGradientCount<=0)return baseColor;
  if(lineGradientCount==1)return lineGradient[0];
  float ct=clamp(t,0.,.9999),sc=ct*float(lineGradientCount-1);
  int idx=int(floor(sc)),idx2=min(idx+1,lineGradientCount-1);
  return mix(lineGradient[idx],lineGradient[idx2],fract(sc))*.5;
}

mat2 rot(float r){float c=cos(r),s=sin(r);return mat2(c,s,-s,c);}

float wave(vec2 uv,float offset,vec2 screenUv,vec2 mouseUv,bool shouldBend){
  float time=iTime*animationSpeed,x_off=offset,x_move=time*.1;
  float amp=sin(offset+time*.2)*.3,y=sin(uv.x+x_off+x_move)*amp;
  if(shouldBend){
    vec2 d=screenUv-mouseUv;
    float influence=exp(-dot(d,d)*bendRadius);
    float bo=(mouseUv.y-screenUv.y)*influence*bendStrength*bendInfluence;
    y+=bo;
  }
  float m=uv.y-y;
  return .0175/max(abs(m)+.01,1e-3)+.01;
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){
  vec2 uv=(2.*fragCoord-vec2(iResolutionW,iResolutionH))/iResolutionH;
  uv.y*=-1.;
  if(parallax)uv+=parallaxOffset;
  vec3 col=vec3(0.),b=lineGradientCount>0?vec3(0.):vec3(0.);
  vec2 mouseUv=vec2(0.);
  if(interactive){mouseUv=(2.*iMouse-vec2(iResolutionW,iResolutionH))/iResolutionH;mouseUv.y*=-1.;}
  if(enableBottom){
    for(int i=0;i<12;i++){if(i>=bottomLineCount)break;
      float fi=float(i),t=fi/max(float(bottomLineCount-1),1.);
      vec3 lc=getLineColor(t,b);
      float a=bottomWavePos.z*log(length(uv)+1.);
      vec2 ruv=uv*rot(a);
      col+=lc*wave(ruv+vec2(bottomLineDistance*fi+bottomWavePos.x,bottomWavePos.y),1.5+.2*fi,uv,mouseUv,interactive)*.2;
    }
  }
  if(enableMiddle){
    for(int i=0;i<12;i++){if(i>=middleLineCount)break;
      float fi=float(i),t=fi/max(float(middleLineCount-1),1.);
      vec3 lc=getLineColor(t,b);
      float a=middleWavePos.z*log(length(uv)+1.);
      vec2 ruv=uv*rot(a);
      col+=lc*wave(ruv+vec2(middleLineDistance*fi+middleWavePos.x,middleWavePos.y),2.+.15*fi,uv,mouseUv,interactive);
    }
  }
  if(enableTop){
    for(int i=0;i<12;i++){if(i>=topLineCount)break;
      float fi=float(i),t=fi/max(float(topLineCount-1),1.);
      vec3 lc=getLineColor(t,b);
      float a=topWavePos.z*log(length(uv)+1.);
      vec2 ruv=uv*rot(a);ruv.x*=-1.;
      col+=lc*wave(ruv+vec2(topLineDistance*fi+topWavePos.x,topWavePos.y),1.+.2*fi,uv,mouseUv,interactive)*.1;
    }
  }
  fragColor=vec4(col,1.);
}

void main(){vec4 c;mainImage(c,gl_FragCoord.xy);gl_FragColor=c;}`

function hexToVec3(hex) {
  const v = hex.replace('#','').trim()
  if (v.length === 3) return [parseInt(v[0]+v[0],16)/255, parseInt(v[1]+v[1],16)/255, parseInt(v[2]+v[2],16)/255]
  return [parseInt(v.slice(0,2),16)/255, parseInt(v.slice(2,4),16)/255, parseInt(v.slice(4,6),16)/255]
}

function init() {
  const T = window.THREE
  if (!T) { setTimeout(init, 100); return }
  const ct = containerRef.value
  if (!ct || ct.clientWidth < 2) { setTimeout(init, 100); return }

  const scene = new T.Scene()
  const camera = new T.OrthographicCamera(-1,1,1,-1,0,1)
  camera.position.z = 1

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;'
  ct.appendChild(canvas)

  renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2))

  const lineGrad = props.linesGradient.filter(Boolean).slice(0, MAX_GRADIENT)
  const gradCount = lineGrad.length
  const gradArr = Array.from({length:MAX_GRADIENT}, (_,i) => {
    const [r,g,b] = i < gradCount ? hexToVec3(lineGrad[i]) : [1,1,1]
    return new T.Vector3(r,g,b)
  })

  const lc = Math.min(props.lineCount, MAX_LINES)
  const ew = props.enabledWaves

  const uniforms = {
    iTime: {value:0}, animationSpeed: {value:props.animationSpeed},
    interactive: {value:props.interactive}, bendRadius: {value:props.bendRadius},
    bendStrength: {value:props.bendStrength}, bendInfluence: {value:0},
    parallax: {value:props.parallax}, parallaxStrength: {value:props.parallaxStrength},
    parallaxOffset: {value:new T.Vector2(0,0)},
    enableTop: {value:ew.includes('top')}, enableMiddle: {value:ew.includes('middle')}, enableBottom: {value:ew.includes('bottom')},
    topLineCount: {value:lc}, middleLineCount: {value:lc}, bottomLineCount: {value:lc},
    topLineDistance: {value:5*0.01}, middleLineDistance: {value:5*0.01}, bottomLineDistance: {value:5*0.01},
    topWavePos: {value:new T.Vector3(10,0.5,-0.4)},
    middleWavePos: {value:new T.Vector3(5,0,0.2)},
    bottomWavePos: {value:new T.Vector3(2,-0.7,0.4)},
    iMouse: {value:new T.Vector2(-1000,-1000)},
    lineGradient: {value:gradArr}, lineGradientCount: {value:gradCount}
  }

  const mat = new T.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG })
  const geo = new T.PlaneGeometry(2,2)
  const mesh = new T.Mesh(geo, mat)
  scene.add(mesh)

  const clock = new T.Clock()
  const targetMouse = new T.Vector2(-1000,-1000)
  const currentMouse = new T.Vector2(-1000,-1000)
  let targetInfluence = 0, currentInfluence = 0
  const targetParallax = new T.Vector2(0,0)
  const currentParallax = new T.Vector2(0,0)

  function resize() {
    if (!active) return
    const w = ct.clientWidth||1, h = ct.clientHeight||1
    renderer.setSize(w, h, false)
    uniforms.iResolutionW = renderer.domElement.width
    uniforms.iResolutionH = renderer.domElement.height
  }
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(ct)

  function onMove(e) {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const dpr = renderer.getPixelRatio()
    targetMouse.set(x*dpr, (rect.height-y)*dpr)
    targetInfluence = 1
    if (props.parallax) {
      const cx = rect.width/2, cy = rect.height/2
      targetParallax.set((x-cx)/rect.width*props.parallaxStrength, -(y-cy)/rect.height*props.parallaxStrength)
    }
  }
  function onLeave() { targetInfluence = 0 }
  if (props.interactive) {
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    if (!active) return
    uniforms.iTime.value = clock.getElapsedTime()
    if (props.interactive) {
      currentMouse.lerp(targetMouse, props.mouseDamping)
      uniforms.iMouse.value.copy(currentMouse)
      currentInfluence += (targetInfluence - currentInfluence) * props.mouseDamping
      uniforms.bendInfluence.value = currentInfluence
    }
    if (props.parallax) {
      currentParallax.lerp(targetParallax, props.mouseDamping)
      uniforms.parallaxOffset.value.copy(currentParallax)
    }
    uniforms.iResolutionW = renderer.domElement.width
    uniforms.iResolutionH = renderer.domElement.height
    renderer.render(scene, camera)
  }
  loop()
}

onMounted(() => setTimeout(init, 50))

onUnmounted(() => {
  active = false
  if (raf) cancelAnimationFrame(raf)
  if (ro) ro.disconnect()
  if (renderer) { renderer.dispose(); renderer.forceContextLoss() }
  const canvas = containerRef.value?.querySelector('canvas')
  if (canvas) canvas.remove()
})
</script>

<template>
  <div ref="containerRef" class="floating-bg" />
</template>

<style scoped>
.floating-bg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; overflow: hidden; }
</style>
