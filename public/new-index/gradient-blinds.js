(function () {
  'use strict';

  var MAX_COLORS = 8;

  var fragShaderSource = [
    'precision highp float;',
    '',
    'uniform vec3  iResolution;',
    'uniform vec2  iMouse;',
    'uniform float iTime;',
    '',
    'uniform float uAngle;',
    'uniform float uNoise;',
    'uniform float uBlindCount;',
    'uniform float uSpotlightRadius;',
    'uniform float uSpotlightSoftness;',
    'uniform float uSpotlightOpacity;',
    'uniform float uMirror;',
    'uniform float uDistort;',
    'uniform float uShineFlip;',
    'uniform vec3  uColor0;',
    'uniform vec3  uColor1;',
    'uniform int   uColorCount;',
    '',
    'varying vec2 vUv;',
    '',
    'float rand(vec2 co){',
    '  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);',
    '}',
    '',
    'vec2 rotate2D(vec2 p, float a){',
    '  float c = cos(a);',
    '  float s = sin(a);',
    '  return mat2(c, -s, s, c) * p;',
    '}',
    '',
    'vec3 getGradientColor(float t){',
    '  float tt = clamp(t, 0.0, 1.0);',
    '  if (uColorCount < 2) return mix(uColor0, uColor1, tt);',
    '  float scaled = tt * float(uColorCount - 1);',
    '  float seg = floor(scaled);',
    '  float f = fract(scaled);',
    '  if (seg < 1.0) return mix(uColor0, uColor1, f);',
    '  return mix(uColor1, uColor0, f);',
    '}',
    '',
    'void mainImage(out vec4 fragColor, in vec2 fragCoord) {',
    '    vec2 uv0 = fragCoord.xy / iResolution.xy;',
    '',
    '    float aspect = iResolution.x / iResolution.y;',
    '    vec2 p = uv0 * 2.0 - 1.0;',
    '    p.x *= aspect;',
    '    vec2 pr = rotate2D(p, uAngle);',
    '    pr.x /= aspect;',
    '    vec2 uv = pr * 0.5 + 0.5;',
    '',
    '    vec2 uvMod = uv;',
    '    if (uDistort > 0.0) {',
    '      float a = uvMod.y * 6.0;',
    '      float b = uvMod.x * 6.0;',
    '      float w = 0.01 * uDistort;',
    '      uvMod.x += sin(a) * w;',
    '      uvMod.y += cos(b) * w;',
    '    }',
    '    float t = uvMod.x;',
    '    if (uMirror > 0.5) {',
    '      t = 1.0 - abs(1.0 - 2.0 * fract(t));',
    '    }',
    '    vec3 base = getGradientColor(t);',
    '',
    '    vec2 offset = vec2(iMouse.x/iResolution.x, iMouse.y/iResolution.y);',
    '    float d = length(uv0 - offset);',
    '    float r = max(uSpotlightRadius, 1e-4);',
    '    float dn = d / r;',
    '    float spot = (1.0 - 2.0 * pow(dn, uSpotlightSoftness)) * uSpotlightOpacity;',
    '    vec3 cir = vec3(spot);',
    '    float stripe = fract(uvMod.x * max(uBlindCount, 1.0));',
    '    if (uShineFlip > 0.5) stripe = 1.0 - stripe;',
    '    vec3 ran = vec3(stripe);',
    '',
    '    vec3 col = cir + base - ran;',
    '    col += (rand(gl_FragCoord.xy + iTime) - 0.5) * uNoise;',
    '',
    '    fragColor = vec4(col, 1.0);',
    '}',
    '',
    'void main() {',
    '    vec4 color;',
    '    mainImage(color, vUv * iResolution.xy);',
    '    gl_FragColor = color;',
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
    var prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      return null;
    }
    return prog;
  }

  window.GradientBlinds = function (container, options) {
    options = options || {};

    var gradientColors = options.gradientColors || ['#FF9FFC', '#5227FF'];
    var angle = options.angle || 0;
    var noise = options.noise !== undefined ? options.noise : 0.25;
    var blindCount = options.blindCount || 16;
    var blindMinWidth = options.blindMinWidth || 60;
    var mouseDampening = options.mouseDampening || 0.3;
    var mirrorGradient = options.mirrorGradient || false;
    var spotlightRadius = options.spotlightRadius || 0.5;
    var spotlightSoftness = options.spotlightSoftness || 1;
    var spotlightOpacity = options.spotlightOpacity || 1;
    var distortAmount = options.distortAmount || 0;
    var shineDirection = options.shineDirection || 'left';

    var canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    var gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      console.warn('WebGL not supported for GradientBlinds');
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

    var u = {};
    var names = [
      'iResolution', 'iMouse', 'iTime',
      'uAngle', 'uNoise', 'uBlindCount',
      'uSpotlightRadius', 'uSpotlightSoftness', 'uSpotlightOpacity',
      'uMirror', 'uDistort', 'uShineFlip',
      'uColor0', 'uColor1', 'uColorCount'
    ];
    for (var i = 0; i < names.length; i++) {
      u[names[i]] = gl.getUniformLocation(program, names[i]);
    }

    var colorArr = gradientColors.filter(Boolean).slice(0, MAX_COLORS).map(hexToRgb);
    while (colorArr.length < 2) colorArr.push(colorArr[colorArr.length - 1] || [0, 0, 0]);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var mouseX = 0, mouseY = 0;
    var mouseTargetX = 0, mouseTargetY = 0;
    var lastTime = 0;

    function resize() {
      var w = container.clientWidth || 1;
      var h = container.clientHeight || 1;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);

      if (blindMinWidth && blindMinWidth > 0) {
        var maxByMin = Math.max(1, Math.floor(canvas.width / blindMinWidth));
        var effective = blindCount ? Math.min(blindCount, maxByMin) : maxByMin;
        gl.uniform1f(u.uBlindCount, Math.max(1, effective));
      } else {
        gl.uniform1f(u.uBlindCount, Math.max(1, blindCount));
      }
    }
    resize();

    var ro = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(resize);
      ro.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    function onPointerMove(e) {
      var rect = canvas.getBoundingClientRect();
      var scale = dpr;
      mouseTargetX = (e.clientX - rect.left) * scale;
      mouseTargetY = (rect.height - (e.clientY - rect.top)) * scale;
    }
    canvas.addEventListener('pointermove', onPointerMove);

    var rafId = null;

    function loop(t) {
      rafId = requestAnimationFrame(loop);

      gl.uniform1f(u.iTime, t * 0.001);

      if (mouseDampening > 0) {
        if (!lastTime) lastTime = t;
        var dt = (t - lastTime) / 1000;
        lastTime = t;
        var tau = Math.max(1e-4, mouseDampening);
        var factor = 1 - Math.exp(-dt / tau);
        if (factor > 1) factor = 1;
        mouseX += (mouseTargetX - mouseX) * factor;
        mouseY += (mouseTargetY - mouseY) * factor;
      } else {
        lastTime = t;
        mouseX = mouseTargetX;
        mouseY = mouseTargetY;
      }

      gl.uniform3f(u.iResolution, canvas.width, canvas.height, 1);
      gl.uniform2f(u.iMouse, mouseX, mouseY);
      gl.uniform1f(u.uAngle, (angle * Math.PI) / 180);
      gl.uniform1f(u.uNoise, noise);
      gl.uniform1f(u.uSpotlightRadius, spotlightRadius);
      gl.uniform1f(u.uSpotlightSoftness, spotlightSoftness);
      gl.uniform1f(u.uSpotlightOpacity, spotlightOpacity);
      gl.uniform1f(u.uMirror, mirrorGradient ? 1 : 0);
      gl.uniform1f(u.uDistort, distortAmount);
      gl.uniform1f(u.uShineFlip, shineDirection === 'right' ? 1 : 0);
      gl.uniform3fv(u.uColor0, colorArr[0]);
      gl.uniform3fv(u.uColor1, colorArr[1]);
      gl.uniform1i(u.uColorCount, Math.max(2, colorArr.length));

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    rafId = requestAnimationFrame(loop);

    return {
      destroy: function () {
        if (rafId) cancelAnimationFrame(rafId);
        canvas.removeEventListener('pointermove', onPointerMove);
        if (ro) ro.disconnect();
        else window.removeEventListener('resize', resize);
        gl.deleteProgram(program);
        gl.deleteBuffer(posBuffer);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  };
})();
