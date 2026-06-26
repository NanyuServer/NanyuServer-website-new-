(function () {
  'use strict';

  var vertSrc = [
    'attribute vec2 position;',
    'void main() {',
    '  gl_Position = vec4(position, 0.0, 1.0);',
    '}'
  ].join('\n');

  var fragSrc = [
    'precision highp float;',
    '',
    'uniform vec2  iResolution;',
    'uniform float iTime;',
    '',
    'uniform float uHeight;',
    'uniform float uBaseHalf;',
    'uniform mat3  uRot;',
    'uniform int   uUseBaseWobble;',
    'uniform float uGlow;',
    'uniform vec2  uOffsetPx;',
    'uniform float uNoise;',
    'uniform float uSaturation;',
    'uniform float uScale;',
    'uniform float uHueShift;',
    'uniform float uColorFreq;',
    'uniform float uBloom;',
    'uniform float uCenterShift;',
    'uniform float uInvBaseHalf;',
    'uniform float uInvHeight;',
    'uniform float uMinAxis;',
    'uniform float uPxScale;',
    'uniform float uTimeScale;',
    '',
    'vec4 tanh4(vec4 x){',
    '  vec4 e2x = exp(2.0*x);',
    '  return (e2x - 1.0) / (e2x + 1.0);',
    '}',
    '',
    'float rand(vec2 co){',
    '  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);',
    '}',
    '',
    'float sdOctaAnisoInv(vec3 p){',
    '  vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);',
    '  float m = q.x + q.y + q.z - 1.0;',
    '  return m * uMinAxis * 0.5773502691896258;',
    '}',
    '',
    'float sdPyramidUpInv(vec3 p){',
    '  float oct = sdOctaAnisoInv(p);',
    '  float halfSpace = -p.y;',
    '  return max(oct, halfSpace);',
    '}',
    '',
    'mat3 hueRotation(float a){',
    '  float c = cos(a), s = sin(a);',
    '  mat3 W = mat3(',
    '    0.299, 0.587, 0.114,',
    '    0.299, 0.587, 0.114,',
    '    0.299, 0.587, 0.114',
    '  );',
    '  mat3 U = mat3(',
    '     0.701, -0.587, -0.114,',
    '    -0.299,  0.413, -0.114,',
    '    -0.300, -0.588,  0.886',
    '  );',
    '  mat3 V = mat3(',
    '     0.168, -0.331,  0.500,',
    '     0.328,  0.035, -0.500,',
    '    -0.497,  0.296,  0.201',
    '  );',
    '  return W + U * c + V * s;',
    '}',
    '',
    'void main(){',
    '  vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;',
    '',
    '  float z = 5.0;',
    '  float d = 0.0;',
    '',
    '  vec3 p;',
    '  vec4 o = vec4(0.0);',
    '',
    '  float centerShift = uCenterShift;',
    '  float cf = uColorFreq;',
    '',
    '  mat2 wob = mat2(1.0);',
    '  if (uUseBaseWobble == 1) {',
    '    float t = iTime * uTimeScale;',
    '    float c0 = cos(t + 0.0);',
    '    float c1 = cos(t + 33.0);',
    '    float c2 = cos(t + 11.0);',
    '    wob = mat2(c0, c1, c2, c0);',
    '  }',
    '',
    '  const int STEPS = 100;',
    '  for (int i = 0; i < STEPS; i++) {',
    '    p = vec3(f, z);',
    '    p.xz = p.xz * wob;',
    '    p = uRot * p;',
    '    vec3 q = p;',
    '    q.y += centerShift;',
    '    d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));',
    '    z -= d;',
    '    o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;',
    '  }',
    '',
    '  o = tanh4(o * o * (uGlow * uBloom) / 1e5);',
    '',
    '  vec3 col = o.rgb;',
    '  float n = rand(gl_FragCoord.xy + vec2(iTime));',
    '  col += (n - 0.5) * uNoise;',
    '  col = clamp(col, 0.0, 1.0);',
    '',
    '  float L = dot(col, vec3(0.2126, 0.7152, 0.0722));',
    '  col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);',
    '',
    '  if(abs(uHueShift) > 0.0001){',
    '    col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);',
    '  }',
    '',
    '  gl_FragColor = vec4(col, o.a);',
    '}'
  ].join('\n');

  function createShader(gl, type, source) {
    var s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function createProgram(gl, vSrc, fSrc) {
    var v = createShader(gl, gl.VERTEX_SHADER, vSrc);
    var f = createShader(gl, gl.FRAGMENT_SHADER, fSrc);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('Link error:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  function setMat3FromEuler(yawY, pitchX, rollZ, out) {
    var cy = Math.cos(yawY), sy = Math.sin(yawY);
    var cx = Math.cos(pitchX), sx = Math.sin(pitchX);
    var cz = Math.cos(rollZ), sz = Math.sin(rollZ);
    out[0] = cy * cz + sy * sx * sz;
    out[1] = cx * sz;
    out[2] = -sy * cz + cy * sx * sz;
    out[3] = -cy * sz + sy * sx * cz;
    out[4] = cx * cz;
    out[5] = sy * sz + cy * sx * cz;
    out[6] = sy * cx;
    out[7] = -sx;
    out[8] = cy * cx;
    return out;
  }

  window.Prism = function (container, options) {
    options = options || {};
    var H = Math.max(0.001, options.height || 3.5);
    var BW = Math.max(0.001, options.baseWidth || 5.5);
    var BASE_HALF = BW * 0.5;
    var GLOW = Math.max(0, options.glow || 1);
    var NOISE = Math.max(0, options.noise !== undefined ? options.noise : 0.5);
    var transparent = options.transparent !== undefined ? options.transparent : true;
    var SAT = transparent ? 1.5 : 1;
    var SCALE = Math.max(0.001, options.scale || 3.6);
    var HUE = options.hueShift || 0;
    var CFREQ = Math.max(0, options.colorFrequency || 1);
    var BLOOM = Math.max(0, options.bloom || 1);
    var TS = Math.max(0, options.timeScale || 0.5);
    var animType = options.animationType || 'rotate';

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    container.style.position = 'relative';
    container.appendChild(canvas);

    var gl = canvas.getContext('webgl', {
      alpha: transparent,
      antialias: false,
      powerPreference: 'high-performance'
    });
    if (!gl) { console.warn('WebGL not supported'); return { destroy: function () {} }; }

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    var prog = createProgram(gl, vertSrc, fragSrc);
    if (!prog) return { destroy: function () {} };
    gl.useProgram(prog);

    var posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var loc = {};
    ['iResolution', 'iTime', 'uHeight', 'uBaseHalf', 'uRot', 'uUseBaseWobble',
     'uGlow', 'uOffsetPx', 'uNoise', 'uSaturation', 'uScale', 'uHueShift',
     'uColorFreq', 'uBloom', 'uCenterShift', 'uInvBaseHalf', 'uInvHeight',
     'uMinAxis', 'uPxScale', 'uTimeScale'].forEach(function (n) {
      loc[n] = gl.getUniformLocation(prog, n);
    });

    var rotBuf = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    var dpr = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      var w = container.clientWidth || 1;
      var h = container.clientHeight || 1;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();

    var ro = new ResizeObserver(resize);
    ro.observe(container);

    gl.uniform1f(loc.uHeight, H);
    gl.uniform1f(loc.uBaseHalf, BASE_HALF);
    gl.uniform1f(loc.uGlow, GLOW);
    gl.uniform1f(loc.uNoise, NOISE);
    gl.uniform1f(loc.uSaturation, SAT);
    gl.uniform1f(loc.uScale, SCALE);
    gl.uniform1f(loc.uHueShift, HUE);
    gl.uniform1f(loc.uColorFreq, CFREQ);
    gl.uniform1f(loc.uBloom, BLOOM);
    gl.uniform1f(loc.uCenterShift, H * 0.25);
    gl.uniform1f(loc.uInvBaseHalf, 1 / BASE_HALF);
    gl.uniform1f(loc.uInvHeight, 1 / H);
    gl.uniform1f(loc.uMinAxis, Math.min(BASE_HALF, H));
    gl.uniform1f(loc.uTimeScale, TS);

    var useWobble = (animType === 'rotate') ? 1 : 0;
    gl.uniform1i(loc.uUseBaseWobble, useWobble);
    gl.uniform2f(loc.uOffsetPx, 0, 0);

    var rnd = Math.random;
    var wX = (0.3 + rnd() * 0.6);
    var wY = (0.2 + rnd() * 0.7);
    var wZ = (0.1 + rnd() * 0.5);
    var phX = rnd() * Math.PI * 2;
    var phZ = rnd() * Math.PI * 2;

    var t0 = performance.now();
    var rafId = null;
    var NOISE_IS_ZERO = NOISE < 1e-6;

    function render(t) {
      rafId = requestAnimationFrame(render);
      var time = (t - t0) * 0.001;
      gl.uniform1f(loc.iTime, time);
      gl.uniform2f(loc.iResolution, canvas.width, canvas.height);
      gl.uniform1f(loc.uPxScale, 1 / ((canvas.height || 1) * 0.1 * SCALE));

      if (animType === 'rotate') {
        rotBuf[0] = 1; rotBuf[1] = 0; rotBuf[2] = 0;
        rotBuf[3] = 0; rotBuf[4] = 1; rotBuf[5] = 0;
        rotBuf[6] = 0; rotBuf[7] = 0; rotBuf[8] = 1;
        gl.uniformMatrix3fv(loc.uRot, false, rotBuf);
      } else if (animType === '3drotate') {
        var tS = time * TS;
        var yaw = tS * wY;
        var pitch = Math.sin(tS * wX + phX) * 0.6;
        var roll = Math.sin(tS * wZ + phZ) * 0.5;
        setMat3FromEuler(yaw, pitch, roll, rotBuf);
        gl.uniformMatrix3fv(loc.uRot, false, rotBuf);
      }

      gl.clearColor(0, 0, 0, transparent ? 0 : 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    rafId = requestAnimationFrame(render);

    return {
      destroy: function () {
        if (rafId) cancelAnimationFrame(rafId);
        ro.disconnect();
        gl.deleteProgram(prog);
        gl.deleteBuffer(posBuf);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  };
})();
