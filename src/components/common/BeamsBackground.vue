<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  beamWidth: { type: Number, default: 2 },
  beamHeight: { type: Number, default: 15 },
  beamNumber: { type: Number, default: 12 },
  lightColor: { type: String, default: '#ffffff' },
  speed: { type: Number, default: 2 },
  noiseIntensity: { type: Number, default: 1.75 },
  scale: { type: Number, default: 0.2 },
  rotation: { type: Number, default: 0 }
})

const containerRef = ref(null)
let raf = 0, renderer, scene, camera, mesh, clock, ro, canvas

const VERT = `
varying vec2 vUv;
varying vec3 vPos;
uniform float uTime, uSpeed, uScale;

float random(in vec2 st){ return fract(sin(dot(st,vec2(12.9898,78.233)))*43758.5453123); }
float noise(in vec2 st){ vec2 i=floor(st); vec2 f=fract(st); float a=random(i); float b=random(i+vec2(1,0)); float c=random(i+vec2(0,1)); float d=random(i+vec2(1,1)); vec2 u=f*f*(3.-2.*f); return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y; }
vec4 permute(vec4 x){ return mod(((x*34.)+1.)*x,289.); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159-0.85373472095314*r; }
vec3 fade(vec3 t){ return t*t*t*(t*(t*6.-15.)+10.); }
float cnoise(vec3 P){
  vec3 Pi0=floor(P); vec3 Pi1=Pi0+vec3(1); Pi0=mod(Pi0,289.); Pi1=mod(Pi1,289.);
  vec3 Pf0=fract(P); vec3 Pf1=Pf0-vec3(1);
  vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x), iy=vec4(Pi0.yy,Pi1.yy), iz0=Pi0.zzzz, iz1=Pi1.zzzz;
  vec4 ixy=permute(permute(ix)+iy), ixy0=permute(ixy+iz0), ixy1=permute(ixy+iz1);
  vec4 gx0=ixy0/7., gy0=fract(floor(gx0)/7.)-.5; gx0=fract(gx0); vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0); vec4 sz0=step(gz0,vec4(0)); gx0-=sz0*(step(0.,gx0)-.5); gy0-=sz0*(step(0.,gy0)-.5);
  vec4 gx1=ixy1/7., gy1=fract(floor(gx1)/7.)-.5; gx1=fract(gx1); vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1); vec4 sz1=step(gz1,vec4(0)); gx1-=sz1*(step(0.,gx1)-.5); gy1-=sz1*(step(0.,gy1)-.5);
  vec3 g000=vec3(gx0.x,gy0.x,gz0.x), g100=vec3(gx0.y,gy0.y,gz0.y), g010=vec3(gx0.z,gy0.z,gz0.z), g110=vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001=vec3(gx1.x,gy1.x,gz1.x), g101=vec3(gx1.y,gy1.y,gz1.y), g011=vec3(gx1.z,gy1.z,gz1.z), g111=vec3(gx1.w,gy1.w,gz1.w);
  vec4 n0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110))); g000*=n0.x; g010*=n0.y; g100*=n0.z; g110*=n0.w;
  vec4 n1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111))); g001*=n1.x; g011*=n1.y; g101*=n1.z; g111*=n1.w;
  float n000=dot(g000,Pf0), n100=dot(g100,vec3(Pf1.x,Pf0.yz)), n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)), n110=dot(g110,vec3(Pf1.xy,Pf0.z));
  float n001=dot(g001,vec3(Pf0.xy,Pf1.z)), n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z)), n011=dot(g011,vec3(Pf0.x,Pf1.yz)), n111=dot(g111,Pf1);
  vec3 fade_xyz=fade(Pf0); vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y); return 2.2*mix(n_yz.x,n_yz.y,fade_xyz.x);
}

float getPos(vec3 p){ return cnoise(vec3(p.x*0.,p.y-vUv.y,p.z+uTime*uSpeed*3.)*uScale); }
void main(){
  vUv=uv;
  vec3 p=position;
  p.z+=getPos(p);
  vPos=p;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
}`

const FRAG = `
varying vec3 vPos;
varying vec2 vUv;
uniform float uNoiseIntensity;

float random(in vec2 st){ return fract(sin(dot(st,vec2(12.9898,78.233)))*43758.5453123); }
float noise(in vec2 st){ vec2 i=floor(st); vec2 f=fract(st); float a=random(i); float b=random(i+vec2(1,0)); float c=random(i+vec2(0,1)); float d=random(i+vec2(1,1)); vec2 u=f*f*(3.-2.*f); return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y; }

void main(){
  float d=(vPos.z+1.)*.5;
  vec3 c=mix(vec3(.02,.01,.1),vec3(.15,.08,.4),d);
  c+=vec3(.05,.02,.2)*(1.-abs(vUv.y-.5)*2.);
  float r=noise(gl_FragCoord.xy);
  c-=r/15.*uNoiseIntensity;
  c=clamp(c,0.,1.);
  gl_FragColor=vec4(c,1.);
}`

function init() {
  const THREE = window.THREE
  if (!THREE) { setTimeout(init, 100); return }

  const ct = containerRef.value
  if (!ct || ct.clientWidth < 2) { setTimeout(init, 100); return }

  canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;'
  ct.appendChild(canvas)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  camera = new THREE.PerspectiveCamera(30, 1, 1, 100)
  camera.position.set(0, 0, 20)

  clock = new THREE.Clock()

  const seg = 100
  const n = props.beamNumber
  const w = props.beamWidth
  const h = props.beamHeight
  const nv = n * (seg + 1) * 2
  const pos = new Float32Array(nv * 3)
  const idx = []
  const uv = new Float32Array(nv * 2)
  let vo = 0
  const tw = n * w
  const x0 = -tw / 2

  for (let i = 0; i < n; i++) {
    const x = x0 + i * w
    const ux = Math.random() * 100
    const uy = Math.random() * 100
    for (let j = 0; j <= seg; j++) {
      const y = h * (j / seg - 0.5)
      pos[vo * 3] = x; pos[vo * 3 + 1] = y; pos[vo * 3 + 2] = 0
      pos[(vo + 1) * 3] = x + w; pos[(vo + 1) * 3 + 1] = y; pos[(vo + 1) * 3 + 2] = 0
      uv[vo * 2] = ux; uv[vo * 2 + 1] = j / seg + uy
      uv[(vo + 1) * 2] = ux + 1; uv[(vo + 1) * 2 + 1] = j / seg + uy
      if (j < seg) { const a = vo, b = vo + 1, c = vo + 2, d = vo + 3; idx.push(a, b, c, c, b, d) }
      vo += 2
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: props.speed },
      uScale: { value: props.scale },
      uNoiseIntensity: { value: props.noiseIntensity }
    },
    side: THREE.DoubleSide
  })

  mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.z = THREE.MathUtils.degToRad(props.rotation)

  const dir = new THREE.DirectionalLight(props.lightColor, 1)
  dir.position.set(0, 3, 10)
  const amb = new THREE.AmbientLight(0x404040, 0.5)

  const group = new THREE.Group()
  group.add(mesh)
  group.add(dir)
  group.add(amb)
  scene.add(group)

  function resize() {
    const cw = ct.clientWidth || 1
    const ch = ct.clientHeight || 1
    renderer.setSize(cw, ch)
    camera.aspect = cw / Math.max(ch, 1)
    camera.updateProjectionMatrix()
  }
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(ct)

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = clock.getDelta()
    mat.uniforms.uTime.value += dt
    group.rotation.z += THREE.MathUtils.degToRad(props.rotation * dt * 0.1)
    renderer.render(scene, camera)
  }
  loop()
}

onMounted(() => { setTimeout(init, 50) })

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
  if (ro) ro.disconnect()
  if (renderer) renderer.dispose()
  if (canvas && canvas.parentElement) canvas.remove()
})
</script>

<template>
  <div ref="containerRef" class="beams-bg" />
</template>

<style scoped>
.beams-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}
</style>
