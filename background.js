
(function () {
  'use strict';

  if (window.__mwbgMounted) return;
  window.__mwbgMounted = true;

  const CSS = `
    .mwbg-pulse {
      position: fixed; inset: 0; z-index: 0;
      background: radial-gradient(ellipse 70% 50% at 50% 40%, rgba(150,116,28,0.12) 0%, transparent 70%);
      animation: mwbgPulse 9s ease-in-out infinite;
      pointer-events: none;
      will-change: opacity, transform;
    }
    @keyframes mwbgPulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.08); }
    }

    .mwbg-rays {
      position: fixed;
      top: -30%; left: 50%;
      width: 160vmax; height: 160vmax;
      transform: translateX(-50%);
      z-index: 0;
      background: conic-gradient(
        from 200deg at 50% 30%,
        transparent 0deg,
        rgba(150,116,28,0.1) 8deg,
        transparent 16deg,
        transparent 30deg,
        rgba(150,116,28,0.08) 38deg,
        transparent 46deg,
        transparent 90deg,
        rgba(150,116,28,0.06) 98deg,
        transparent 106deg,
        transparent 360deg
      );
      -webkit-mask-image: radial-gradient(ellipse 60% 50% at 50% 30%, black 0%, transparent 75%);
              mask-image: radial-gradient(ellipse 60% 50% at 50% 30%, black 0%, transparent 75%);
      opacity: 0.7;
      animation: mwbgRays 14s ease-in-out infinite;
      pointer-events: none;
      will-change: transform, opacity;
    }

    @keyframes mwbgRays {
      0%, 100% { opacity: 0.35; }
      50%      { opacity: 0.6; }
    }

    .mwbg-necklaces {
      position: fixed; inset: 0; z-index: 0;
      pointer-events: none; overflow: hidden;
    }
    .mwbg-necklace {
      position: absolute; top: -10px;
      transform-origin: 50% 0;
      animation: mwbgSwing 9s ease-in-out infinite;
      opacity: 0.55;
      will-change: transform;
    }
    .mwbg-necklace svg { display: block; overflow: visible; }
    .mwbg-necklace-1 { left: 8%;  animation-duration: 10s; animation-delay: 0s;   }
    .mwbg-necklace-2 { left: 32%; animation-duration: 12s; animation-delay: -2s;  }
    .mwbg-necklace-3 { right: 18%; animation-duration: 11s; animation-delay: -4s; }
    .mwbg-necklace-4 { right: 4%;  animation-duration: 8.5s; animation-delay: -1s; }
    @keyframes mwbgSwing {
      0%, 100% { transform: rotate(-3deg); }
      50%      { transform: rotate(3deg); }
    }

    .mwbg-particles, .mwbg-flakes, .mwbg-sparkles {
      position: fixed; inset: 0; z-index: 0;
      pointer-events: none; overflow: hidden;
    }
    .mwbg-particle {
      position: absolute; bottom: -20px;
      width: 3px; height: 3px;
      background: radial-gradient(circle, rgba(190,152,44,0.9), rgba(150,116,28,0.25) 60%, transparent 80%);
      border-radius: 50%;
      filter: drop-shadow(0 0 4px rgba(150,116,28,0.8));
      animation: mwbgFloatUp linear infinite;
    }
    @keyframes mwbgFloatUp {
      0%   { transform: translateY(0) translateX(0); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { transform: translateY(-110vh) translateX(var(--mwbg-drift, 30px)); opacity: 0; }
    }

    .mwbg-flake {
      position: absolute; top: -20px;
      width: 6px; height: 6px;
      background: linear-gradient(135deg, #D8B441, #8A6A1F);
      transform-origin: center;
      animation: mwbgFallSpin linear infinite;
      filter: drop-shadow(0 0 3px rgba(150,116,28,0.7));
      opacity: 0.8;
    }
    .mwbg-flake.tri { clip-path: polygon(50% 0, 0 100%, 100% 100%); }
    .mwbg-flake.dia { transform: rotate(45deg); }
    @keyframes mwbgFallSpin {
      0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { transform: translateY(110vh) translateX(var(--mwbg-drift, -40px)) rotate(720deg); opacity: 0; }
    }

    .mwbg-sparkle {
      position: absolute;
      width: 10px; height: 10px;
      background:
        linear-gradient(90deg, transparent 45%, #A88322 50%, transparent 55%),
        linear-gradient(0deg,  transparent 45%, #A88322 50%, transparent 55%);
      filter: drop-shadow(0 0 5px rgba(190,152,44,0.9));
      animation: mwbgTwinkle ease-in-out infinite;
      opacity: 0;
    }
    @keyframes mwbgTwinkle {
      0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
      50%      { opacity: 1; transform: scale(1)   rotate(45deg); }
    }

    .mwbg-vignette {
      position: fixed; inset: 0; z-index: 0;
      pointer-events: none;
      background: radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(90,68,28,0.19) 100%);
    }

    @media (max-width: 480px) {
      .mwbg-necklace-2, .mwbg-necklace-4 { display: none; }
      .mwbg-rays { opacity: 0.5; }
    }

    @media (pointer: coarse) {
      .mwbg-necklace-2, .mwbg-necklace-4 { display: none; }
      .mwbg-rays { opacity: 0.35; }
    }

    @media (prefers-reduced-motion: reduce) {
      .mwbg-pulse, .mwbg-rays, .mwbg-necklace,
      .mwbg-particle, .mwbg-flake, .mwbg-sparkle {
        animation: none !important;
      }
    }
  `;

  const NECKLACES_HTML = `
    <div class="mwbg-necklace mwbg-necklace-1">
      <svg width="60" height="180" viewBox="0 0 60 180">
        <path d="M30 0 Q12 50, 22 100 Q30 130, 30 150" fill="none" stroke="rgba(150,116,28,0.58)" stroke-width="1.2"/>
        <path d="M30 0 Q48 50, 38 100 Q30 130, 30 150" fill="none" stroke="rgba(150,116,28,0.47)" stroke-width="1.2"/>
        <circle cx="30" cy="155" r="6" fill="rgba(190,152,44,0.85)" filter="drop-shadow(0 0 6px rgba(150,116,28,0.9))"/>
        <polygon points="30,148 36,156 30,168 24,156" fill="rgba(150,116,28,0.9)"/>
      </svg>
    </div>
    <div class="mwbg-necklace mwbg-necklace-2">
      <svg width="50" height="160" viewBox="0 0 50 160">
        <path d="M25 0 Q10 45, 18 90 Q25 115, 25 130" fill="none" stroke="rgba(150,116,28,0.52)" stroke-width="1"/>
        <path d="M25 0 Q40 45, 32 90 Q25 115, 25 130" fill="none" stroke="rgba(150,116,28,0.42)" stroke-width="1"/>
        <polygon points="25,128 31,138 25,148 19,138" fill="rgba(190,152,44,0.85)" filter="drop-shadow(0 0 4px rgba(150,116,28,0.8))"/>
      </svg>
    </div>
    <div class="mwbg-necklace mwbg-necklace-3">
      <svg width="60" height="190" viewBox="0 0 60 190">
        <path d="M30 0 Q10 55, 20 110 Q30 140, 30 160" fill="none" stroke="rgba(150,116,28,0.58)" stroke-width="1.3"/>
        <path d="M30 0 Q50 55, 40 110 Q30 140, 30 160" fill="none" stroke="rgba(150,116,28,0.47)" stroke-width="1.3"/>
        <circle cx="30" cy="167" r="7" fill="rgba(190,152,44,0.85)" filter="drop-shadow(0 0 7px rgba(150,116,28,0.9))"/>
        <polygon points="30,160 38,170 30,182 22,170" fill="rgba(150,116,28,0.9)"/>
      </svg>
    </div>
    <div class="mwbg-necklace mwbg-necklace-4">
      <svg width="46" height="150" viewBox="0 0 46 150">
        <path d="M23 0 Q10 40, 16 80 Q23 105, 23 120" fill="none" stroke="rgba(150,116,28,0.47)" stroke-width="1"/>
        <path d="M23 0 Q36 40, 30 80 Q23 105, 23 120" fill="none" stroke="rgba(150,116,28,0.37)" stroke-width="1"/>
        <polygon points="23,118 28,127 23,138 18,127" fill="rgba(190,152,44,0.8)" filter="drop-shadow(0 0 4px rgba(150,116,28,0.75))"/>
      </svg>
    </div>
  `;

  function mount() {
    if (document.getElementById('mwbg-style')) return;

    const style = document.createElement('style');
    style.id = 'mwbg-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    const frag = document.createDocumentFragment();

    const pulse = document.createElement('div');
    pulse.className = 'mwbg-pulse';
    pulse.setAttribute('aria-hidden', 'true');
    frag.appendChild(pulse);

    const rays = document.createElement('div');
    rays.className = 'mwbg-rays';
    rays.setAttribute('aria-hidden', 'true');
    frag.appendChild(rays);

    const necks = document.createElement('div');
    necks.className = 'mwbg-necklaces';
    necks.setAttribute('aria-hidden', 'true');
    necks.innerHTML = NECKLACES_HTML;
    frag.appendChild(necks);

    const particles = document.createElement('div');
    particles.className = 'mwbg-particles';
    particles.setAttribute('aria-hidden', 'true');
    frag.appendChild(particles);

    const flakes = document.createElement('div');
    flakes.className = 'mwbg-flakes';
    flakes.setAttribute('aria-hidden', 'true');
    frag.appendChild(flakes);

    const sparkles = document.createElement('div');
    sparkles.className = 'mwbg-sparkles';
    sparkles.setAttribute('aria-hidden', 'true');
    frag.appendChild(sparkles);

    const vignette = document.createElement('div');
    vignette.className = 'mwbg-vignette';
    vignette.setAttribute('aria-hidden', 'true');
    frag.appendChild(vignette);

    document.body.insertBefore(frag, document.body.firstChild);


    (window.requestAnimationFrame || setTimeout)(function () {
      spawnAnimated(particles, flakes, sparkles);
    });
  }

  function spawnAnimated(pLayer, fLayer, sLayer) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;



    const light = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;

    const COUNTS = light
      ? { particles: 6, flakes: 3, sparkles: 3 }
      : { particles: 12, flakes: 5, sparkles: 6 };

    const rand = (a, b) => a + Math.random() * (b - a);

    for (let i = 0; i < COUNTS.particles; i++) {
      const p = document.createElement('div');
      p.className = 'mwbg-particle';
      const size = rand(2, 5);
      p.style.width  = size + 'px';
      p.style.height = size + 'px';
      p.style.left   = rand(0, 100) + 'vw';
      p.style.setProperty('--mwbg-drift', rand(-60, 60) + 'px');
      p.style.animationDuration = rand(10, 22) + 's';
      p.style.animationDelay    = rand(-22, 0) + 's';
      p.style.opacity = rand(0.4, 0.9);
      pLayer.appendChild(p);
    }

    const shapes = ['tri', 'dia', ''];
    for (let i = 0; i < COUNTS.flakes; i++) {
      const f = document.createElement('div');
      f.className = 'mwbg-flake ' + shapes[Math.floor(Math.random() * shapes.length)];
      const size = rand(4, 9);
      f.style.width  = size + 'px';
      f.style.height = size + 'px';
      f.style.left   = rand(0, 100) + 'vw';
      f.style.setProperty('--mwbg-drift', rand(-80, 80) + 'px');
      f.style.animationDuration = rand(12, 24) + 's';
      f.style.animationDelay    = rand(-24, 0) + 's';
      fLayer.appendChild(f);
    }

    for (let i = 0; i < COUNTS.sparkles; i++) {
      const s = document.createElement('div');
      s.className = 'mwbg-sparkle';
      s.style.left = rand(0, 100) + 'vw';
      s.style.top  = rand(0, 100) + 'vh';
      const sz = rand(7, 14);
      s.style.width  = sz + 'px';
      s.style.height = sz + 'px';
      s.style.animationDuration = rand(3, 6) + 's';
      s.style.animationDelay    = rand(-6, 0) + 's';
      sLayer.appendChild(s);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
