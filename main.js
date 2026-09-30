import * as THREE from 'three';
window.THREE = THREE;

/**
 * Ragul Sadhasivam — Milan Compain Experience Architecture
 * Preloader · Three.js 3D Celestial Star · Scroll Scrubbing · Magnetic Cursor · Stepped Projects
 */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initCustomCursor();
  init3DCosmosStar();
  initScrollStorytelling();
  initScrollContentLoader();
  initCaseStudyModal();
  initEmailClipboard();
  initNavTracking();

  window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const scrollTo = urlParams.get('scroll_to');
    if (scrollTo) {
      const el = document.getElementById(scrollTo) || document.querySelector(`[data-project="${scrollTo}"]`);
      if (el) {
        const navH = document.getElementById('nav')?.offsetHeight || 70;
        const targetY = el.offsetTop - navH;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }
  });
});

/* ==========================================================================
   01. PRELOADER (Exact Milan Compain Count & Track)
   ========================================================================== */
function initPreloader() {
  const loader = document.getElementById('loader');
  const counter = document.getElementById('ld-counter');
  const fill = document.getElementById('ld-progress');
  const w1 = document.getElementById('ld-word-1');
  const w2 = document.getElementById('ld-word-2');
  const w3 = document.getElementById('ld-word-3');

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('skip_preloader') === 'true') {
    if (loader) {
      loader.classList.add('done');
      loader.style.display = 'none';
    }
    document.body.classList.remove('locked');
    return;
  }

  let count = 0;
  const startTime = performance.now();
  const duration = 1600; // 1.6s smooth cinematic count

  function updateLoader(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease progress
    const easeProgress = Math.pow(progress, 2.2);
    count = Math.floor(easeProgress * 100);

    // Format 000, 042, 100
    counter.textContent = count.toString().padStart(3, '0');
    fill.style.transform = `scaleX(${progress})`;

    // Cycle middle words
    if (progress > 0.33 && progress <= 0.66) {
      w1.className = 'ld-word off';
      w2.className = 'ld-word on';
    } else if (progress > 0.66) {
      w2.className = 'ld-word off';
      w3.className = 'ld-word on';
    }

    if (progress < 1) {
      requestAnimationFrame(updateLoader);
    } else {
      counter.textContent = '100';
      fill.style.transform = 'scaleX(1)';
      setTimeout(() => {
        loader.classList.add('done');
        loader.style.display = 'none';
        document.body.classList.remove('locked');
      }, 400);
    }
  }

  requestAnimationFrame(updateLoader);
}

/* ==========================================================================
   02. MAGNETIC CURSOR & HOVER VISITOR
   ========================================================================== */
function initCustomCursor() {
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  const visit = document.getElementById('cur-visit');

  if (!dot || !ring || !visit) return;

  // On touch screens or small devices, disable custom cursor
  if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 992) {
    dot.style.display = 'none';
    ring.style.display = 'none';
    visit.style.display = 'none';
    return;
  }

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let visitX = -100;
  let visitY = -100;
  let hasMoved = false;

  window.addEventListener('mousemove', (e) => {
    if (!hasMoved) {
      hasMoved = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      ringX = e.clientX;
      ringY = e.clientY;
      visitX = e.clientX;
      visitY = e.clientY;
    }
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  window.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    visit.classList.remove('on');
  });

  window.addEventListener('mouseenter', () => {
    if (hasMoved) {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    }
  });

  function renderCursor() {
    if (hasMoved) {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;

      visitX += (mouseX - visitX) * 0.2;
      visitY += (mouseY - visitY) * 0.2;
      visit.style.transform = `translate(${visitX}px, ${visitY}px)`;
    }
    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  // Hover states
  document.querySelectorAll('a, button, .pcard-item, .open-case-study').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.classList.add('mag');
      if (el.classList.contains('pcard-item') || el.closest('.pcard-item') || el.classList.contains('open-case-study')) {
        visit.classList.add('on');
        ring.style.opacity = '0';
        dot.style.opacity = '0';
      }
    });

    el.addEventListener('mouseleave', () => {
      ring.classList.remove('mag');
      visit.classList.remove('on');
      if (hasMoved) {
        ring.style.opacity = '1';
        dot.style.opacity = '1';
      }
    });
  });
}

/* ==========================================================================
   03. THREE.JS HIGH-DEFINITION CELESTIAL PARTICLE STAR & SPACE DOTS (#cosmos)
   Razor-Sharp Pinpoint Stardust · Deep Cosmic Dust Field · Magnetic Physics
   ========================================================================== */
let starScene, starCamera, starRenderer, starGroup, doorGroup;
let starPointsMesh, spaceDotsMesh;
let starTargetX = 0;
let starTargetY = 0;
let starTargetZ = -1.5;
let starTargetScale = 1.0;
let starTargetOpacity = 1.0;
let starTargetRotZ = 0;
let starSpin = 0;
let starMat, spaceDotsMat;

function init3DCosmosStar() {
  const canvas = document.getElementById('star-canvas');
  const container = document.getElementById('cosmos');
  if (!canvas || !container) return;

  // Scene & Perspective Camera
  starScene = new THREE.Scene();
  starCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
  starCamera.position.z = 16;

  // WebGL Renderer with High-DPI Sharpness & Filmic Tone Mapping
  starRenderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  starRenderer.setSize(window.innerWidth, window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  starRenderer.setPixelRatio(dpr);

  // --- EXACT ASTROID VOLUMETRIC FORMULATION (PURE SPACE DOTS - WITH GUARANTEED SPACING) ---
  const rl = 3.6;            // Astroid superellipse power
  const En = 1.04;           // Star vertical elongation ratio
  const dm = 0.05;           // Star depth thickness ratio (slim depth prevents 3D overlap from all angles)
  const ta = 7.2;            // Coordinate scale
  const C = ta;
  const B = ta * En;
  const nt = dm * B;

  function evalAstroid(angle, scaleX, aspectY) {
    const scaleY = scaleX * aspectY;
    const power = 2 / rl;
    const cosTerm = Math.pow(Math.abs(Math.cos(angle)) / scaleX, power);
    const sinTerm = Math.pow(Math.abs(Math.sin(angle)) / scaleY, power);
    const radius = Math.pow(cosTerm + sinTerm, -rl / 2);
    return {
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      r: radius
    };
  }

  function isInsideAstroid(x, y, margin = 1.0) {
    const p = 2 / rl;
    return (Math.pow(Math.abs(x) / C, p) + Math.pow(Math.abs(y) / B, p)) <= margin;
  }

  // Generate spaced-out dots with GUARANTEED minimum distance (Dots NEVER touch one to one)
  const starDots = [];
  const minDist = 0.32; // Calibrated physical gap between dots for high visibility without touching
  const minDistSq = minDist * minDist;
  const cellSize = minDist / Math.SQRT2;
  const gridW = Math.ceil((C * 2) / cellSize) + 8;
  const gridH = Math.ceil((B * 2) / cellSize) + 8;
  const grid = new Int32Array(gridW * gridH).fill(-1);

  function getGridIdx(gx, gy) {
    return gy * gridW + gx;
  }

  const originGX = Math.floor(gridW / 2);
  const originGY = Math.floor(gridH / 2);
  const activeList = [];

  function canAdd(x, y) {
    const gx = Math.floor(x / cellSize) + originGX;
    const gy = Math.floor(y / cellSize) + originGY;
    if (gx < 0 || gx >= gridW || gy < 0 || gy >= gridH) return false;

    const minX = Math.max(0, gx - 2);
    const maxX = Math.min(gridW - 1, gx + 2);
    const minY = Math.max(0, gy - 2);
    const maxY = Math.min(gridH - 1, gy + 2);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const nIdx = grid[getGridIdx(cx, cy)];
        if (nIdx !== -1) {
          const np = starDots[nIdx];
          const dSq = (x - np.x) * (x - np.x) + (y - np.y) * (y - np.y);
          if (dSq < minDistSq) return false;
        }
      }
    }
    return true;
  }

  function addPoint(x, y, isPerimeter = false) {
    if (!canAdd(x, y)) return false;
    const gx = Math.floor(x / cellSize) + originGX;
    const gy = Math.floor(y / cellSize) + originGY;

    const rFrac = Math.sqrt((x * x) / (C * C) + (y * y) / (B * B));
    // Soft depth pillowing: flatter near tips, gently curved in body
    const z = isPerimeter ? 0 : (Math.random() * 2 - 1) * nt * Math.max(0.06, 1.0 - rFrac * 0.7);

    const newPt = { x, y, z };
    const idx = starDots.length;
    starDots.push(newPt);
    grid[getGridIdx(gx, gy)] = idx;
    activeList.push(idx);
    return true;
  }

  // 1. Trace the 4 tips & outer curves with spaced dots (NO lines, NO strokes, strictly spaced dots)
  const perimeterSamples = 200;
  for (let i = 0; i < perimeterSamples; i++) {
    const angle = (i / perimeterSamples) * Math.PI * 2;
    const cur = evalAstroid(angle, C, En);
    const px = cur.dx * cur.r * 0.985;
    const py = cur.dy * cur.r * 0.985;
    addPoint(px, py, true);
  }

  // 2. Add center
  addPoint(0, 0);

  // 3. Poisson disc fill the interior with guaranteed minimum spacing
  const k = 36;
  while (activeList.length > 0) {
    const randIdx = Math.floor(Math.random() * activeList.length);
    const pIdx = activeList[randIdx];
    const baseP = starDots[pIdx];
    let found = false;

    for (let i = 0; i < k; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist * (1.04 + Math.random() * 0.75);
      const nx = baseP.x + Math.cos(angle) * dist;
      const ny = baseP.y + Math.sin(angle) * dist;

      if (!isInsideAstroid(nx, ny, 0.97)) continue;
      if (addPoint(nx, ny, false)) {
        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(randIdx, 1);
    }
  }

  const u = starDots.length;
  const pBase = new Float32Array(u * 3);
  const pCurrent = new Float32Array(u * 3);
  const pRender = new Float32Array(u * 3);
  const pDisplace = new Float32Array(u * 3);

  const pColors = new Float32Array(u * 3);
  const pSizes = new Float32Array(u);
  const pPhase = new Float32Array(u);
  const pDrift = new Float32Array(u);

  // Curated High-Definition Celestial Space Dots Palette
  const colWhite = [1.0, 1.0, 1.0];        // Pure Diamond Sparkle
  const colMint = [0.65, 1.0, 0.86];       // Signature Electric Mint (#9FF5D4)
  const colEmerald = [0.22, 0.94, 0.65];    // Radiant Emerald (#2EE6A0)
  const colCyan = [0.35, 0.88, 1.0];       // Cosmic Cyan (#38BDF8)

  for (let i = 0; i < u; i++) {
    const pt = starDots[i];
    const idx = i * 3;
    pBase[idx] = pt.x;
    pBase[idx + 1] = pt.y;
    pBase[idx + 2] = pt.z;

    let pickCol;
    const rand = Math.random();
    if (rand < 0.30) pickCol = colWhite;
    else if (rand < 0.64) pickCol = colMint;
    else if (rand < 0.84) pickCol = colEmerald;
    else pickCol = colCyan;

    pColors[idx] = pickCol[0];
    pColors[idx + 1] = pickCol[1];
    pColors[idx + 2] = pickCol[2];

    pSizes[i] = 0.16 + Math.random() * 0.10; // Delicate, sharp pinpoint dots
    pPhase[i] = Math.random() * 6.283;
    pDrift[i] = 0.008; // Controlled drift so dots never collide while floating
  }

  pCurrent.set(pBase);
  pRender.set(pBase);

  // Star Buffer Geometry
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pRender, 3));
  starGeo.setAttribute('aColor', new THREE.BufferAttribute(pColors, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
  starGeo.setAttribute('aDrift', new THREE.BufferAttribute(pDrift, 1));

  // Custom Ultra-Sharp GLSL Shader (PURE PINPOINT SPACE DOTS - CLEAN SEPARATION)
  const halfH = starRenderer.domElement.height * 0.5 || 450;
  starMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 1.0 },
      uScale: { value: halfH },
      uTime: { value: 0 },
      uDpr: { value: dpr }
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      attribute float aDrift;

      uniform float uTime;
      uniform float uScale;
      uniform float uDpr;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = aColor;

        vec3 p = position;
        float dr = aDrift * 0.04;
        p.x += sin(uTime * 0.75 + aPhase) * dr;
        p.y += cos(uTime * 0.65 + aPhase * 1.5) * dr;
        p.z += sin(uTime * 0.55 + aPhase * 2.0) * dr;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = max(-mv.z, 0.1);

        float basePx = aSize * (uScale / depth) * 0.75;
        gl_PointSize = clamp(basePx * uDpr, 2.0 * uDpr, 3.6 * uDpr);

        float tw = 0.84 + 0.16 * sin(uTime * 2.2 + aPhase * 6.283);
        vAlpha = tw;

        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float dist = length(p);
        if (dist > 0.5) discard;

        // Sub-pixel hardware-safe smooth circular space dot
        float edge = smoothstep(0.5, 0.35, dist);

        // Concentrated luminous pinpoint core
        float core = exp(-dist * 6.5) * 1.5;
        float intensity = edge * 0.75 + core * 0.85;

        float a = clamp(intensity * vAlpha * uOpacity, 0.0, 1.0);
        if (a < 0.008) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `
  });

  starPointsMesh = new THREE.Points(starGeo, starMat);
  starPointsMesh.renderOrder = 2;

  starGroup = new THREE.Group();
  starGroup.add(starPointsMesh);
  starScene.add(starGroup);

  // Doorway placeholder group to maintain scroll compatibility
  doorGroup = new THREE.Group();
  starScene.add(doorGroup);

  // --- SPACE DOTS ELEMENTS (Ambient Celestial Floating Stardust & Deep Starfield) ---
  const dotsCount = 750;
  const dotsPos = new Float32Array(dotsCount * 3);
  const dotsCol = new Float32Array(dotsCount * 3);
  const dotsSize = new Float32Array(dotsCount);
  const dotsPhase = new Float32Array(dotsCount);
  const dotsSpeed = new Float32Array(dotsCount);

  for (let i = 0; i < dotsCount; i++) {
    // 3D volume covering full visible frustum and depth
    dotsPos[i * 3] = (Math.random() - 0.5) * 64;     // X: -32 to +32
    dotsPos[i * 3 + 1] = (Math.random() - 0.5) * 44; // Y: -22 to +22
    dotsPos[i * 3 + 2] = -18 + Math.random() * 26;   // Z: -18 to +8 (including foreground floaters!)

    // Cosmic color selection
    const rand = Math.random();
    let col;
    if (rand < 0.38) col = colWhite;
    else if (rand < 0.72) col = colMint;
    else if (rand < 0.88) col = colCyan;
    else col = colEmerald;

    dotsCol[i * 3] = col[0];
    dotsCol[i * 3 + 1] = col[1];
    dotsCol[i * 3 + 2] = col[2];

    dotsSize[i] = 0.28 + Math.random() * 0.45;       // Generates 2.5px to 5.5px sharp glowing dots
    dotsPhase[i] = Math.random() * 6.283;
    dotsSpeed[i] = 0.35 + Math.random() * 0.95;
  }

  const spaceDotsGeo = new THREE.BufferGeometry();
  spaceDotsGeo.setAttribute('position', new THREE.BufferAttribute(dotsPos, 3));
  spaceDotsGeo.setAttribute('aColor', new THREE.BufferAttribute(dotsCol, 3));
  spaceDotsGeo.setAttribute('aSize', new THREE.BufferAttribute(dotsSize, 1));
  spaceDotsGeo.setAttribute('aPhase', new THREE.BufferAttribute(dotsPhase, 1));
  spaceDotsGeo.setAttribute('aSpeed', new THREE.BufferAttribute(dotsSpeed, 1));

  spaceDotsMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0.90 },
      uScale: { value: halfH },
      uTime: { value: 0 },
      uDpr: { value: dpr },
      uMouse: { value: new THREE.Vector2(0, 0) }
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;

      uniform float uTime;
      uniform float uScale;
      uniform float uDpr;
      uniform vec2 uMouse;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = aColor;

        vec3 p = position;
        float sp = aSpeed * 0.35;
        p.x += sin(uTime * sp + aPhase) * 0.45 + uMouse.x * (0.8 + p.z * 0.08);
        p.y += cos(uTime * (sp * 0.9) + aPhase * 1.4) * 0.45 + uMouse.y * (0.8 + p.z * 0.08);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = max(-mv.z, 0.1);

        float basePx = aSize * (uScale / depth) * 0.50;
        gl_PointSize = clamp(basePx * uDpr, 2.5 * uDpr, 6.0 * uDpr);

        float tw = 0.58 + 0.42 * sin(uTime * 1.6 + aPhase * 6.283);
        vAlpha = tw * clamp(1.0 - (depth - 6.0) / 32.0, 0.35, 1.0);

        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float dist = length(p);
        if (dist > 0.5) discard;

        float edge = smoothstep(0.5, 0.38, dist);
        float core = exp(-dist * 6.0);
        float intensity = edge * 0.65 + core * 0.75;

        float a = clamp(intensity * vAlpha * uOpacity, 0.0, 1.0);
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `
  });

  spaceDotsMesh = new THREE.Points(spaceDotsGeo, spaceDotsMat);
  spaceDotsMesh.renderOrder = 1;
  starScene.add(spaceDotsMesh);

  // Viewport Scale Synchronization
  function updateViewportScale() {
    starCamera.aspect = window.innerWidth / window.innerHeight;
    starCamera.updateProjectionMatrix();
    starRenderer.setSize(window.innerWidth, window.innerHeight);
    const curDpr = Math.min(window.devicePixelRatio || 1, 2);
    starRenderer.setPixelRatio(curDpr);
    const curHalfH = starRenderer.domElement.height * 0.5;
    if (starMat && starMat.uniforms) {
      starMat.uniforms.uScale.value = curHalfH;
      starMat.uniforms.uDpr.value = curDpr;
    }
    if (spaceDotsMat && spaceDotsMat.uniforms) {
      spaceDotsMat.uniforms.uScale.value = curHalfH;
      spaceDotsMat.uniforms.uDpr.value = curDpr;
    }
  }
  updateViewportScale();
  window.addEventListener('resize', updateViewportScale);

  // Interactive Mouse Parallax & Dynamic Light Physics
  const mouseNDC = new THREE.Vector2(99, 99);
  let mouseActive = false;

  window.addEventListener('pointermove', (e) => {
    mouseNDC.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    mouseActive = true;
  });

  window.addEventListener('mouseleave', () => {
    mouseNDC.set(99, 99);
    mouseActive = false;
  });

  // Render & Physics Simulation Loop
  let clockTime = 0;
  const rayEnd = new THREE.Vector3();
  const rayDir = new THREE.Vector3();
  const invRot = new THREE.Matrix4();
  const localCursor = new THREE.Vector3();
  const vortexRadius = 1.35;
  const vortexRadiusSq = vortexRadius * vortexRadius;

  function animate() {
    requestAnimationFrame(animate);
    clockTime += 0.016;

    if (starMat && starMat.uniforms) {
      starMat.uniforms.uTime.value = clockTime;
      starMat.uniforms.uOpacity.value += (starTargetOpacity - starMat.uniforms.uOpacity.value) * 0.08;
    }

    if (spaceDotsMat && spaceDotsMat.uniforms) {
      spaceDotsMat.uniforms.uTime.value = clockTime;
      const targetMouseX = (mouseActive && mouseNDC.x < 10) ? mouseNDC.x * 0.45 : 0;
      const targetMouseY = (mouseActive && mouseNDC.x < 10) ? mouseNDC.y * 0.45 : 0;
      spaceDotsMat.uniforms.uMouse.value.x += (targetMouseX - spaceDotsMat.uniforms.uMouse.value.x) * 0.05;
      spaceDotsMat.uniforms.uMouse.value.y += (targetMouseY - spaceDotsMat.uniforms.uMouse.value.y) * 0.05;
      spaceDotsMat.uniforms.uOpacity.value = Math.max(0.75, starTargetOpacity);
    }

    // Star Position & Scale Smooth Interpolation
    starGroup.position.x += (starTargetX - starGroup.position.x) * 0.07;
    starGroup.position.y += (starTargetY - starGroup.position.y) * 0.07;
    starGroup.position.z += (starTargetZ - starGroup.position.z) * 0.07;

    const curScale = starGroup.scale.x;
    const nextScale = curScale + (starTargetScale - curScale) * 0.07;
    starGroup.scale.set(nextScale, nextScale, nextScale);

    // Interactive 3D Tilt & Gentle Idle Float
    const hasCursor = mouseActive && mouseNDC.x < 10;
    const targetTiltX = hasCursor ? -mouseNDC.y * 0.32 : 0;
    const targetTiltY = hasCursor ? mouseNDC.x * 0.40 : 0;

    starGroup.rotation.y += 0.004 + (targetTiltY + starSpin - starGroup.rotation.y) * 0.06;
    starGroup.rotation.x += (targetTiltX + 0.16 + Math.sin(clockTime * 0.6) * 0.03 - starGroup.rotation.x) * 0.06;
    starGroup.rotation.z += (starTargetRotZ - starGroup.rotation.z) * 0.08;

    // Interactive Cursor Magnetic Vortex
    let hasLocalCursor = false;
    if (hasCursor) {
      rayEnd.set(mouseNDC.x, mouseNDC.y, 0.5).unproject(starCamera);
      rayDir.copy(rayEnd).sub(starCamera.position).normalize();
      const denom = rayDir.z || -1;
      const hitDist = (starGroup.position.z - starCamera.position.z) / denom;
      const hitWorld = starCamera.position.clone().add(rayDir.multiplyScalar(hitDist));

      invRot.makeRotationFromEuler(starGroup.rotation).invert();
      localCursor.copy(hitWorld).sub(starGroup.position).applyMatrix4(invRot);
      if (nextScale !== 1) localCursor.divideScalar(nextScale);
      hasLocalCursor = true;
    }

    // Interactive Magnetic Displacement Physics
    for (let i = 0; i < u; i++) {
      const idx = i * 3;
      const bx = pBase[idx], by = pBase[idx + 1], bz = pBase[idx + 2];

      pCurrent[idx] += (bx - pCurrent[idx]) * 0.08;
      pCurrent[idx + 1] += (by - pCurrent[idx + 1]) * 0.08;
      pCurrent[idx + 2] += (bz - pCurrent[idx + 2]) * 0.08;

      let targetDx = 0, targetDy = 0, targetDz = 0;
      let inVortex = false;

      if (hasLocalCursor) {
        const dx = pCurrent[idx] - localCursor.x;
        const dy = pCurrent[idx + 1] - localCursor.y;
        const dz = pCurrent[idx + 2] - localCursor.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < vortexRadiusSq && distSq > 1e-4) {
          inVortex = true;
          const dist = Math.sqrt(distSq);
          const force = (vortexRadius / dist - 1.0) * 0.7;
          targetDx = dx * force;
          targetDy = dy * force;
          targetDz = dz * force + 0.15;
        }
      }

      const ease = inVortex ? 0.22 : 0.06;
      pDisplace[idx] += (targetDx - pDisplace[idx]) * ease;
      pDisplace[idx + 1] += (targetDy - pDisplace[idx + 1]) * ease;
      pDisplace[idx + 2] += (targetDz - pDisplace[idx + 2]) * ease;

      pRender[idx] = pCurrent[idx] + pDisplace[idx];
      pRender[idx + 1] = pCurrent[idx + 1] + pDisplace[idx + 1];
      pRender[idx + 2] = pCurrent[idx + 2] + pDisplace[idx + 2];
    }
    starGeo.attributes.position.needsUpdate = true;

    // Render Scene
    starRenderer.render(starScene, starCamera);
  }
  animate();
}

/* ==========================================================================
   04. SCROLL STORYTELLING & NATURAL MOTION FEED
   ========================================================================== */
function initScrollStorytelling() {
  const manifesto = document.getElementById('manifesto');
  const projHeader = document.getElementById('projHeader');
  const contact = document.getElementById('contact');
  const pcardItems = document.querySelectorAll('.pcard-item');

  // Video Autoplay & 3D Star Steering via IntersectionObserver
  if ('IntersectionObserver' in window && pcardItems.length > 0) {
    const pcardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const item = entry.target;
        const video = item.querySelector('video');
        const isReverse = item.classList.contains('reverse');
        const isMobile = window.innerWidth < 992;

        if (entry.isIntersecting) {
          item.classList.add('in-view');
          if (video && video.paused) {
            video.play().catch(() => {});
          }

          // Steer 3D star mesh gracefully
          if (isMobile) {
            starTargetX = 0;
            starTargetY = -2.8;
            starTargetZ = -8.0;
            starTargetScale = 0.42;
            starTargetOpacity = 0.45;
          } else if (isReverse) {
            // Reverse slot has text left, media right -> star softly illuminates left
            starTargetX = -5.4;
            starTargetY = 0.2;
            starTargetZ = -4.5;
            starTargetScale = 0.75;
            starTargetOpacity = 0.65;
          } else {
            // Regular slot has media left, text right -> star softly illuminates right
            starTargetX = 5.4;
            starTargetY = 0.2;
            starTargetZ = -4.5;
            starTargetScale = 0.75;
            starTargetOpacity = 0.65;
          }
        } else {
          item.classList.remove('in-view');
          if (video && !video.paused) {
            video.pause();
          }
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    pcardItems.forEach(item => pcardObserver.observe(item));
  }

  function onScroll() {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;

    // 1. HERO ZONE (0 to windowH * 0.8)
    if (scrollY < windowH * 0.8) {
      starTargetX = 0;
      starTargetY = 0;
      starTargetZ = -3.2; // Back of contents in 3D camera space
      starTargetScale = 0.95;
      starTargetOpacity = 0.95;
      starTargetRotZ = 0;
      starSpin = 0;
    }

    // 2. ABOUT & BRIEF ZONE (Ensure star gently illuminates without covering text)
    if (manifesto) {
      const rect = manifesto.getBoundingClientRect();
      if (rect.top <= windowH * 0.8 && rect.bottom >= windowH * 0.15) {
        starTargetX = 5.2;
        starTargetY = 0.4;
        starTargetZ = -6.5;
        starTargetScale = 0.52;
        starTargetOpacity = 0.60;
        starTargetRotZ = 0.5;
        starSpin = scrollY * 0.0012;
      }
    }

    // 3. CONTACT ZONE
    if (contact) {
      const cRect = contact.getBoundingClientRect();
      if (cRect.top <= windowH * 0.7) {
        starTargetX = 0;
        starTargetY = 2.0;
        starTargetZ = -4.5;
        starTargetScale = 0.65;
        starTargetOpacity = 0.65;
        starTargetRotZ = 0;
      }
    }

    // 4. UPDATE STREAM PROGRESS HUD
    const hudFill = document.getElementById('hud-progress');
    const hudSection = document.getElementById('hud-section-name');
    if (hudFill && hudSection) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
      hudFill.style.transform = `scaleX(${scrollPercent})`;

      if (scrollY < windowH * 0.7) {
        hudSection.textContent = '00 / HOME';
      } else if (manifesto && manifesto.getBoundingClientRect().top <= windowH * 0.5 && (!projHeader || projHeader.getBoundingClientRect().top > windowH * 0.5)) {
        hudSection.textContent = '01 / ABOUT';
      } else if (contact && contact.getBoundingClientRect().top <= windowH * 0.5) {
        hudSection.textContent = '03 / CONTACT';
      } else {
        hudSection.textContent = '02 / PROJECTS';
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}


/* ==========================================================================
   05. NAVIGATION TRACKING & NAV-DOT
   ========================================================================== */
function initNavTracking() {
  const navDot = document.getElementById('nav-dot');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = ['hero', 'manifesto', 'projHeader', 'contact'];

  function updateDot(targetEl) {
    if (!targetEl || !navDot) return;
    const r = targetEl.getBoundingClientRect();
    navDot.style.left = `${r.left + r.width / 2 - 2}px`;
    navDot.style.top = `${r.bottom + 6}px`;
    navDot.style.opacity = '1';
  }

  const activeLink = document.querySelector('.nav-links a.on');
  if (activeLink) updateDot(activeLink);

  // Smooth scroll click listeners
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').replace('#', '');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const navHeight = document.getElementById('nav')?.offsetHeight || 70;
        const targetPos = targetEl.getBoundingClientRect().top + window.scrollY - (targetId === 'hero' ? 0 : navHeight - 10);
        window.scrollTo({
          top: Math.max(0, targetPos),
          behavior: 'smooth'
        });
        history.pushState(null, '', `#${targetId}`);
      }
    });
  });

  const heroArrow = document.getElementById('hero-arrow-btn') || document.querySelector('.hero-arrow');
  if (heroArrow) {
    heroArrow.addEventListener('click', () => {
      const manifesto = document.getElementById('manifesto');
      if (manifesto) {
        const navHeight = document.getElementById('nav')?.offsetHeight || 70;
        window.scrollTo({
          top: manifesto.offsetTop - navHeight + 10,
          behavior: 'smooth'
        });
      }
    });
  }

  window.addEventListener('scroll', () => {
    let current = 'hero';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top;
        if (top <= window.innerHeight * 0.5) current = id;
      }
    });

    navLinks.forEach(link => {
      if (link.dataset.target === current) {
        link.classList.add('on');
        updateDot(link);
      } else {
        link.classList.remove('on');
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   06. EMAIL CLIPBOARD COPY
   ========================================================================== */
function initEmailClipboard() {
  const mailLink = document.getElementById('contact-mail');
  const toast = document.getElementById('copy-toast');

  if (!mailLink || !toast) return;

  mailLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = mailLink.textContent.trim();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(triggerToast).catch(fallback);
    } else {
      fallback();
    }

    function triggerToast() {
      toast.classList.remove('on');
      void toast.offsetWidth; // trigger reflow
      toast.classList.add('on');
      setTimeout(() => toast.classList.remove('on'), 2000);
    }

    function fallback() {
      const temp = document.createElement('input');
      temp.value = email;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      triggerToast();
    }
  });
}

/* ==========================================================================
   07. CASE STUDY MODAL SYSTEM
   ========================================================================== */
const projectData = {
  nuclyo_splash: {
    title: 'Nuclyo — Smart Environmental App Splash Screen',
    category: 'APPLICATION SPLASH SCREEN · AFTER EFFECTS & LOTTIE · 2026',
    client: 'Nuclyo CleanTech',
    timeline: '4 Weeks',
    role: 'Lead Motion Designer & UX Architect',
    tools: 'After Effects, Lottie, Figma, Cinema 4D',
    video: './assets/nuclyo-splash-screen.mp4',
    image: './assets/nuclyo-logo.png',
    p1: 'Crafted a bespoke vector splash screen animation designed for the Nuclyo smart clean-tech mobile ecosystem. Organic fluid motion transitions seamlessly into biometric authentication with zero cold-start delay.',
    p2: 'Engineered sub-600ms cold-start execution curves tested across 60Hz and 120Hz ProMotion screens with zero frame jitter, reducing perceived app launch latency by over 45%.',
    metrics: '60 FPS Vector Precision · 773 KB Web Payload · 4.9★ Launch Satisfaction'
  },
  nuclyo_loader: {
    title: 'Nuclyo — Vector Brand Logo Loader Animation',
    category: 'LOADER ANIMATION · LOTTIE & KINETIC VECTOR · 2026',
    client: 'Nuclyo CleanTech',
    timeline: '3 Weeks',
    role: 'Motion UX Designer',
    tools: 'After Effects, Bodymovin, Lottie, Figma',
    video: './assets/nuclyo-loader-anim.mp4',
    image: './assets/nuclyo-loader-poster.png',
    p1: 'Designed and animated a rhythmic branded vector loader that replaces generic circular spinners. The motion language communicates encrypted sensor handshakes, particle packet validation, and dynamic air health telemetry.',
    p2: 'Exported into ultra-compact Lottie JSON (173 KB video stream preview), enabling instant client-side rendering, dynamic theme coloration, and seamless scalability from smartwatch widgets to mobile apps.',
    metrics: '173 KB Stream Payload · 100% Vector Scalable · 0% CPU Handshake Overhead'
  },
  rydyt_loader: {
    title: 'RYDYT — Outline Path Loader & Micro-Interaction',
    category: 'MICRO-INTERACTION · AFTER EFFECTS & LOTTIE · 2025',
    client: 'RYDYT Mobility',
    timeline: '2 Weeks',
    role: 'Motion UX Designer',
    tools: 'After Effects, Lottie JSON, SVG Vectors, Figma',
    video: './assets/rydyt-outline-loader.mp4',
    image: './assets/rydyt-logo.png',
    p1: 'Minimalist precision outline loader tracing the contours of the RYDYT badge. Engineered as a responsive micro-interaction for in-app telemetry loading, GPS lock states, and bike Bluetooth pairing.',
    p2: 'Mathematically continuous stroke-offset trim paths prevent looping stutter, maintaining 60 FPS fluidity even under low battery or high CPU usage.',
    metrics: '183 KB Web Payload · Infinite Loop Synchronization · Sub-20ms Frame Budget'
  },
  rydyt_compass: {
    title: 'RYDYT — Dynamic Compass Navigation & Cockpit HUD Motion',
    category: 'INTERACTIVE HUD MOTION · UI/UX & MOTION DESIGN · 2025',
    client: 'RYDYT Mobility',
    timeline: '4 Weeks',
    role: 'UI/UX & Motion Systems Designer',
    tools: 'After Effects, Figma, Principle, Mobile HUD Tokens',
    video: './assets/rydyt-compass-anim.mp4',
    image: './assets/rydyt-logo.png',
    p1: 'Real-time directional compass HUD animation designed for motorcycle handlebar cockpits. Smooth rotational kinematics and dynamic waypoint pulse keep riders oriented at highway speeds without distraction.',
    p2: 'Tested extensively under sunlight glare and dark night conditions with ambient luminosity contrast scaling for zero eye fatigue.',
    metrics: 'Sub-1s Glanceable Readout · High-Contrast Night Mode · 60 FPS Gyroscope Response'
  },
  nuclyo_bluetooth: {
    title: 'Nuclyo — Bluetooth Wireless Device Pairing Animation',
    category: 'IOT DEVICE PAIRING · AFTER EFFECTS & MOTION UX · 2025',
    client: 'Nuclyo CleanTech',
    timeline: '3 Weeks',
    role: 'Motion UX Designer',
    tools: 'After Effects, Lottie, Figma, Micro-Interactions',
    video: './assets/nuclyo-bluetooth-anim.mp4',
    image: './assets/nuclyo-logo.png',
    p1: 'Fluid wireless pulse and radar wave animation communicating IoT hardware synchronization. Reassures users during device discovery and provides unmistakable visual feedback upon connection.',
    p2: 'Harmonious radial bezier oscillations guide the user through detection, handshake, and confirmed connection with warm haptic accompaniment.',
    metrics: 'Sub-1.2s Discovery Feedback · Seamless Radar Loop · 94% Pairing Success Clarity'
  },
  rydyt_branding: {
    title: 'RYDYT — Brand Motion Identity & Visual System',
    category: 'BRAND MOTION IDENTITY · AFTER EFFECTS & 3D MOTION · 2025',
    client: 'RYDYT Mobility Ecosystem',
    timeline: '4 Weeks',
    role: 'Lead Brand Motion Designer & Creative Director',
    tools: 'After Effects, Illustrator, Cinema 4D, Premiere Pro',
    video: './assets/rydyt-branding.mp4',
    image: './assets/rydyt-branding-poster.png',
    p1: 'Developed a comprehensive kinetic brand identity package for RYDYT\'s next-generation smart electric two-wheeler ecosystem. Merged aerodynamic automotive aesthetic principles with bold dimensional typography to express energy, momentum, and urban freedom.',
    p2: 'Engineered fluid brand reveals, spatial logo morphing, and synchronized motion guidelines for global campaign launches, mobile app openers, and digital showroom displays.',
    metrics: '14.7s Full Cinematic Motion Package · 60 FPS Fluid Kinetic Cadence · 100% Custom Bezier Choreography'
  },
  born_creative: {
    title: 'Born Creative — Dynamic Studio Brand Motion Intro',
    category: 'BRAND MOTION DESIGN · AFTER EFFECTS & 3D MOTION · 2025',
    client: 'Born Creative Studio',
    timeline: '3 Weeks',
    role: 'Motion Identity Designer & 3D Animator',
    tools: 'After Effects, Cinema 4D, Figma, Premiere Pro',
    video: './assets/born-creative-intro.mp4',
    image: './assets/designer-avatar.jpg',
    p1: 'Developed a bold kinetic brand reveal and motion identity package for Born Creative. Merges typographic momentum with sharp dimensional transitions, establishing an electric first impression across digital showcases and reel openers.',
    p2: 'Custom bezier acceleration curves and spatial camera transitions ensure that the reveal carries weight, rhythm, and instant visual impact on both social vertical reels and widescreen formats.',
    metrics: '60 FPS Motion Cadence · 400 KB High-Efficiency Web Stream · High Retention Opener'
  }
};

function initCaseStudyModal() {
  const modal = document.getElementById('case-modal');
  const closeBtn = document.getElementById('case-modal-close');
  const body = document.getElementById('case-modal-body');
  const triggers = document.querySelectorAll('.open-case-study');

  if (!modal || !body) return;

  function open(id) {
    const data = projectData[id];
    if (!data) return;

    body.innerHTML = `
      <div class="modal-hero-wrap">
        ${data.video ? `
          <video src="${data.video}" autoplay loop muted playsinline controls style="max-width: 100%; max-height: 58vh; width: auto; height: auto; object-fit: contain; background: #000; border-radius: 4px;"></video>
        ` : `
          <img src="${data.image}" alt="${data.title}">
        `}
      </div>
      <div class="modal-kicker">${data.category}</div>
      <h2 class="modal-heading">${data.title}</h2>
      
      <div class="modal-grid-meta">
        <div class="meta-field">
          <span class="m-lbl">Client</span>
          <span class="m-val">${data.client}</span>
        </div>
        <div class="meta-field">
          <span class="m-lbl">Timeline</span>
          <span class="m-val">${data.timeline}</span>
        </div>
        <div class="meta-field">
          <span class="m-lbl">Role</span>
          <span class="m-val">${data.role}</span>
        </div>
        <div class="meta-field">
          <span class="m-lbl">Tools</span>
          <span class="m-val">${data.tools}</span>
        </div>
      </div>

      <p class="modal-section-p">${data.p1}</p>
      <p class="modal-section-p">${data.p2}</p>
      <p class="modal-section-p" style="color: var(--em); font-weight: 600;">✦ Key Metrics: ${data.metrics}</p>
    `;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
    const video = body.querySelector('video');
    if (video) video.pause();
  }

  triggers.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const p = card.dataset.project;
      if (p) open(p);
    });
  });

  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      close();
    }
  });
}

/* ==========================================================================
   08. SMOOTH SCROLL CONTENT LOADER & REVEALS
   ========================================================================== */
function initScrollContentLoader() {
  const reveals = document.querySelectorAll('.scroll-reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}
