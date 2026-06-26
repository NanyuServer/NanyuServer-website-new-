(function () {
  'use strict';

  var MAX_COLORS = 8;

  var fragShaderSource = [
    'precision highp float;',
    '#define MAX_COLORS ' + MAX_COLORS,
    'uniform vec2 uCanvas;',
    'uniform float uTime;',
    'uniform float uSpeed;',
    'uniform vec2 uRot;',
    'uniform int uColorCount;',
    'uniform vec3 uColors[MAX_COLORS];',
    'uniform int uTransparent;',
    'uniform float uScale;',
    'uniform float uFrequency;',
    'uniform float uWarpStrength;',
    'uniform vec2 uPointer;',
    'uniform float uMouseInfluence;',
    'uniform float uParallax;',
    'uniform float uNoise;',
    'uniform int uIterations;',
    'uniform float uIntensity;',
    'uniform float uBandWidth;',
    'varying vec2 vUv;',
    '',
    'void main() {',
    '  float t = uTime * uSpeed;',
    '  vec2 p = vUv * 2.0 - 1.0;',
    '  p += uPointer * uParallax * 0.1;',
    '  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);',
    '  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);',
    '  q /= max(uScale, 0.0001);',
    '  q /= 0.5 + 0.2 * dot(q, q);',
    '  q += 0.2 * cos(t) - 7.56;',
    '  vec2 toward = (uPointer - rp);',
    '  q += toward * uMouseInfluence * 0.2;',
    '',
    '  for (int j = 0; j < 5; j++) {',
    '    if (j >= uIterations - 1) break;',
    '    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));',
    '    q += (rr - q) * 0.15;',
    '  }',
    '',
    '  vec3 col = vec3(0.0);',
    '  float a = 1.0;',
    '',
    '  if (uColorCount > 0) {',
    '    vec2 s = q;',
    '    vec3 sumCol = vec3(0.0);',
    '    float cover = 0.0;',
    '    for (int i = 0; i < MAX_COLORS; ++i) {',
    '      if (i >= uColorCount) break;',
    '      s -= 0.01;',
    '      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));',
    '      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);',
    '      float kBelow = clamp(uWarpStrength, 0.0, 1.0);',
    '      float kMix = pow(kBelow, 0.3);',
    '      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);',
    '      vec2 disp = (r - s) * kBelow;',
    '      vec2 warped = s + disp * gain;',
    '      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);',
    '      float m = mix(m0, m1, kMix);',
    '      float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));',
    '      sumCol += uColors[i] * w;',
    '      cover = max(cover, w);',
    '    }',
    '    col = clamp(sumCol, 0.0, 1.0);',
    '    a = uTransparent > 0 ? cover : 1.0;',
    '  } else {',
    '    vec2 s = q;',
    '    for (int k = 0; k < 3; ++k) {',
    '      s -= 0.01;',
    '      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));',
    '      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);',
    '      float kBelow = clamp(uWarpStrength, 0.0, 1.0);',
    '      float kMix = pow(kBelow, 0.3);',
    '      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);',
    '      vec2 disp = (r - s) * kBelow;',
    '      vec2 warped = s + disp * gain;',
    '      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);',
    '      float m = mix(m0, m1, kMix);',
    '      col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));',
    '    }',
    '    a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;',
    '  }',
    '',
    '  col *= uIntensity;',
    '',
    '  if (uNoise > 0.0001) {',
    '    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);',
    '    col += (n - 0.5) * uNoise;',
    '    col = clamp(col, 0.0, 1.0);',
    '  }',
    '',
    '  vec3 rgb = (uTransparent > 0) ? col * a : col;',
    '  gl_FragColor = vec4(rgb, a);',
    '}'
  ].join('\n');

  var vertShaderSource = [
    'attribute vec2 aPosition;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = aPosition * 0.5 + 0.5;',
    '  gl_Position = vec4(aPosition, 0.0, 1.0);',
    '}'
  ].join('\n');

  function hexToRgb(hex) {
    hex = hex.replace('#', '').trim();
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16) / 255,
        parseInt(hex[1] + hex[1], 16) / 255,
        parseInt(hex[2] + hex[2], 16) / 255
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255
    ];
  }

  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vertSrc, fragSrc) {
    var vert = createShader(gl, gl.VERTEX_SHADER, vertSrc);
    var frag = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vert || !frag) return null;
    var program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  window.ColorBends = function (container, options) {
    options = options || {};

    var rotation = options.rotation || 90;
    var speed = options.speed || 0.2;
    var colors = options.colors || ['#5227FF', '#31088b', '#7C3AED'];
    var transparent = options.transparent !== undefined ? options.transparent : true;
    var autoRotate = options.autoRotate || 0;
    var scale = options.scale || 1;
    var frequency = options.frequency || 1;
    var warpStrength = options.warpStrength || 1;
    var mouseInfluence = options.mouseInfluence || 1;
    var parallax = options.parallax || 0.5;
    var noise = options.noise || 0;
    var iterations = options.iterations || 1;
    var intensity = options.intensity || 1.5;
    var bandWidth = options.bandWidth || 6;

    var canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    var gl = canvas.getContext('webgl', {
      alpha: transparent,
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      console.warn('WebGL not supported');
      return { destroy: function () {} };
    }

    var program = createProgram(gl, vertShaderSource, fragShaderSource);
    if (!program) return { destroy: function () {} };

    gl.useProgram(program);

    var posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    var aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    var uniforms = {};
    var uniformNames = [
      'uCanvas', 'uTime', 'uSpeed', 'uRot', 'uColorCount',
      'uTransparent', 'uScale', 'uFrequency', 'uWarpStrength',
      'uPointer', 'uMouseInfluence', 'uParallax', 'uNoise',
      'uIterations', 'uIntensity', 'uBandWidth'
    ];
    for (var ui = 0; ui < uniformNames.length; ui++) {
      uniforms[uniformNames[ui]] = gl.getUniformLocation(program, uniformNames[ui]);
    }

    var colorUniforms = [];
    for (var ci = 0; ci < MAX_COLORS; ci++) {
      colorUniforms.push(gl.getUniformLocation(program, 'uColors[' + ci + ']'));
    }

    var colorArray = colors.filter(Boolean).slice(0, MAX_COLORS).map(hexToRgb);

    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    var pointerX = 0, pointerY = 0;
    var pointerTargetX = 0, pointerTargetY = 0;

    function onMouseMove(e) {
      var rect = container.getBoundingClientRect();
      pointerTargetX = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
      pointerTargetY = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
    }
    container.addEventListener('pointermove', onMouseMove);

    function resize() {
      var w = container.clientWidth || 1;
      var h = container.clientHeight || 1;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();

    var ro = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(resize);
      ro.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    var startTime = performance.now() / 1000;
    var rafId = null;

    function loop() {
      var now = performance.now() / 1000;
      var elapsed = now - startTime;

      var deg = (rotation % 360) + autoRotate * elapsed;
      var rad = (deg * Math.PI) / 180;
      var c = Math.cos(rad);
      var s = Math.sin(rad);

      var smooth = 8;
      var dt = 1 / 60;
      var amt = Math.min(1, dt * smooth);
      pointerX += (pointerTargetX - pointerX) * amt;
      pointerY += (pointerTargetY - pointerY) * amt;

      gl.uniform2f(uniforms.uCanvas, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, elapsed);
      gl.uniform1f(uniforms.uSpeed, speed);
      gl.uniform2f(uniforms.uRot, c, s);
      gl.uniform1i(uniforms.uColorCount, colorArray.length);
      gl.uniform1i(uniforms.uTransparent, transparent ? 1 : 0);
      gl.uniform1f(uniforms.uScale, scale);
      gl.uniform1f(uniforms.uFrequency, frequency);
      gl.uniform1f(uniforms.uWarpStrength, warpStrength);
      gl.uniform2f(uniforms.uPointer, pointerX, pointerY);
      gl.uniform1f(uniforms.uMouseInfluence, mouseInfluence);
      gl.uniform1f(uniforms.uParallax, parallax);
      gl.uniform1f(uniforms.uNoise, noise);
      gl.uniform1i(uniforms.uIterations, iterations);
      gl.uniform1f(uniforms.uIntensity, intensity);
      gl.uniform1f(uniforms.uBandWidth, bandWidth);

      for (var i = 0; i < MAX_COLORS; i++) {
        if (i < colorArray.length) {
          gl.uniform3fv(colorUniforms[i], colorArray[i]);
        } else {
          gl.uniform3fv(colorUniforms[i], [0, 0, 0]);
        }
      }

      gl.clearColor(0, 0, 0, transparent ? 0 : 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return {
      destroy: function () {
        if (rafId) cancelAnimationFrame(rafId);
        container.removeEventListener('pointermove', onMouseMove);
        if (ro) ro.disconnect();
        else window.removeEventListener('resize', resize);
        gl.deleteProgram(program);
        gl.deleteBuffer(posBuffer);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  };
})();
