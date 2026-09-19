// Three.js ambient background: starfield + time-tunnel rings + nebula glow.
// The canvas sits fixed behind everything (see #space-canvas in CSS).
//
// Sync points with the rest of the page:
// - `portfolio-scroll` (detail 0..1): flies the camera forward through the tunnel.
// - `portfolio-theme` (detail 'dark' | 'light'): re-tints stars/rings/nebula.
// - prefers-reduced-motion: renders a single static frame, no loop.
// - WebGL unavailable: adds .webgl-fallback to <html> (CSS hides the canvas).

import * as THREE from 'three';

const PALETTES = {
  dark: {
    star: new THREE.Color('#d7f2f6'),
    starDim: new THREE.Color('#5f8b95'),
    ring: new THREE.Color('#55d9ea'),
    nebulaA: new THREE.Color('#0e3a44'),
    nebulaB: new THREE.Color('#123f33'),
    fog: new THREE.Color('#040b11')
  },
  light: {
    star: new THREE.Color('#4c6b75'),
    starDim: new THREE.Color('#9db8c0'),
    ring: new THREE.Color('#007c92'),
    nebulaA: new THREE.Color('#cfe8ec'),
    nebulaB: new THREE.Color('#d9efe6'),
    fog: new THREE.Color('#edf5f7')
  }
};

function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,.55)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function initScene() {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    document.documentElement.classList.add('webgl-fallback');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // transparent — CSS gradient shows through

  const scene = new THREE.Scene();
  const palette = PALETTES.dark;
  scene.fog = new THREE.FogExp2(palette.fog.clone(), 0.016);

  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 400);
  camera.position.set(0, 0, 0);

  const glowTexture = makeGlowTexture();

  // --- Starfield -----------------------------------------------------------
  const STAR_COUNT = 1300;
  const starPositions = new Float32Array(STAR_COUNT * 3);
  const starColors = new Float32Array(STAR_COUNT * 3);
  const tmpColor = new THREE.Color();
  for (let i = 0; i < STAR_COUNT; i++) {
    // Spread stars in a wide box ahead of / around the camera.
    starPositions[i * 3] = (Math.random() - 0.5) * 220;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 140;
    starPositions[i * 3 + 2] = 20 - Math.random() * 260;
    tmpColor.copy(palette.star).lerp(palette.starDim, Math.random() * 0.85);
    starColors[i * 3] = tmpColor.r;
    starColors[i * 3 + 1] = tmpColor.g;
    starColors[i * 3 + 2] = tmpColor.b;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMaterial = new THREE.PointsMaterial({
    size: 1.6,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // --- Time-tunnel rings ----------------------------------------------------
  const RING_COUNT = 16;
  const RING_SPACING = 16;
  const ringGroup = new THREE.Group();
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: palette.ring.clone(),
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const rings = [];
  for (let i = 0; i < RING_COUNT; i++) {
    const radius = 14 + (i % 4) * 7;
    const geometry = new THREE.TorusGeometry(radius, 0.07, 8, 96);
    const ring = new THREE.Mesh(geometry, ringMaterial.clone());
    ring.position.z = -i * RING_SPACING;
    ring.position.x = (Math.random() - 0.5) * 6;
    ring.position.y = (Math.random() - 0.5) * 6;
    ring.userData.spin = (Math.random() - 0.5) * 0.12;
    ringGroup.add(ring);
    rings.push(ring);
  }
  scene.add(ringGroup);

  // --- Nebula glow sprites ---------------------------------------------------
  const nebulaMaterial = (color) =>
    new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  const nebulae = [];
  const nebulaSpecs = [
    { color: palette.nebulaA, scale: 120, pos: [-55, 28, -150] },
    { color: palette.nebulaB, scale: 150, pos: [60, -30, -190] },
    { color: palette.nebulaA, scale: 90, pos: [10, 40, -110] }
  ];
  nebulaSpecs.forEach((spec) => {
    const sprite = new THREE.Sprite(nebulaMaterial(spec.color.clone()));
    sprite.scale.setScalar(spec.scale);
    sprite.position.set(...spec.pos);
    scene.add(sprite);
    nebulae.push(sprite);
  });

  // --- Theme tinting ---------------------------------------------------------
  // NOTE: theme.js dispatches `portfolio-theme` during init, before this module
  // attaches its listener — so read the live theme from the DOM as the source
  // of truth for the initial tint.
  let tintTarget = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  const tintMix = { value: tintTarget === 'dark' ? 1 : 0 }; // 1 = dark, 0 = light
  const from = PALETTES.dark;
  const to = PALETTES.light;
  function applyTint() {
    const m = tintMix.value;
    starMaterial.color.setRGB(1, 1, 1); // vertex colors carry the tint
    const star = new THREE.Color().copy(from.star).lerp(to.star, 1 - m);
    const starDim = new THREE.Color().copy(from.starDim).lerp(to.starDim, 1 - m);
    const positions = starGeometry.getAttribute('color');
    for (let i = 0; i < STAR_COUNT; i++) {
      tmpColor.copy(star).lerp(starDim, (i * 7919 % 100) / 100);
      positions.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
    }
    positions.needsUpdate = true;
    ringMaterial.color.copy(from.ring).lerp(to.ring, 1 - m);
    rings.forEach((ring) => ring.material.color.copy(ringMaterial.color));
    nebulae.forEach((sprite, i) => {
      const base = i % 2 === 0 ? 'nebulaA' : 'nebulaB';
      sprite.material.color.copy(from[base]).lerp(to[base], 1 - m);
      sprite.material.opacity = m > 0.5 ? 0.16 : 0.22;
    });
    scene.fog.color.copy(from.fog).lerp(to.fog, 1 - m);
  }
  window.addEventListener('portfolio-theme', (event) => {
    tintTarget = event.detail === 'light' ? 'light' : 'dark';
  });

  // --- Scroll flight ----------------------------------------------------------
  let scrollTarget = 0;
  let scrollCurrent = 0;
  const TUNNEL_LENGTH = 60;
  window.addEventListener('portfolio-scroll', (event) => {
    scrollTarget = Math.max(0, Math.min(1, event.detail));
  });

  // --- Mouse parallax ---------------------------------------------------------
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (event) => {
    mouse.x = (event.clientX / innerWidth - 0.5) * 2;
    mouse.y = (event.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  addEventListener('resize', resize, { passive: true });
  resize();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // Ease scroll + tint toward their targets.
    scrollCurrent += (scrollTarget - scrollCurrent) * Math.min(1, dt * 3.2);
    const tintGoal = tintTarget === 'dark' ? 1 : 0;
    if (Math.abs(tintMix.value - tintGoal) > 0.001) {
      tintMix.value += (tintGoal - tintMix.value) * Math.min(1, dt * 3);
      applyTint();
    }

    // Camera glides forward through the tunnel as the user flips cards.
    const baseZ = 8 - scrollCurrent * TUNNEL_LENGTH;
    camera.position.z += (baseZ - camera.position.z) * Math.min(1, dt * 3.2);
    camera.position.x += (mouse.x * 3.2 - camera.position.x) * Math.min(1, dt * 2);
    camera.position.y += (-mouse.y * 2.2 - camera.position.y) * Math.min(1, dt * 2);
    camera.lookAt(camera.position.x * 0.4, camera.position.y * 0.4, camera.position.z - 30);

    // Rings drift toward the camera and wrap around, giving constant motion.
    rings.forEach((ring) => {
      ring.position.z += dt * 5;
      ring.rotation.z += ring.userData.spin * dt;
      if (ring.position.z > camera.position.z + 12) {
        ring.position.z -= RING_COUNT * RING_SPACING;
      }
      const depthFade = THREE.MathUtils.clamp(1 - Math.abs(ring.position.z - camera.position.z + 60) / 140, 0.12, 1);
      ring.material.opacity = 0.28 * depthFade;
    });

    stars.rotation.z = t * 0.004;
    stars.position.y = Math.sin(t * 0.12) * 1.5;

    renderer.render(scene, camera);
  }

  applyTint();
  if (reduced) {
    frame(); // single static frame
  } else {
    renderer.setAnimationLoop(frame);
  }
}
