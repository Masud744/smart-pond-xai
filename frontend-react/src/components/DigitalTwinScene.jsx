import React from 'react';

/**
 * RealisticSeaweed — Renders a leafy seaweed plant matching the user's reference.
 * Includes a central stem, organic curly alternating leaves with dual-tone shading
 * (light highlight and dark shadow side), and midrib center veins.
 */
const RealisticSeaweed = ({ x, y, scale = 1, delay = '0s' }) => {
  return (
    <g
      className="uw-kelp-sway"
      style={{
        transformOrigin: `${x}px ${y}px`,
        animationDelay: delay,
      }}
      opacity="0.94"
    >
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        {/* Central thick organic stem */}
        <path
          d="M 0,0 Q -12,-80 5,-160 T -5,-300 T 0,-400"
          fill="none"
          stroke="url(#stemGrad)"
          strokeWidth="5.5"
          strokeLinecap="round"
        />

        {/* ── Leaf 1 (Left, Bottom) ── */}
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -30px', animationDelay: `calc(${delay} - 0.5s)` }}>
          <path d="M -2,-30 C -25,-32 -38,-15 -28,8 C -18,18 -10,8 -2,-30 Z" fill="url(#leafDark)" />
          <path d="M -2,-30 C -14,-22 -22,-8 -18,6 C -14,12 -5,6 -2,-30 Z" fill="url(#leafLight)" />
          <path d="M -2,-30 Q -15,-10 -18,6" fill="none" stroke="#051f0c" strokeWidth="1.2" opacity="0.75" />
        </g>

        {/* ── Leaf 2 (Right, Bottom) ── */}
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -55px', animationDelay: `calc(${delay} - 1.2s)` }}>
          <path d="M 2,-55 C 24,-58 38,-42 28,-18 C 18,-8 10,-18 2,-55 Z" fill="url(#leafDark)" />
          <path d="M 2,-55 C 14,-48 24,-32 18,-18 C 12,-10 4,-14 2,-55 Z" fill="url(#leafLight)" />
          <path d="M 2,-55 Q 14,-35 18,-18" fill="none" stroke="#051f0c" strokeWidth="1.2" opacity="0.75" />
        </g>

        {/* ── Leaf 3 (Left, Lower-Mid) ── */}
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -95px', animationDelay: `calc(${delay} - 0.8s)` }}>
          <path d="M -3,-95 C -32,-102 -50,-82 -40,-55 C -30,-42 -18,-55 -3,-95 Z" fill="url(#leafDark)" />
          <path d="M -3,-95 C -20,-88 -32,-68 -28,-55 C -24,-45 -10,-50 -3,-95 Z" fill="url(#leafLight)" />
          <path d="M -3,-95 Q -20,-72 -28,-55" fill="none" stroke="#051f0c" strokeWidth="1.3" opacity="0.75" />
        </g>

        {/* ── Leaf 4 (Right, Lower-Mid) ── */}
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -120px', animationDelay: `calc(${delay} - 1.8s)` }}>
          <path d="M 3,-120 C 32,-128 50,-108 40,-80 C 30,-68 18,-80 3,-120 Z" fill="url(#leafDark)" />
          <path d="M 3,-120 C 20,-112 32,-92 28,-80 C 24,-70 10,-75 3,-120 Z" fill="url(#leafLight)" />
          <path d="M 3,-120 Q 20,-98 28,-80" fill="none" stroke="#051f0c" strokeWidth="1.3" opacity="0.75" />
        </g>

        {/* ── Leaf 5 (Left, Mid) ── */}
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -165px', animationDelay: `calc(${delay} - 0.2s)` }}>
          <path d="M -4,-165 C -38,-178 -56,-154 -44,-122 C -34,-102 -18,-122 -4,-165 Z" fill="url(#leafDark)" />
          <path d="M -4,-165 C -22,-152 -36,-132 -32,-122 C -28,-110 -10,-120 -4,-165 Z" fill="url(#leafLight)" />
          <path d="M -4,-165 Q -22,-138 -32,-122" fill="none" stroke="#051f0c" strokeWidth="1.4" opacity="0.75" />
        </g>

        {/* ── Leaf 6 (Right, Mid) ── */}
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -190px', animationDelay: `calc(${delay} - 2.1s)` }}>
          <path d="M 4,-190 C 38,-202 56,-178 44,-146 C 34,-126 18,-146 4,-190 Z" fill="url(#leafDark)" />
          <path d="M 4,-190 C 22,-178 36,-158 32,-146 C 28,-134 10,-140 4,-190 Z" fill="url(#leafLight)" />
          <path d="M 4,-190 Q 22,-163 32,-146" fill="none" stroke="#051f0c" strokeWidth="1.4" opacity="0.75" />
        </g>

        {/* ── Leaf 7 (Left, Upper-Mid) ── */}
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -240px', animationDelay: `calc(${delay} - 1.1s)` }}>
          <path d="M -3,-240 C -34,-254 -48,-230 -38,-202 C -28,-188 -15,-202 -3,-240 Z" fill="url(#leafDark)" />
          <path d="M -3,-240 C -18,-230 -30,-210 -26,-202 C -22,-192 -8,-204 -3,-240 Z" fill="url(#leafLight)" />
          <path d="M -3,-240 Q -18,-214 -26,-202" fill="none" stroke="#051f0c" strokeWidth="1.4" opacity="0.75" />
        </g>

        {/* ── Leaf 8 (Right, Upper-Mid) ── */}
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -265px', animationDelay: `calc(${delay} - 2.5s)` }}>
          <path d="M 3,-265 C 34,-278 48,-254 38,-226 C 28,-212 15,-226 3,-265 Z" fill="url(#leafDark)" />
          <path d="M 3,-265 C 18,-254 30,-234 26,-226 C 22,-216 8,-222 3,-265 Z" fill="url(#leafLight)" />
          <path d="M 3,-265 Q 18,-238 26,-226" fill="none" stroke="#051f0c" strokeWidth="1.4" opacity="0.75" />
        </g>

        {/* ── Leaf 9 (Left, Top) ── */}
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -310px', animationDelay: `calc(${delay} - 0.4s)` }}>
          <path d="M -2,-310 C -25,-324 -35,-304 -28,-280 C -21,-265 -10,-280 -2,-310 Z" fill="url(#leafDark)" />
          <path d="M -2,-310 C -14,-300 -24,-286 -20,-280 C -16,-274 -5,-282 -2,-310 Z" fill="url(#leafLight)" />
        </g>

        {/* ── Leaf 10 (Right, Top) ── */}
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -330px', animationDelay: `calc(${delay} - 1.5s)` }}>
          <path d="M 2,-330 C 25,-344 35,-324 28,-300 C 21,-285 10,-300 2,-330 Z" fill="url(#leafDark)" />
          <path d="M 2,-330 C 14,-320 24,-306 20,-300 C 16,-294 5,-302 2,-330 Z" fill="url(#leafLight)" />
        </g>

        {/* ── Top Leaf Crown ── */}
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -355px', animationDelay: `calc(${delay} - 0.9s)` }}>
          <path d="M 0,-355 C -15,-380 -20,-402 -5,-415 C 5,-400 12,-382 0,-355 Z" fill="url(#leafLight)" />
          <path d="M 0,-355 C 15,-380 20,-402 5,-415 C -5,-400 -12,-382 0,-355 Z" fill="url(#leafDark)" />
        </g>
      </g>
    </g>
  );
};

/**
 * DigitalTwinScene — Premium underwater scene scoped to the Digital Twin card.
 * Features realistic aquatic plants, surface sunlight glow, god-rays, and animated fish.
 */
const DigitalTwinScene = () => {
  return (
    <div
      aria-hidden="true"
      className="dt-scene-root"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      {/* ── Vintage deep-ocean gradient ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, #0c4a6e 0%, #083a58 15%, #052a40 35%, #031c2e 55%, #010f1c 75%, #00060e 100%)',
          borderRadius: 'inherit',
        }}
      />

      {/* ── Surface-light overlay ── */}
      <div
        className="dt-sunlight-glow"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '55%',
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.28) 0%, rgba(103,232,249,0.22) 25%, rgba(14,165,233,0.12) 55%, rgba(2,132,199,0.04) 80%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Caustic water-surface line at very top edge ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(186,230,253,0.6) 20%, rgba(255,255,255,0.9) 50%, rgba(186,230,253,0.6) 80%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          {/* ── Strong surface-light radial glow — pulsing ── */}
          <radialGradient id="dtSunGlow" cx="50%" cy="0%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)">
              <animate attributeName="stop-opacity" values="0.6;0.35;0.6" dur="5s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="rgba(186,230,253,0.45)">
              <animate attributeName="stop-opacity" values="0.5;0.25;0.5" dur="5s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="rgba(14,165,233,0.25)">
              <animate attributeName="stop-opacity" values="0.3;0.1;0.3" dur="5s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgba(2,132,199,0)" />
          </radialGradient>

          {/* ── God-ray light shaft gradients ── */}
          <linearGradient id="dtRay1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(186,230,253,0.35)" />
            <stop offset="70%" stopColor="rgba(14,165,233,0.08)" />
            <stop offset="100%" stopColor="rgba(2,132,199,0)" />
          </linearGradient>
          <linearGradient id="dtRay2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(224,242,254,0.3)" />
            <stop offset="60%" stopColor="rgba(56,189,248,0.07)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0)" />
          </linearGradient>
          <linearGradient id="dtRay3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="65%" stopColor="rgba(103,232,249,0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="dtRay4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(186,230,253,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* ── Seaweed plant stem gradient ── */}
          <linearGradient id="stemGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#071d0b" />
            <stop offset="100%" stopColor="#154421" />
          </linearGradient>

          {/* ── Seaweed leaf dark gradient (shady/back side) ── */}
          <linearGradient id="leafDark" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#08250f" />
            <stop offset="60%" stopColor="#123d1b" />
            <stop offset="100%" stopColor="#1a4f25" />
          </linearGradient>

          {/* ── Seaweed leaf light gradient (shiny/highlight side) ── */}
          <linearGradient id="leafLight" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1c5528" />
            <stop offset="50%" stopColor="#3c9254" />
            <stop offset="100%" stopColor="#5eb877" />
          </linearGradient>

          {/* ── Fish gradient fills ── */}
          <linearGradient id="fishSilver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(226,232,240,0.95)" />
            <stop offset="100%" stopColor="rgba(148,163,184,0.85)" />
          </linearGradient>
          <linearGradient id="fishOrange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(251,146,60,0.98)" />
            <stop offset="100%" stopColor="rgba(234,88,12,0.90)" />
          </linearGradient>
          <linearGradient id="fishGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(253,186,116,0.97)" />
            <stop offset="100%" stopColor="rgba(245,158,11,0.92)" />
          </linearGradient>
        </defs>

        {/* ── Strong surface-light glow bloom (animated) ── */}
        <rect
          x="0" y="0" width="1000" height="260"
          fill="url(#dtSunGlow)"
          className="dt-sunlight-glow"
          style={{ pointerEvents: 'none' }}
        />

        {/* ── God-ray light shafts from water surface ── */}
        <polygon points="80,0 200,0 280,400 0,400" fill="url(#dtRay1)" className="dt-ray" style={{ pointerEvents: 'none' }} />
        <polygon points="280,0 390,0 440,400 240,400" fill="url(#dtRay2)" className="dt-ray" style={{ animationDelay: '-1.5s', pointerEvents: 'none' }} />
        <polygon points="500,0 610,0 660,400 450,400" fill="url(#dtRay3)" className="dt-ray" style={{ animationDelay: '-3s', pointerEvents: 'none' }} />
        <polygon points="720,0 820,0 880,400 680,400" fill="url(#dtRay4)" className="dt-ray" style={{ animationDelay: '-4.5s', pointerEvents: 'none' }} />

        {/* ── Caustic shimmer patches near surface ── */}
        <ellipse cx="250" cy="60" rx="140" ry="45" fill="rgba(186,230,253,0.06)" className="uw-caustic" />
        <ellipse cx="580" cy="90" rx="120" ry="35" fill="rgba(224,242,254,0.05)" className="uw-caustic" style={{ animationDelay: '-2s' }} />
        <ellipse cx="820" cy="50" rx="100" ry="30" fill="rgba(186,230,253,0.04)" className="uw-caustic" style={{ animationDelay: '-4s' }} />

        {/* ══════ REALISTIC SEAWEED PLANTS (as per reference image) ══════ */}
        {/* Left Side Group */}
        <RealisticSeaweed x={70} y={400} scale={0.9} delay="0s" />
        <RealisticSeaweed x={115} y={400} scale={0.68} delay="-2.5s" />

        {/* Right Side Group */}
        <RealisticSeaweed x={930} y={400} scale={0.86} delay="-1.2s" />
        <RealisticSeaweed x={880} y={400} scale={0.62} delay="-3.7s" />

        {/* ══════ FISH — vivid, realistic, staggered animations ══════ */}

        {/* Fish 1 — Large silver/pearl, swims right */}
        <g className="dt-fish-swim-r1" style={{ animationDuration: '14s' }}>
          <g transform="translate(120, 120)" className="dt-fish-bob uw-fish-body-swim" style={{ animationDelay: '0s' }}>
            <ellipse cx="0" cy="0" rx="24" ry="9" fill="url(#fishSilver)" />
            <ellipse cx="-2" cy="2" rx="14" ry="4" fill="rgba(255,255,255,0.35)" />
            <path d="M-8 -9 Q-2 -18, 6 -16 Q12 -13, 14 -9" fill="rgba(203,213,225,0.8)" />
            {/* Tail fin with wagging animation */}
            <path d="M22 0 L33 -12 L30 0 L33 12 L22 0 Z" fill="rgba(186,198,217,0.85)" className="uw-fish-tail" style={{ transformOrigin: '22px 0px' }} />
            <path d="M-4 3 Q-8 11, -2 12 Q2 9, 2 4" fill="rgba(203,213,225,0.6)" />
            <line x1="-14" y1="0" x2="18" y2="-1" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" strokeDasharray="3 2" />
            <circle cx="-17" cy="-2" r="2.5" fill="rgba(255,255,255,0.95)" />
            <circle cx="-17.3" cy="-2" r="1.5" fill="rgba(5,15,40,0.98)" />
            <circle cx="-17.8" cy="-2.6" r="0.5" fill="rgba(255,255,255,0.95)" />
          </g>
        </g>

        {/* Fish 2 — Large vivid orange koi, swims left */}
        <g className="dt-fish-swim-l1" style={{ animationDuration: '18s', animationDelay: '-3s' }}>
          <g transform="translate(720, 150)" className="dt-fish-bob uw-fish-body-swim" style={{ animationDelay: '-1.2s' }}>
            <ellipse cx="0" cy="0" rx="26" ry="10" fill="url(#fishOrange)" />
            <ellipse cx="-3" cy="3" rx="15" ry="4.5" fill="rgba(255,200,150,0.4)" />
            <path d="M-10 -10 Q-3 -20, 8 -18 Q14 -14, 16 -10" fill="rgba(239,68,68,0.85)" />
            {/* Tail fin with wagging animation */}
            <path d="M23 0 L36 -13 L32 0 L36 13 L23 0 Z" fill="rgba(220,38,38,0.9)" className="uw-fish-tail" style={{ transformOrigin: '23px 0px', animationDelay: '-0.2s' }} />
            <path d="M-6 4 Q-11 14, -4 14 Q0 11, 0 5" fill="rgba(234,88,12,0.65)" />
            <ellipse cx="-4" cy="-2" rx="6" ry="3.5" fill="rgba(255,255,255,0.88)" />
            <ellipse cx="9" cy="1" rx="4.5" ry="2.5" fill="rgba(255,255,255,0.8)" />
            <ellipse cx="-14" cy="1" rx="3" ry="2" fill="rgba(255,255,255,0.75)" />
            <circle cx="-18" cy="-2" r="2.8" fill="rgba(255,255,255,0.95)" />
            <circle cx="-18.4" cy="-2" r="1.7" fill="rgba(10,5,0,0.98)" />
            <circle cx="-18.9" cy="-2.6" r="0.55" fill="rgba(255,255,255,0.95)" />
          </g>
        </g>

        {/* Fish 3 — Medium gold/yellow, swims right, upper */}
        <g className="dt-fish-swim-r2" style={{ animationDuration: '12s', animationDelay: '-7s' }}>
          <g transform="translate(320, 80)" className="dt-fish-bob uw-fish-body-swim" style={{ animationDelay: '-0.7s' }}>
            <ellipse cx="0" cy="0" rx="16" ry="6.5" fill="url(#fishGold)" />
            <ellipse cx="-2" cy="2" rx="9" ry="3" fill="rgba(255,220,180,0.4)" />
            <path d="M-6 -6 Q-1 -12, 5 -11 Q9 -8, 11 -6" fill="rgba(245,158,11,0.8)" />
            <path d="M14 0 L21 -8 L18 0 L21 8 L14 0 Z" fill="rgba(234,88,12,0.85)" className="uw-fish-tail" style={{ transformOrigin: '14px 0px', animationDelay: '-0.4s' }} />
            <circle cx="-10" cy="-1.5" r="2" fill="rgba(255,255,255,0.95)" />
            <circle cx="-10.3" cy="-1.5" r="1.2" fill="rgba(5,15,40,0.98)" />
            <circle cx="-10.7" cy="-2" r="0.4" fill="rgba(255,255,255,0.95)" />
          </g>
        </g>

        {/* Fish 4 — Orange, lower area, swims left */}
        <g className="dt-fish-swim-l2" style={{ animationDuration: '20s', animationDelay: '-10s' }}>
          <g transform="translate(550, 270)" className="dt-fish-bob uw-fish-body-swim" style={{ animationDelay: '-2s' }}>
            <ellipse cx="0" cy="0" rx="18" ry="7" fill="url(#fishOrange)" />
            <ellipse cx="-2" cy="2" rx="10" ry="3" fill="rgba(255,200,150,0.3)" />
            <path d="M-6 -7 Q-2 -13, 5 -11 Q9 -8, 11 -7" fill="rgba(239,68,68,0.8)" />
            <path d="M16 0 L25 -9 L22 0 L25 9 L16 0 Z" fill="rgba(220,38,38,0.88)" className="uw-fish-tail" style={{ transformOrigin: '16px 0px', animationDelay: '-0.1s' }} />
            <ellipse cx="2" cy="-1" rx="5" ry="2.5" fill="rgba(255,255,255,0.7)" />
            <circle cx="-12" cy="-1.5" r="2.2" fill="rgba(255,255,255,0.95)" />
            <circle cx="-12.3" cy="-1.5" r="1.3" fill="rgba(10,5,0,0.98)" />
          </g>
        </g>

        {/* Fish 5 — Large silver, swims right, mid-lower */}
        <g className="dt-fish-swim-r3" style={{ animationDuration: '16s', animationDelay: '-5s' }}>
          <g transform="translate(200, 230)" className="dt-fish-bob uw-fish-body-swim" style={{ animationDelay: '-1.8s' }}>
            <ellipse cx="0" cy="0" rx="22" ry="8" fill="url(#fishSilver)" />
            <ellipse cx="-3" cy="2" rx="12" ry="3.5" fill="rgba(255,255,255,0.3)" />
            <path d="M-8 -8 Q-2 -15, 7 -13 Q12 -10, 14 -8" fill="rgba(186,198,217,0.75)" />
            <path d="M20 0 L30 -10 L27 0 L30 10 L20 0 Z" fill="rgba(203,213,225,0.8)" className="uw-fish-tail" style={{ transformOrigin: '20px 0px', animationDelay: '-0.3s' }} />
            <line x1="-12" y1="0" x2="16" y2="-1" stroke="rgba(255,255,255,0.32)" strokeWidth="0.5" strokeDasharray="2 1.5" />
            <circle cx="-15" cy="-2" r="2.4" fill="rgba(255,255,255,0.95)" />
            <circle cx="-15.3" cy="-2" r="1.4" fill="rgba(5,15,40,0.98)" />
            <circle cx="-15.8" cy="-2.5" r="0.45" fill="rgba(255,255,255,0.95)" />
          </g>
        </g>

        {/* Fish 6 — Tiny orange, swims right, top */}
        <g className="dt-fish-swim-r1" style={{ animationDuration: '11s', animationDelay: '-2s' }}>
          <g transform="translate(650, 55)" className="dt-fish-bob uw-fish-body-swim" style={{ animationDelay: '-0.4s' }}>
            <ellipse cx="0" cy="0" rx="10" ry="4" fill="url(#fishOrange)" />
            <path d="M8 0 L14 -5 L12 0 L14 5 L8 0 Z" fill="rgba(220,38,38,0.88)" className="uw-fish-tail" style={{ transformOrigin: '8px 0px', animationDelay: '-0.5s' }} />
            <circle cx="-6" cy="-1" r="1.4" fill="rgba(255,255,255,0.9)" />
            <circle cx="-6.2" cy="-1" r="0.8" fill="rgba(5,15,40,0.95)" />
          </g>
        </g>

        {/* Fish 7 — Small gold, swims left, upper-right */}
        <g className="dt-fish-swim-l2" style={{ animationDuration: '15s', animationDelay: '-8s' }}>
          <g transform="translate(820, 110)" className="dt-fish-bob uw-fish-body-swim" style={{ animationDelay: '-2.5s' }}>
            <ellipse cx="0" cy="0" rx="13" ry="5" fill="url(#fishGold)" />
            <path d="M11 0 L18 -6 L16 0 L18 6 L11 0 Z" fill="rgba(234,88,12,0.82)" className="uw-fish-tail" style={{ transformOrigin: '11px 0px', animationDelay: '-0.6s' }} />
            <circle cx="-8" cy="-1.2" r="1.7" fill="rgba(255,255,255,0.9)" />
            <circle cx="-8.3" cy="-1.2" r="1" fill="rgba(5,15,40,0.95)" />
          </g>
        </g>

        {/* ── Rising bubbles — glassy, clearly visible ── */}
        <circle r="5" fill="rgba(186,230,253,0.15)" stroke="rgba(224,242,254,0.6)" strokeWidth="1.2">
          <animate attributeName="cy" values="390;20" dur="10s" repeatCount="indefinite" />
          <animate attributeName="cx" values="150;157" dur="10s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.85;0.4;0" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle r="4" fill="rgba(186,230,253,0.12)" stroke="rgba(224,242,254,0.55)" strokeWidth="1">
          <animate attributeName="cy" values="395;30" dur="13s" repeatCount="indefinite" begin="-4s" />
          <animate attributeName="cx" values="480;475" dur="13s" repeatCount="indefinite" begin="-4s" />
          <animate attributeName="opacity" values="0.8;0.3;0" dur="13s" repeatCount="indefinite" begin="-4s" />
        </circle>
        <circle r="6" fill="rgba(186,230,253,0.14)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3">
          <animate attributeName="cy" values="390;15" dur="12s" repeatCount="indefinite" begin="-7s" />
          <animate attributeName="cx" values="800;806" dur="12s" repeatCount="indefinite" begin="-7s" />
          <animate attributeName="opacity" values="0.9;0.45;0" dur="12s" repeatCount="indefinite" begin="-7s" />
        </circle>
        <circle r="3.5" fill="rgba(186,230,253,0.12)" stroke="rgba(224,242,254,0.5)" strokeWidth="0.9">
          <animate attributeName="cy" values="395;40" dur="16s" repeatCount="indefinite" begin="-2s" />
          <animate attributeName="cx" values="340;336" dur="16s" repeatCount="indefinite" begin="-2s" />
          <animate attributeName="opacity" values="0.75;0.28;0" dur="16s" repeatCount="indefinite" begin="-2s" />
        </circle>
        <circle r="4.5" fill="rgba(186,230,253,0.13)" stroke="rgba(224,242,254,0.52)" strokeWidth="1">
          <animate attributeName="cy" values="400;50" dur="14s" repeatCount="indefinite" begin="-9s" />
          <animate attributeName="cx" values="640;645" dur="14s" repeatCount="indefinite" begin="-9s" />
          <animate attributeName="opacity" values="0.82;0.35;0" dur="14s" repeatCount="indefinite" begin="-9s" />
        </circle>
        <circle r="2.8" fill="rgba(186,230,253,0.1)" stroke="rgba(224,242,254,0.48)" strokeWidth="0.8">
          <animate attributeName="cy" values="400;70" dur="19s" repeatCount="indefinite" begin="-12s" />
          <animate attributeName="cx" values="900;895" dur="19s" repeatCount="indefinite" begin="-12s" />
          <animate attributeName="opacity" values="0.7;0.2;0" dur="19s" repeatCount="indefinite" begin="-12s" />
        </circle>
      </svg>
    </div>
  );
};

export default DigitalTwinScene;
