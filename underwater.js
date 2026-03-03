/**
 * underwater.js — Rich, subtle underwater background scene for Mr Fish
 * Generates: light rays, bg silhouette fish, foreground fish,
 *            falling food/marine snow, seaweed, seaweed bubbles.
 * Everything lives in #underwater-scene (fixed, z-index 0, pointer-events none).
 */
(function () {
  'use strict';

  // ── Respect reduced-motion preference ──────────────────────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ── Wait for DOM ───────────────────────────────────────────────────────────
  function init() {
    const scene = document.getElementById('underwater-scene');
    if (!scene) return;

    buildLightRays(scene);
    buildSeaweed(scene);
    buildBgFish(scene);
    buildForegroundFish(scene);
    buildMarineSnow(scene);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function el(tag, classes, styles) {
    const d = document.createElement(tag);
    if (classes) d.className = classes;
    if (styles)  Object.assign(d.style, styles);
    d.setAttribute('aria-hidden', 'true');
    return d;
  }

  // ============================================================
  // 1. LIGHT RAYS
  // ============================================================
  function buildLightRays(scene) {
    const container = el('div', 'uw-rays');
    scene.appendChild(container);

    // 8 rays — varying angle, width, opacity, sway period
    const configs = [
      { angle: -38, width: 55,  opacity: 0.048, dur: 11.0, delay: 0    },
      { angle: -24, width: 80,  opacity: 0.034, dur:  8.5, delay: -3.2 },
      { angle: -12, width: 60,  opacity: 0.050, dur: 12.5, delay: -1.5 },
      { angle:   0, width: 65,  opacity: 0.026, dur:  9.5, delay: -5.0 },
      { angle:  10, width: 65,  opacity: 0.042, dur: 10.5, delay: -2.7 },
      { angle:  22, width: 75,  opacity: 0.036, dur: 13.0, delay: -4.1 },
      { angle:  34, width: 50,  opacity: 0.040, dur:  8.0, delay: -6.3 },
      { angle:  46, width: 40,  opacity: 0.028, dur: 11.8, delay: -0.8 },
    ];

    configs.forEach(cfg => {
      const r = el('div', 'uw-ray');
      Object.assign(r.style, {
        width:           cfg.width + 'px',
        opacity:         cfg.opacity,
        '--ray-angle':   cfg.angle + 'deg',
        animationDuration:  cfg.dur + 's',
        animationDelay:    cfg.delay + 's',
      });
      container.appendChild(r);
    });
  }

  // ============================================================
  // 2. SEAWEED  (bottom of viewport)
  // ============================================================
  function buildSeaweed(scene) {
    const container = el('div', 'uw-seaweed-layer');
    scene.appendChild(container);

    const COUNT = 9;
    // Spread them unevenly across the bottom
    const xPositions = [3, 9, 18, 29, 41, 55, 67, 79, 91]; // % from left

    for (let i = 0; i < COUNT; i++) {
      const stalk = buildSeaweedStalk(xPositions[i], i);
      container.appendChild(stalk);
    }
  }

  function buildSeaweedStalk(xPct, idx) {
    const height   = randInt(55, 110); // px
    const segments = randInt(3, 6);
    const dur      = rand(3.5, 7.0);
    const delay    = rand(-5, 0);
    const hue      = randInt(155, 185); // teal-green range

    const wrapper = el('div', 'uw-seaweed');
    Object.assign(wrapper.style, {
      left:   xPct + '%',
      height: height + 'px',
      '--sw-dur':   dur + 's',
      '--sw-delay': delay + 's',
      '--sw-hue':   hue,
    });

    // Build segments as stacked divs
    for (let s = 0; s < segments; s++) {
      const seg = el('div', 'uw-sw-seg');
      const isLeft = s % 2 === 0;
      Object.assign(seg.style, {
        height:       Math.round(height / segments) + 'px',
        borderRadius: isLeft ? '50% 0 0 50%' : '0 50% 50% 0',
        marginLeft:   isLeft ? '-6px' : '0',
      });
      wrapper.appendChild(seg);
    }

    // Tip bubble emitter
    const emitter = el('div', 'uw-sw-bubbles');
    wrapper.appendChild(emitter);

    // Schedule bubble spawning from this stalk
    scheduleStemBubble(emitter, xPct, idx);

    return wrapper;
  }

  function scheduleStemBubble(emitter, xPct, idx) {
    // Each seaweed stalk emits a tiny bubble every 8–20 seconds
    const delay = rand(2000 + idx * 1200, 8000 + idx * 800);

    setTimeout(function spawnAndReschedule() {
      spawnStemBubble(emitter);
      setTimeout(spawnAndReschedule, rand(8000, 20000));
    }, delay);
  }

  function spawnStemBubble(emitter) {
    const size = rand(3, 7);
    const dur  = rand(4, 9);
    const b    = el('div', 'uw-stem-bubble');
    Object.assign(b.style, {
      width:    size + 'px',
      height:   size + 'px',
      '--sb-dur': dur + 's',
      '--sb-drift': (rand(-15, 15)) + 'px',
    });
    emitter.appendChild(b);
    setTimeout(() => b.remove(), dur * 1000 + 500);
  }

  // ============================================================
  // 3. BACKGROUND SILHOUETTE FISH  (large, very dim, slow)
  // ============================================================
  function buildBgFish(scene) {
    const container = el('div', 'uw-bgfish-layer');
    scene.appendChild(container);

    const COUNT = 5;
    for (let i = 0; i < COUNT; i++) {
      spawnBgFish(container, i * 8000); // stagger initial spawns
    }
  }

  function spawnBgFish(container, initialDelay) {
    setTimeout(function loop() {
      const goRight = Math.random() > 0.5;
      const size    = randInt(45, 80); // px wide
      const yPct    = rand(10, 65);   // % from top (upper 2/3 only)
      const dur     = rand(28, 55);   // seconds to cross
      const opacity = rand(0.04, 0.08);

      const fish = el('div', 'uw-bgfish');
      Object.assign(fish.style, {
        width:       size + 'px',
        height:      Math.round(size * 0.55) + 'px',
        top:         yPct + '%',
        opacity:     opacity,
        left:        goRight ? '-120px' : 'calc(100vw + 120px)',
        '--bgf-dur': dur + 's',
        '--bgf-dir': goRight ? '1' : '-1',
      });

      container.appendChild(fish);

      // After it crosses the screen, remove and respawn
      setTimeout(() => {
        fish.remove();
        loop();
      }, dur * 1000 + 500);

    }, initialDelay);
  }

  // ============================================================
  // 4. FOREGROUND SMALL FISH
  // ============================================================
  // Color palette — muted blues, teals, soft whites
  const FG_FISH_COLORS = [
    { body: 'rgba(120,200,220,0.75)', fin: 'rgba(80,160,185,0.8)',  stripe: 'rgba(255,255,255,0.45)' },
    { body: 'rgba(100,170,210,0.70)', fin: 'rgba(60,130,180,0.75)', stripe: 'rgba(200,235,255,0.40)' },
    { body: 'rgba(160,220,215,0.65)', fin: 'rgba(100,185,178,0.72)',stripe: 'rgba(255,255,255,0.35)' },
    { body: 'rgba(140,185,225,0.68)', fin: 'rgba(90,145,195,0.70)', stripe: 'rgba(210,230,255,0.38)' },
    { body: 'rgba(180,210,200,0.60)', fin: 'rgba(120,170,160,0.68)',stripe: 'rgba(255,255,255,0.32)' },
  ];

  function buildForegroundFish(scene) {
    const container = el('div', 'uw-fgfish-layer');
    scene.appendChild(container);

    const COUNT = 6;
    for (let i = 0; i < COUNT; i++) {
      spawnFgFish(container, i * 3500);
    }
  }

  function spawnFgFish(container, initialDelay) {
    setTimeout(function loop() {
      const goRight = Math.random() > 0.5;
      const size    = rand(14, 26);       // px wide (body)
      const yPct    = rand(15, 82);       // % from top
      const dur     = rand(12, 22);       // seconds to cross
      const color   = pick(FG_FISH_COLORS);
      const bobAmt  = rand(8, 20);        // px vertical bob
      const bobDur  = rand(2.5, 4.5);     // seconds per bob cycle
      const wobble  = rand(-0.08, 0.08);  // slight tilt
      const opacity = rand(0.20, 0.32);

      // Occasionally dip toward bottom 1/3 (simulate eating food)
      const willDip = Math.random() > 0.6;
      const dipDur  = willDip ? rand(dur * 0.25, dur * 0.45) : 0;

      const fish = buildFgFishEl(size, color, goRight, bobAmt, bobDur, dur);
      Object.assign(fish.style, {
        top:     yPct + 'vh',
        left:    goRight ? '-80px' : 'calc(100vw + 80px)',
        opacity: opacity,
        '--fgf-dur':    dur + 's',
        '--fgf-dir':    goRight ? '1' : '-1',
        '--fgf-bob':    bobAmt + 'px',
        '--fgf-bobdur': bobDur + 's',
      });

      container.appendChild(fish);

      setTimeout(() => {
        fish.remove();
        loop();
      }, dur * 1000 + 1000);
    }, initialDelay);
  }

  function buildFgFishEl(size, color, goRight, bobAmt, bobDur, dur) {
    // Wrapper handles horizontal travel
    const wrap = el('div', 'uw-fgfish-wrap');

    // Inner div handles bob
    const bob = el('div', 'uw-fgfish-bob');

    // Fish body
    const body = el('div', 'uw-fgfish-body');
    Object.assign(body.style, {
      width:      size + 'px',
      height:     Math.round(size * 0.62) + 'px',
      background: color.body,
    });

    // Tail
    const tail = el('div', 'uw-fgfish-tail');
    const tailH = Math.round(size * 0.62 * 0.45);
    Object.assign(tail.style, {
      borderTopWidth:    tailH + 'px',
      borderBottomWidth: tailH + 'px',
      borderRightWidth:  Math.round(size * 0.32) + 'px',
      borderRightColor:  color.fin,
    });

    // Top fin
    const fin = el('div', 'uw-fgfish-fin');
    Object.assign(fin.style, {
      width:      Math.round(size * 0.38) + 'px',
      height:     Math.round(size * 0.28) + 'px',
      background: color.fin,
      left:       Math.round(size * 0.25) + 'px',
    });

    // Eye
    const eye = el('div', 'uw-fgfish-eye');
    const eyeSize = Math.max(3, Math.round(size * 0.14));
    Object.assign(eye.style, {
      width:  eyeSize + 'px',
      height: eyeSize + 'px',
      right:  Math.round(size * 0.14) + 'px',
      top:    Math.round(size * 0.62 * 0.22) + 'px',
    });

    body.appendChild(fin);
    body.appendChild(tail);
    body.appendChild(eye);
    bob.appendChild(body);
    wrap.appendChild(bob);

    // Mirror for direction
    if (!goRight) {
      body.style.transform = 'scaleX(-1)';
    }

    return wrap;
  }

  // ============================================================
  // 5. MARINE SNOW / FALLING FOOD PARTICLES
  // ============================================================
  function buildMarineSnow(scene) {
    const container = el('div', 'uw-snow-layer');
    scene.appendChild(container);

    const COUNT = 18;
    for (let i = 0; i < COUNT; i++) {
      spawnSnowParticle(container, rand(0, 12000)); // stagger start
    }
  }

  function spawnSnowParticle(container, initialDelay) {
    setTimeout(function loop() {
      const size  = rand(1.5, 4);
      const x     = rand(1, 99);      // % from left
      const dur   = rand(10, 20);     // seconds to fall
      const drift = rand(-25, 25);    // px horizontal drift
      const opacity = rand(0.22, 0.42);
      // Slight warm or cool tint
      const isWarm = Math.random() > 0.6;
      const bg    = isWarm ? 'rgba(255,240,210,0.9)' : 'rgba(210,235,255,0.9)';

      const p = el('div', 'uw-snow');
      Object.assign(p.style, {
        width:    size + 'px',
        height:   size + 'px',
        left:     x + '%',
        opacity:  opacity,
        background: bg,
        '--snow-dur':   dur + 's',
        '--snow-drift': drift + 'px',
      });

      container.appendChild(p);

      setTimeout(() => {
        p.remove();
        loop(); // respawn from top with new random params
      }, dur * 1000 + 500);
    }, initialDelay);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
