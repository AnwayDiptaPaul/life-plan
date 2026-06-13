/* ═══════════════════════════════════════════════════════════════
   SPRINT OS — animate.js
   3D dynamic animation layer — progressive enhancement only.
   Works on any page. Never breaks logic or accessibility.
   Respects prefers-reduced-motion.
═══════════════════════════════════════════════════════════════ */

(function SprintAnimate() {
  'use strict';

  /* ── REDUCED MOTION GATE ─────────────────────────────────── */
  const NO_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── CSS VARS INJECTION ──────────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.id = 'sprint-animate-styles';
  styleEl.textContent = `
    /* ── CUSTOM CURSOR ─────────────────────────────────────── */
    body { cursor: none !important; }
    a, button, [onclick], .card.lift, .check-item, .habit-row,
    .course-row, .phase-head, .period-head, .math-subject-head,
    .ctrl, .nav-link, .btn, .sched-row {
      cursor: none !important;
    }
    #sa-cursor {
      position: fixed; pointer-events: none; z-index: 99999;
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--green);
      transform: translate(-50%, -50%);
      transition: transform 0.08s ease, background 0.15s ease, width 0.15s ease, height 0.15s ease;
      mix-blend-mode: multiply;
      will-change: transform, left, top;
    }
    #sa-cursor-ring {
      position: fixed; pointer-events: none; z-index: 99998;
      width: 36px; height: 36px; border-radius: 50%;
      border: 1.5px solid var(--green);
      transform: translate(-50%, -50%);
      opacity: 0.5;
      transition: width 0.22s ease, height 0.22s ease, opacity 0.22s ease,
                  left 0.1s linear, top 0.1s linear, border-color 0.18s ease;
      will-change: transform, left, top;
    }
    body.cursor-hover #sa-cursor {
      width: 20px; height: 20px;
      background: var(--amber);
    }
    body.cursor-hover #sa-cursor-ring {
      width: 54px; height: 54px;
      border-color: var(--amber);
      opacity: 0.35;
    }
    body.cursor-click #sa-cursor {
      width: 7px; height: 7px;
      background: var(--red);
      transition: transform 0.04s ease, width 0.04s ease, height 0.04s ease;
    }
    body.cursor-click #sa-cursor-ring {
      width: 64px; height: 64px;
      opacity: 0.1;
    }

    /* ── RIPPLE ────────────────────────────────────────────── */
    .sa-ripple-host { position: relative; overflow: hidden; }
    .sa-ripple {
      position: absolute; border-radius: 50%;
      background: rgba(13, 122, 95, 0.18);
      transform: scale(0);
      animation: sa-ripple-anim 0.55s ease-out forwards;
      pointer-events: none; z-index: 0;
    }
    @keyframes sa-ripple-anim {
      to { transform: scale(4); opacity: 0; }
    }

    /* ── 3D CARD TILT ──────────────────────────────────────── */
    .card.lift {
      transform-style: preserve-3d;
      transform: perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0);
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      will-change: transform;
    }
    .card.lift:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08) !important;
    }

    /* ── 3D CD CARD TILT ───────────────────────────────────── */
    .cd-card {
      transform-style: preserve-3d;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      will-change: transform;
    }

    /* ── PAGE LOAD SEQUENCE ────────────────────────────────── */
    .sa-stagger { opacity: 0; transform: translateY(18px); }
    .sa-stagger.sa-visible {
      animation: sa-stagger-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    @keyframes sa-stagger-in {
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── CLICK BURST ───────────────────────────────────────── */
    .sa-burst-particle {
      position: fixed; pointer-events: none; z-index: 99997;
      border-radius: 50%;
      animation: sa-burst-fly 0.5s ease-out forwards;
    }
    @keyframes sa-burst-fly {
      0%   { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(var(--bx), var(--by)) scale(0); opacity: 0; }
    }

    /* ── SCROLL PROGRESS BAR ───────────────────────────────── */
    #sa-scroll-bar {
      position: fixed; top: 0; left: 0; z-index: 99996;
      height: 3px;
      background: linear-gradient(90deg, var(--green), var(--teal), var(--amber));
      width: 0%;
      transition: width 0.08s linear;
      pointer-events: none;
    }

    /* ── NAV MAGNETIC UNDERLINE ────────────────────────────── */
    .nav-link {
      transition: color 0.15s, border-bottom-color 0.15s, transform 0.12s ease !important;
    }
    .nav-link:hover { transform: translateY(-1px); }

    /* ── MILESTONE / CHECK ITEM BOUNCE ─────────────────────── */
    .check-item.sa-check-anim { animation: sa-check-bounce 0.38s cubic-bezier(0.34, 1.6, 0.64, 1); }
    @keyframes sa-check-bounce {
      0%   { transform: scale(1); }
      40%  { transform: scale(0.96) translateX(-3px); }
      70%  { transform: scale(1.025); }
      100% { transform: scale(1); }
    }

    /* ── HABIT ROW CHECK BOUNCE ─────────────────────────────── */
    .habit-row.sa-check-anim { animation: sa-habit-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes sa-habit-pop {
      0%   { transform: scale(1) translateX(0); }
      50%  { transform: scale(1.02) translateX(4px); }
      100% { transform: scale(1) translateX(0); }
    }

    /* ── STAT VALUE COUNT-UP FLASH ──────────────────────────── */
    .sa-value-flash { animation: sa-value-flash-anim 0.4s ease-out; }
    @keyframes sa-value-flash-anim {
      0%   { filter: brightness(1.8); }
      100% { filter: brightness(1); }
    }

    /* ── TIMELINE NODE HOVER ────────────────────────────────── */
    .tl-node {
      transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 0.16s ease !important;
    }
    .tl-item:hover .tl-node {
      transform: scale(1.35) !important;
      box-shadow: 0 4px 16px rgba(13, 122, 95, 0.3) !important;
    }

    /* ── BUTTON PRESS ───────────────────────────────────────── */
    .btn { transition: all 0.13s ease !important; }
    .btn:active { transform: scale(0.96) translateY(1px) !important; }
    .ctrl:active { transform: scale(0.97) !important; }

    /* ── PHASE / ACCORDION REVEAL ───────────────────────────── */
    .phase-body.open, .period-body.open, .math-chapters.open {
      animation: sa-accordion-open 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes sa-accordion-open {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── BACKGROUND PARTICLE CANVAS ─────────────────────────── */
    #sa-bg-canvas {
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none; z-index: 0;
      opacity: 0.45;
    }

    /* ── MODAL ENTRANCE ─────────────────────────────────────── */
    #ielts-modal > div {
      animation: sa-modal-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes sa-modal-in {
      from { opacity: 0; transform: scale(0.92) translateY(16px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* ── SCHED ROW REVEAL ───────────────────────────────────── */
    .sched-row { transition: transform 0.12s ease, background 0.1s ease, border-color 0.1s ease !important; }

    /* ── SAVINGS GAUGE PULSE ────────────────────────────────── */
    .g-fill { filter: drop-shadow(0 0 4px rgba(13,122,95,0.3)); }

    /* ── SECTION HEAD LINE ANIMATION ───────────────────────── */
    .sec-line { transition: transform 0.6s ease; transform-origin: left; }

    /* ── REDUCED MOTION OVERRIDES ──────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .sa-stagger, .sa-ripple, .sa-burst-particle,
      .check-item.sa-check-anim, .habit-row.sa-check-anim,
      .card.lift, .cd-card { animation: none !important; transition: none !important; }
      #sa-cursor, #sa-cursor-ring, #sa-bg-canvas { display: none !important; }
      body { cursor: auto !important; }
    }
  `;
  document.head.appendChild(styleEl);

  if (NO_MOTION) return; // Stop here for reduced-motion users

  /* ══════════════════════════════════════════════════════════
     1. CUSTOM CURSOR
  ══════════════════════════════════════════════════════════ */
  const cursor     = document.createElement('div'); cursor.id = 'sa-cursor';
  const cursorRing = document.createElement('div'); cursorRing.id = 'sa-cursor-ring';
  document.body.appendChild(cursor);
  document.body.appendChild(cursorRing);

  let mx = -100, my = -100, rx = -100, ry = -100;
  let rafCursor;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    if (!rafCursor) rafCursor = requestAnimationFrame(animRing);
  });

  function animRing() {
    rafCursor = null;
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    if (Math.abs(mx - rx) > 0.3 || Math.abs(my - ry) > 0.3) {
      rafCursor = requestAnimationFrame(animRing);
    }
  }

  const hoverTargets = 'a, button, [onclick], .card.lift, .check-item, .habit-row, .course-row, .phase-head, .period-head, .math-subject-head, .ctrl, .nav-link, .btn, .tl-item, .sched-row';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverTargets)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverTargets)) document.body.classList.remove('cursor-hover');
  });
  document.addEventListener('mousedown', () => {
    document.body.classList.add('cursor-click');
    document.body.classList.remove('cursor-hover');
  });
  document.addEventListener('mouseup', () => {
    document.body.classList.remove('cursor-click');
  });
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0'; cursorRing.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = ''; cursorRing.style.opacity = '';
  });

  /* ══════════════════════════════════════════════════════════
     2. CLICK BURST PARTICLES
  ══════════════════════════════════════════════════════════ */
  const BURST_COLOURS = ['#0D7A5F','#C47B0A','#1A6DB5','#C0392B','#6B4FA6','#0E8C7A'];

  document.addEventListener('click', e => {
    const n = 7 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'sa-burst-particle';
      const angle = (Math.random() * 360) * Math.PI / 180;
      const dist  = 30 + Math.random() * 55;
      const size  = 3 + Math.random() * 5;
      const col   = BURST_COLOURS[Math.floor(Math.random() * BURST_COLOURS.length)];
      p.style.cssText = `
        left: ${e.clientX}px; top: ${e.clientY}px;
        width: ${size}px; height: ${size}px;
        background: ${col};
        --bx: ${Math.cos(angle) * dist}px;
        --by: ${Math.sin(angle) * dist}px;
        animation-duration: ${0.4 + Math.random() * 0.25}s;
      `;
      document.body.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  });

  /* ══════════════════════════════════════════════════════════
     3. RIPPLE ON INTERACTIVE ELEMENTS
  ══════════════════════════════════════════════════════════ */
  function addRipple(el, e) {
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.5;
    const r = document.createElement('span');
    r.className = 'sa-ripple';
    r.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${e.clientX - rect.left - size/2}px;
      top:  ${e.clientY - rect.top  - size/2}px;
    `;
    el.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  }

  document.addEventListener('click', e => {
    const target = e.target.closest('.btn, .ctrl, .check-item, .habit-row, .course-row, .phase-head, .period-head, .nav-link');
    if (target) {
      if (!target.classList.contains('sa-ripple-host')) target.classList.add('sa-ripple-host');
      addRipple(target, e);
    }
  });

  /* ══════════════════════════════════════════════════════════
     4. 3D TILT ON CARDS
  ══════════════════════════════════════════════════════════ */
  function initTilt(selector, maxDeg, perspective) {
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width  / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        const rx = -dy * maxDeg;
        const ry =  dx * maxDeg;
        card.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
        // Shift the card-accent pseudo-light
        const accent = card.querySelector('.card-accent');
        if (accent) accent.style.opacity = 0.7 + dy * 0.3;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(${perspective}px) rotateX(0) rotateY(0) translateZ(0)`;
        const accent = card.querySelector('.card-accent');
        if (accent) accent.style.opacity = '';
      });
    });
  }

  // Run tilt init now and re-run when content updates (stat cards render dynamically)
  function runTilts() {
    initTilt('.card.lift',  7, 800);
    initTilt('.cd-card',    5, 700);
    initTilt('.tier-card', 4, 700);
    initTilt('.sc-card',   5, 700);
  }
  runTilts();
  ['ui:refresh','courses:updated','milestones:updated','state:loaded'].forEach(ev =>
    document.addEventListener(ev, () => setTimeout(runTilts, 80))
  );

  /* ══════════════════════════════════════════════════════════
     5. STAGGER ENTRANCE (INTERSECTION OBSERVER)
  ══════════════════════════════════════════════════════════ */
  function registerStagger(selector, delayStep) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('sa-stagger');
          const idx = el.dataset.saIdx || 0;
          el.style.animationDelay = (idx * delayStep) + 'ms';
          // rAF to allow .sa-stagger to paint before adding .sa-visible
          requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('sa-visible')));
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.07 });
    els.forEach((el, i) => {
      el.dataset.saIdx = i;
      io.observe(el);
    });
  }

  function applyStagger() {
    registerStagger('.stat-grid .card',   55);
    registerStagger('.cd-card',           70);
    registerStagger('.check-item',        35);
    registerStagger('.habit-row',         40);
    registerStagger('.tier-card',         60);
    registerStagger('.sc-card',           45);
    registerStagger('.sched-row',         28);
    registerStagger('.goal-card',         40);
    registerStagger('.sec-head',          25);
    registerStagger('.phase-wrap',        50);
    registerStagger('.period-wrap',       50);
    registerStagger('.math-subject',      45);
    registerStagger('.now-card',          60);
    registerStagger('.ov-card',           55);
  }
  applyStagger();
  // Re-run stagger after dynamic content loads
  ['ui:refresh','courses:updated','milestones:updated','state:loaded'].forEach(ev =>
    document.addEventListener(ev, () => setTimeout(applyStagger, 120))
  );

  /* ══════════════════════════════════════════════════════════
     6. SCROLL PROGRESS BAR
  ══════════════════════════════════════════════════════════ */
  const scrollBar = document.createElement('div');
  scrollBar.id = 'sa-scroll-bar';
  document.body.prepend(scrollBar);

  window.addEventListener('scroll', () => {
    const doc  = document.documentElement;
    const pct  = doc.scrollTop / (doc.scrollHeight - doc.clientHeight) * 100;
    scrollBar.style.width = Math.min(100, pct) + '%';
  }, { passive: true });

  /* ══════════════════════════════════════════════════════════
     7. AMBIENT BACKGROUND CANVAS (floating orbs)
  ══════════════════════════════════════════════════════════ */
  const canvas = document.createElement('canvas');
  canvas.id = 'sa-bg-canvas';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H;

  function resizeCanvas() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Orbs — subtle floating shapes in brand colours
  const ORB_PALETTE = [
    { r: 13,  g: 122, b: 95  },  // green
    { r: 196, g: 123, b: 10  },  // amber
    { r: 26,  g: 109, b: 181 },  // blue
    { r: 107, g: 79,  b: 166 },  // purple
    { r: 14,  g: 140, b: 122 },  // teal
  ];

  const orbs = Array.from({ length: 5 }, (_, i) => {
    const col = ORB_PALETTE[i % ORB_PALETTE.length];
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 180 + Math.random() * 220,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      col,
      phase: Math.random() * Math.PI * 2,
    };
  });

  let rafOrbs;
  function drawOrbs(ts) {
    ctx.clearRect(0, 0, W, H);
    orbs.forEach(o => {
      o.phase += 0.004;
      o.x += o.vx + Math.sin(o.phase * 0.7) * 0.12;
      o.y += o.vy + Math.cos(o.phase * 0.5) * 0.10;
      if (o.x < -o.r) o.x = W + o.r;
      if (o.x > W + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = H + o.r;
      if (o.y > H + o.r) o.y = -o.r;

      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0,   `rgba(${o.col.r},${o.col.g},${o.col.b}, 0.055)`);
      g.addColorStop(0.5, `rgba(${o.col.r},${o.col.g},${o.col.b}, 0.02)`);
      g.addColorStop(1,   `rgba(${o.col.r},${o.col.g},${o.col.b}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    rafOrbs = requestAnimationFrame(drawOrbs);
  }
  rafOrbs = requestAnimationFrame(drawOrbs);

  // Pause orbs when tab is hidden (battery-friendly)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(rafOrbs); }
    else { rafOrbs = requestAnimationFrame(drawOrbs); }
  });

  /* ══════════════════════════════════════════════════════════
     8. MOUSE PARALLAX ON HERO
  ══════════════════════════════════════════════════════════ */
  const heroMain = document.querySelector('.hero-main');
  if (heroMain) {
    document.addEventListener('mousemove', e => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      heroMain.style.transform = `perspective(1200px) rotateX(${-dy * 1.8}deg) rotateY(${dx * 1.8}deg)`;
    });
    heroMain.addEventListener('mouseleave', () => {
      heroMain.style.transition = 'transform 0.6s ease';
      heroMain.style.transform  = 'perspective(1200px) rotateX(0) rotateY(0)';
      setTimeout(() => { heroMain.style.transition = ''; }, 600);
    });
  }

  /* ══════════════════════════════════════════════════════════
     9. ANIMATED NUMBER COUNT-UP
  ══════════════════════════════════════════════════════════ */
  function countUp(el, target, duration, suffix) {
    const start = performance.now();
    const from  = 0;
    function tick(now) {
      const p   = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      const val  = from + (target - from) * ease;
      el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + (suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Intercept stat card value updates and animate them
  const _originalRefresh = window.refresh;
  if (typeof _originalRefresh === 'function') {
    window.refresh = function() {
      _originalRefresh.apply(this, arguments);
      animateStatValues();
    };
  }
  // Also fire on DOMContentLoaded after data is ready
  document.addEventListener('ui:refresh', () => setTimeout(animateStatValues, 100));

  function animateStatValues() {
    const cdNums = document.querySelectorAll('.cd-num');
    cdNums.forEach(el => {
      const raw = parseInt(el.textContent, 10);
      if (!isNaN(raw) && raw > 0) {
        el.classList.add('sa-value-flash');
        countUp(el, raw, 900, '');
        el.addEventListener('animationend', () => el.classList.remove('sa-value-flash'), { once: true });
      }
    });
  }
  setTimeout(animateStatValues, 400);

  /* ══════════════════════════════════════════════════════════
     10. CHECK / HABIT BOUNCE ANIMATION
  ══════════════════════════════════════════════════════════ */
  document.addEventListener('click', e => {
    const ci = e.target.closest('.check-item');
    if (ci) {
      ci.classList.remove('sa-check-anim');
      void ci.offsetWidth; // reflow
      ci.classList.add('sa-check-anim');
      ci.addEventListener('animationend', () => ci.classList.remove('sa-check-anim'), { once: true });
    }
    const hr = e.target.closest('.habit-row');
    if (hr) {
      hr.classList.remove('sa-check-anim');
      void hr.offsetWidth;
      hr.classList.add('sa-check-anim');
      hr.addEventListener('animationend', () => hr.classList.remove('sa-check-anim'), { once: true });
    }
  });

  /* ══════════════════════════════════════════════════════════
     11. NAVBAR ACTIVE LINK INDICATOR SLIDE
  ══════════════════════════════════════════════════════════ */
  const activeLink = document.querySelector('.nav-link.active');
  if (activeLink) {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position:absolute; bottom:0; height:3px; background:var(--green);
      border-radius:2px 2px 0 0; transition: left 0.3s ease, width 0.3s ease;
      pointer-events:none;
    `;
    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
      navLinks.style.position = 'relative';
      navLinks.appendChild(indicator);
      function positionIndicator(el) {
        const rect  = el.getBoundingClientRect();
        const pRect = navLinks.getBoundingClientRect();
        indicator.style.left  = (rect.left - pRect.left) + 'px';
        indicator.style.width = rect.width + 'px';
      }
      positionIndicator(activeLink);
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('mouseenter', () => positionIndicator(link));
        link.addEventListener('mouseleave', () => positionIndicator(activeLink));
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     12. TIMELINE NODE RIPPLE ON HOVER
  ══════════════════════════════════════════════════════════ */
  document.addEventListener('mouseover', e => {
    const node = e.target.closest('.tl-item');
    if (!node) return;
    if (node.querySelector('.tl-node-ring')) return;
    const ring = document.createElement('div');
    ring.className = 'tl-node-ring';
    ring.style.cssText = `
      position:absolute; border-radius:50%;
      border: 2px solid var(--green); opacity: 0;
      width: 28px; height: 28px;
      top: 8px; left: 50%; transform: translateX(-50%);
      animation: tl-ring-expand 0.45s ease-out forwards;
      pointer-events:none;
    `;
    node.style.position = 'relative';
    node.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove());
  });

  // Inject tl ring keyframes (can't be in the big stylesheet due to variable name)
  const tlStyle = document.createElement('style');
  tlStyle.textContent = `
    @keyframes tl-ring-expand {
      0%   { width:28px; height:28px; opacity:0.7; }
      100% { width:54px; height:54px; opacity:0; margin-top:-13px; margin-left:-13px; }
    }
  `;
  document.head.appendChild(tlStyle);

  /* ══════════════════════════════════════════════════════════
     13. SECTION HEAD LINE ANIMATE-IN
  ══════════════════════════════════════════════════════════ */
  const lineIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const line = entry.target.querySelector('.sec-line');
        if (line) {
          line.style.transform = 'scaleX(0)';
          line.style.transformOrigin = 'left';
          requestAnimationFrame(() => {
            line.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
            line.style.transform  = 'scaleX(1)';
          });
        }
        lineIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.sec-head').forEach(h => lineIO.observe(h));

  /* ══════════════════════════════════════════════════════════
     14. MICRO-BAR FILL ANIMATE-IN
  ══════════════════════════════════════════════════════════ */
  const barIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const targetW = fill.style.width;
        fill.style.width = '0%';
        fill.style.transition = 'none';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          fill.style.transition = 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
          fill.style.width = targetW;
        }));
        barIO.unobserve(fill);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.micro-fill').forEach(f => barIO.observe(f));

  /* ══════════════════════════════════════════════════════════
     15. SMOOTH ACCORDION 3D FLIP CHEVRON
  ══════════════════════════════════════════════════════════ */
  document.addEventListener('click', e => {
    const head = e.target.closest('.phase-head, .period-head, .math-subject-head');
    if (!head) return;
    const chev = head.querySelector('.ph-chev, .period-chev, .ms-chev');
    if (chev) {
      chev.style.transition = 'transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)';
    }
  });

  /* ══════════════════════════════════════════════════════════
     16. PROGRESS RING SPIN-IN (savings / milestones page)
  ══════════════════════════════════════════════════════════ */
  const ringIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.ring-fill');
        if (fill) {
          const target = fill.style.strokeDashoffset;
          const circum = parseFloat(fill.style.strokeDasharray || '440');
          fill.style.strokeDashoffset = String(circum);
          fill.style.transition = 'none';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            fill.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)';
            fill.style.strokeDashoffset = target;
          }));
        }
        ringIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.ring-wrap').forEach(r => ringIO.observe(r));

  /* ══════════════════════════════════════════════════════════
     17. HEATMAP CELL WAVE ENTRANCE
  ══════════════════════════════════════════════════════════ */
  function animateHeatmap() {
    const cells = document.querySelectorAll('.heatmap-cell');
    if (!cells.length) return;
    cells.forEach((cell, i) => {
      cell.style.opacity = '0';
      cell.style.transform = 'scale(0)';
      setTimeout(() => {
        cell.style.transition = 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        cell.style.opacity = '';
        cell.style.transform = '';
      }, 8 + i * 4);
    });
  }
  setTimeout(animateHeatmap, 300);
  document.addEventListener('ui:refresh', () => setTimeout(animateHeatmap, 150));

  /* ══════════════════════════════════════════════════════════
     18. SAVINGS GAUGE SPIN-IN
  ══════════════════════════════════════════════════════════ */
  const gaugeIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const gFill = entry.target.querySelector('.g-fill');
        if (gFill) {
          const dash   = gFill.getAttribute('stroke-dasharray');
          const offset = gFill.style.strokeDashoffset || gFill.getAttribute('stroke-dashoffset');
          if (dash) {
            gFill.style.strokeDashoffset = dash;
            requestAnimationFrame(() => requestAnimationFrame(() => {
              gFill.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.22, 1, 0.36, 1)';
              if (offset) gFill.style.strokeDashoffset = offset;
            }));
          }
        }
        gaugeIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.gauge-wrap').forEach(g => gaugeIO.observe(g));

  /* ══════════════════════════════════════════════════════════
     19. LIVE CLOCK PULSE
  ══════════════════════════════════════════════════════════ */
  const clockEl = document.getElementById('live-clock');
  if (clockEl) {
    // Inject colon blink
    const colonStyle = document.createElement('style');
    colonStyle.textContent = `
      #live-clock .colon { animation: colon-blink 1s step-end infinite; display:inline-block; }
      @keyframes colon-blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
    `;
    document.head.appendChild(colonStyle);
    // The clock text is updated by update.js — we just wrap colons after each update
    const wrapColons = () => {
      if (!clockEl.dataset.saWrapped) {
        clockEl.innerHTML = clockEl.textContent.replace(/:/g, '<span class="colon">:</span>');
        clockEl.dataset.saWrapped = '1';
      }
    };
    document.addEventListener('ui:refresh', wrapColons);
    setTimeout(wrapColons, 600);
  }

  /* ══════════════════════════════════════════════════════════
     20. ALERT BAR SHIMMER
  ══════════════════════════════════════════════════════════ */
  const shimmerStyle = document.createElement('style');
  shimmerStyle.textContent = `
    .alert-bar.danger {
      background-size: 200% 100%;
      animation: alert-shimmer 3.5s ease-in-out infinite;
    }
    @keyframes alert-shimmer {
      0%, 100% { background-position: 0% 50%; }
      50%       { background-position: 100% 50%; }
    }
  `;
  document.head.appendChild(shimmerStyle);

  const alertBar = document.getElementById('alert-bar');
  if (alertBar && alertBar.classList.contains('danger')) {
    alertBar.style.background = 'linear-gradient(90deg, var(--red-bg), #fff7f7, var(--red-bg))';
    alertBar.style.backgroundSize = '200% 100%';
  }

  console.log('[Sprint OS Animate] 20 animation systems initialised ✓');

})();
