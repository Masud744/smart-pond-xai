import React from 'react';

/**
 * RealisticSeaweed — Leafy seaweed plant matching reference image.
 * Each leaf sways independently for a wave-like undercurrent effect.
 */
const RealisticSeaweed = ({ x, y, scale = 1, delay = '0s' }) => {
  return (
    <g
      className="uw-kelp-sway"
      style={{ transformOrigin: `${x}px ${y}px`, animationDelay: delay }}
      opacity="0.92"
    >
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        <path d="M 0,0 Q -12,-80 5,-160 T -5,-300 T 0,-400" fill="none" stroke="url(#stemGrad)" strokeWidth="5.5" strokeLinecap="round" />

        <g className="uw-leaf-left" style={{ transformOrigin: '0px -30px', animationDelay: `calc(${delay} - 0.5s)` }}>
          <path d="M -2,-30 C -25,-32 -38,-15 -28,8 C -18,18 -10,8 -2,-30 Z" fill="url(#leafDark)" />
          <path d="M -2,-30 C -14,-22 -22,-8 -18,6 C -14,12 -5,6 -2,-30 Z" fill="url(#leafLight)" />
          <path d="M -2,-30 Q -15,-10 -18,6" fill="none" stroke="#051f0c" strokeWidth="1.2" opacity="0.75" />
        </g>
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -55px', animationDelay: `calc(${delay} - 1.2s)` }}>
          <path d="M 2,-55 C 24,-58 38,-42 28,-18 C 18,-8 10,-18 2,-55 Z" fill="url(#leafDark)" />
          <path d="M 2,-55 C 14,-48 24,-32 18,-18 C 12,-10 4,-14 2,-55 Z" fill="url(#leafLight)" />
          <path d="M 2,-55 Q 14,-35 18,-18" fill="none" stroke="#051f0c" strokeWidth="1.2" opacity="0.75" />
        </g>
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -95px', animationDelay: `calc(${delay} - 0.8s)` }}>
          <path d="M -3,-95 C -32,-102 -50,-82 -40,-55 C -30,-42 -18,-55 -3,-95 Z" fill="url(#leafDark)" />
          <path d="M -3,-95 C -20,-88 -32,-68 -28,-55 C -24,-45 -10,-50 -3,-95 Z" fill="url(#leafLight)" />
          <path d="M -3,-95 Q -20,-72 -28,-55" fill="none" stroke="#051f0c" strokeWidth="1.3" opacity="0.75" />
        </g>
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -120px', animationDelay: `calc(${delay} - 1.8s)` }}>
          <path d="M 3,-120 C 32,-128 50,-108 40,-80 C 30,-68 18,-80 3,-120 Z" fill="url(#leafDark)" />
          <path d="M 3,-120 C 20,-112 32,-92 28,-80 C 24,-70 10,-75 3,-120 Z" fill="url(#leafLight)" />
          <path d="M 3,-120 Q 20,-98 28,-80" fill="none" stroke="#051f0c" strokeWidth="1.3" opacity="0.75" />
        </g>
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -165px', animationDelay: `calc(${delay} - 0.2s)` }}>
          <path d="M -4,-165 C -38,-178 -56,-154 -44,-122 C -34,-102 -18,-122 -4,-165 Z" fill="url(#leafDark)" />
          <path d="M -4,-165 C -22,-152 -36,-132 -32,-122 C -28,-110 -10,-120 -4,-165 Z" fill="url(#leafLight)" />
          <path d="M -4,-165 Q -22,-138 -32,-122" fill="none" stroke="#051f0c" strokeWidth="1.4" opacity="0.75" />
        </g>
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -190px', animationDelay: `calc(${delay} - 2.1s)` }}>
          <path d="M 4,-190 C 38,-202 56,-178 44,-146 C 34,-126 18,-146 4,-190 Z" fill="url(#leafDark)" />
          <path d="M 4,-190 C 22,-178 36,-158 32,-146 C 28,-134 10,-140 4,-190 Z" fill="url(#leafLight)" />
          <path d="M 4,-190 Q 22,-163 32,-146" fill="none" stroke="#051f0c" strokeWidth="1.4" opacity="0.75" />
        </g>
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -240px', animationDelay: `calc(${delay} - 1.1s)` }}>
          <path d="M -3,-240 C -34,-254 -48,-230 -38,-202 C -28,-188 -15,-202 -3,-240 Z" fill="url(#leafDark)" />
          <path d="M -3,-240 C -18,-230 -30,-210 -26,-202 C -22,-192 -8,-204 -3,-240 Z" fill="url(#leafLight)" />
          <path d="M -3,-240 Q -18,-214 -26,-202" fill="none" stroke="#051f0c" strokeWidth="1.4" opacity="0.75" />
        </g>
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -265px', animationDelay: `calc(${delay} - 2.5s)` }}>
          <path d="M 3,-265 C 34,-278 48,-254 38,-226 C 28,-212 15,-226 3,-265 Z" fill="url(#leafDark)" />
          <path d="M 3,-265 C 18,-254 30,-234 26,-226 C 22,-216 8,-222 3,-265 Z" fill="url(#leafLight)" />
          <path d="M 3,-265 Q 18,-238 26,-226" fill="none" stroke="#051f0c" strokeWidth="1.4" opacity="0.75" />
        </g>
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -310px', animationDelay: `calc(${delay} - 0.4s)` }}>
          <path d="M -2,-310 C -25,-324 -35,-304 -28,-280 C -21,-265 -10,-280 -2,-310 Z" fill="url(#leafDark)" />
          <path d="M -2,-310 C -14,-300 -24,-286 -20,-280 C -16,-274 -5,-282 -2,-310 Z" fill="url(#leafLight)" />
        </g>
        <g className="uw-leaf-right" style={{ transformOrigin: '0px -330px', animationDelay: `calc(${delay} - 1.5s)` }}>
          <path d="M 2,-330 C 25,-344 35,-324 28,-300 C 21,-285 10,-300 2,-330 Z" fill="url(#leafDark)" />
          <path d="M 2,-330 C 14,-320 24,-306 20,-300 C 16,-294 5,-302 2,-330 Z" fill="url(#leafLight)" />
        </g>
        <g className="uw-leaf-left" style={{ transformOrigin: '0px -355px', animationDelay: `calc(${delay} - 0.9s)` }}>
          <path d="M 0,-355 C -15,-380 -20,-402 -5,-415 C 5,-400 12,-382 0,-355 Z" fill="url(#leafLight)" />
          <path d="M 0,-355 C 15,-380 20,-402 5,-415 C -5,-400 -12,-382 0,-355 Z" fill="url(#leafDark)" />
        </g>
      </g>
    </g>
  );
};

/**
 * UnderwaterBackground — Full-viewport realistic deep sea/ocean scene.
 * Layered ocean gradient, sandy seafloor, rocks, coral, god-rays,
 * forward-facing swimming fish, plankton particles, and rising bubbles.
 */
const UnderwaterBackground = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── Layered deep ocean gradient ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          linear-gradient(180deg,
            #006994 0%,
            #005580 8%,
            #004066 18%,
            #002d52 32%,
            #001f3d 48%,
            #001230 65%,
            #00091f 80%,
            #000510 92%,
            #000208 100%
          )
        `,
      }} />

      {/* ── Water surface shimmer band ── */}
      <div className="dt-sunlight-glow" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '28%',
        background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(0,180,220,0.35) 0%, rgba(0,120,180,0.18) 40%, transparent 80%)',
      }} />

      {/* ── Caustic light pattern (moving lines) ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
        backgroundImage: 'repeating-linear-gradient(80deg, transparent, transparent 18px, rgba(100,220,255,0.04) 20px)',
        animation: 'causticShimmer 6s ease-in-out infinite',
      }} />

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          {/* ── God-ray gradients ── */}
          <linearGradient id="ray1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(120,220,255,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="ray2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(160,230,255,0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="ray3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(80,200,240,0.14)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* ── Sandy seafloor gradient ── */}
          <linearGradient id="seafloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2a10" />
            <stop offset="30%" stopColor="#2a3a15" />
            <stop offset="100%" stopColor="#0d1a08" />
          </linearGradient>

          {/* ── Rock gradient ── */}
          <linearGradient id="rockGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a3520" />
            <stop offset="100%" stopColor="#111810" />
          </linearGradient>

          {/* ── Coral gradients ── */}
          <linearGradient id="coral1" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#7a1a30" />
            <stop offset="100%" stopColor="#d4406a" />
          </linearGradient>
          <linearGradient id="coral2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#8a3300" />
            <stop offset="100%" stopColor="#ff7a30" />
          </linearGradient>
          <linearGradient id="coral3" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1a5a50" />
            <stop offset="100%" stopColor="#40c0a0" />
          </linearGradient>
          <linearGradient id="coralFan" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#6a1060" />
            <stop offset="100%" stopColor="#d060c0" />
          </linearGradient>

          {/* ── Seaweed gradients ── */}
          <linearGradient id="stemGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#071d0b" />
            <stop offset="100%" stopColor="#154421" />
          </linearGradient>
          <linearGradient id="leafDark" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#08250f" />
            <stop offset="60%" stopColor="#123d1b" />
            <stop offset="100%" stopColor="#1a4f25" />
          </linearGradient>
          <linearGradient id="leafLight" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1c5528" />
            <stop offset="50%" stopColor="#3c9254" />
            <stop offset="100%" stopColor="#5eb877" />
          </linearGradient>

          {/* ── Fish gradients ── */}
          <linearGradient id="fishTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(80,180,200,0.75)" />
            <stop offset="100%" stopColor="rgba(40,130,160,0.65)" />
          </linearGradient>
          <linearGradient id="fishSilverUw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(200,225,240,0.78)" />
            <stop offset="100%" stopColor="rgba(140,180,210,0.65)" />
          </linearGradient>
          <linearGradient id="fishOrangeUw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(240,130,40,0.8)" />
            <stop offset="100%" stopColor="rgba(200,80,10,0.7)" />
          </linearGradient>
          <linearGradient id="fishDeep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(100,140,200,0.7)" />
            <stop offset="100%" stopColor="rgba(60,90,160,0.55)" />
          </linearGradient>

          {/* ── Depth vignette ── */}
          <linearGradient id="depthVig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="70%" stopColor="rgba(0,8,20,0.3)" />
            <stop offset="100%" stopColor="rgba(0,4,12,0.7)" />
          </linearGradient>
        </defs>

        {/* ══════ GOD-RAYS FROM SURFACE ══════ */}
        <polygon points="200,0 380,0 520,900 80,900" fill="url(#ray1)" className="uw-ray" />
        <polygon points="550,0 700,0 820,900 440,900" fill="url(#ray2)" className="uw-ray" style={{ animationDelay: '-2.5s' }} />
        <polygon points="900,0 1050,0 1160,900 800,900" fill="url(#ray3)" className="uw-ray" style={{ animationDelay: '-5s' }} />
        <polygon points="1250,0 1380,0 1480,900 1160,900" fill="url(#ray2)" className="uw-ray" style={{ animationDelay: '-1s' }} />
        <polygon points="1580,0 1720,0 1820,900 1500,900" fill="url(#ray1)" className="uw-ray" style={{ animationDelay: '-4s' }} />

        {/* ══════ SEAFLOOR ══════ */}
        {/* Main seafloor bed */}
        <ellipse cx="960" cy="1100" rx="1100" ry="120" fill="url(#seafloor)" opacity="0.95" />
        {/* Sandy ripple details */}
        <ellipse cx="400" cy="1040" rx="220" ry="22" fill="rgba(25,40,14,0.55)" />
        <ellipse cx="900" cy="1055" rx="180" ry="18" fill="rgba(25,40,14,0.45)" />
        <ellipse cx="1450" cy="1045" rx="250" ry="20" fill="rgba(25,40,14,0.5)" />

        {/* ── Rocks / boulders ── */}
        <ellipse cx="280" cy="1020" rx="95" ry="60" fill="url(#rockGrad)" opacity="0.9" />
        <ellipse cx="310" cy="1000" rx="70" ry="45" fill="rgba(42,58,30,0.8)" />
        <ellipse cx="1640" cy="1015" rx="110" ry="65" fill="url(#rockGrad)" opacity="0.88" />
        <ellipse cx="1600" cy="995" rx="75" ry="50" fill="rgba(38,50,25,0.75)" />
        <ellipse cx="980" cy="1030" rx="60" ry="38" fill="url(#rockGrad)" opacity="0.82" />
        <ellipse cx="700" cy="1025" rx="48" ry="30" fill="url(#rockGrad)" opacity="0.75" />

        {/* ══════ CORAL FORMATIONS ══════ */}
        {/* Left coral cluster */}
        <g opacity="0.92">
          {/* Branch coral 1 */}
          <path d="M 150,1000 Q 135,950 145,900 Q 155,850 140,800" fill="none" stroke="url(#coral1)" strokeWidth="10" strokeLinecap="round" />
          <path d="M 145,900 Q 120,880 110,850" fill="none" stroke="url(#coral1)" strokeWidth="7" strokeLinecap="round" />
          <path d="M 145,900 Q 168,875 175,840" fill="none" stroke="url(#coral1)" strokeWidth="7" strokeLinecap="round" />
          <path d="M 140,850 Q 125,825 118,800" fill="none" stroke="url(#coral1)" strokeWidth="5" strokeLinecap="round" />
          <path d="M 140,850 Q 158,820 165,795" fill="none" stroke="url(#coral1)" strokeWidth="5" strokeLinecap="round" />
          {/* Fan coral */}
          <ellipse cx="105" cy="960" rx="55" ry="75" fill="none" stroke="url(#coralFan)" strokeWidth="2.5" opacity="0.7" />
          <ellipse cx="105" cy="960" rx="35" ry="52" fill="none" stroke="url(#coralFan)" strokeWidth="2" opacity="0.5" />
          {/* Orange finger coral */}
          <path d="M 210,1000 Q 215,960 208,920 Q 200,880 210,840" fill="none" stroke="url(#coral2)" strokeWidth="9" strokeLinecap="round" />
          <path d="M 208,920 Q 195,900 190,870" fill="none" stroke="url(#coral2)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 208,920 Q 225,895 230,860" fill="none" stroke="url(#coral2)" strokeWidth="6" strokeLinecap="round" />
          {/* Green coral */}
          <path d="M 80,1000 Q 75,970 82,940" fill="none" stroke="url(#coral3)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 82,940 Q 65,920 60,900" fill="none" stroke="url(#coral3)" strokeWidth="5" strokeLinecap="round" />
          <path d="M 82,940 Q 98,918 100,895" fill="none" stroke="url(#coral3)" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Right coral cluster */}
        <g opacity="0.9">
          <path d="M 1780,1000 Q 1790,945 1778,890 Q 1765,835 1780,785" fill="none" stroke="url(#coral1)" strokeWidth="11" strokeLinecap="round" />
          <path d="M 1778,890 Q 1755,865 1748,830" fill="none" stroke="url(#coral1)" strokeWidth="7" strokeLinecap="round" />
          <path d="M 1778,890 Q 1805,860 1812,825" fill="none" stroke="url(#coral1)" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="1840" cy="955" rx="60" ry="80" fill="none" stroke="url(#coralFan)" strokeWidth="2.8" opacity="0.68" />
          <ellipse cx="1840" cy="955" rx="38" ry="55" fill="none" stroke="url(#coralFan)" strokeWidth="2" opacity="0.48" />
          <path d="M 1840,1000 Q 1845,965 1838,930" fill="none" stroke="url(#coral2)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 1838,930 Q 1822,908 1818,880" fill="none" stroke="url(#coral2)" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 1838,930 Q 1858,905 1862,875" fill="none" stroke="url(#coral2)" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 1710,1000 Q 1708,968 1715,935" fill="none" stroke="url(#coral3)" strokeWidth="9" strokeLinecap="round" />
          <path d="M 1715,935 Q 1698,912 1695,885" fill="none" stroke="url(#coral3)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 1715,935 Q 1735,910 1738,882" fill="none" stroke="url(#coral3)" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Mid coral ── */}
        <g opacity="0.78">
          <path d="M 960,1030 Q 958,995 965,960" fill="none" stroke="url(#coral2)" strokeWidth="7" strokeLinecap="round" />
          <path d="M 965,960 Q 948,940 944,918" fill="none" stroke="url(#coral2)" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 965,960 Q 982,938 985,915" fill="none" stroke="url(#coral2)" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 540,1030 Q 538,998 544,968" fill="none" stroke="url(#coral1)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 544,968 Q 526,945 522,920" fill="none" stroke="url(#coral1)" strokeWidth="5" strokeLinecap="round" />
          <path d="M 544,968 Q 564,942 567,916" fill="none" stroke="url(#coral1)" strokeWidth="5" strokeLinecap="round" />
          <path d="M 1380,1030 Q 1378,992 1385,955" fill="none" stroke="url(#coral3)" strokeWidth="9" strokeLinecap="round" />
          <path d="M 1385,955 Q 1365,930 1360,900" fill="none" stroke="url(#coral3)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 1385,955 Q 1408,928 1412,897" fill="none" stroke="url(#coral3)" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* ══════ REALISTIC SEAWEED PLANTS ══════ */}
        <RealisticSeaweed x={120} y={1000} scale={2.3} delay="0s" />
        <RealisticSeaweed x={240} y={1000} scale={1.85} delay="-2s" />
        <RealisticSeaweed x={340} y={1000} scale={1.4} delay="-4s" />
        <RealisticSeaweed x={1760} y={1000} scale={2.1} delay="-1.5s" />
        <RealisticSeaweed x={1640} y={1000} scale={1.65} delay="-3.5s" />
        <RealisticSeaweed x={800} y={1000} scale={1.2} delay="-1s" />
        <RealisticSeaweed x={1120} y={1000} scale={1.0} delay="-3s" />

        {/* ══════ REALISTIC FISH WITH CORRECT FACING DIRECTION ══════ */}

        {/* Fish 1 — large teal, right-facing, mid area */}
        <g className="uw-fish-swim-r1" style={{ animationDelay: '0s' }}>
          <g transform="translate(0, 500)" className="uw-fish-bob uw-fish-body-swim">
            <ellipse cx="0" cy="0" rx="32" ry="12" fill="url(#fishTeal)" />
            <ellipse cx="4" cy="2" rx="18" ry="5.5" fill="rgba(180,240,255,0.2)" />
            <path d="M-12 -12 Q-4 -24, 8 -22 Q18 -16, 22 -12" fill="rgba(60,160,180,0.75)" />
            <path d="M-5 5 Q-10 18, -3 19 Q2 16, 2 6" fill="rgba(60,160,180,0.55)" />
            <path d="M30 0 L44 -15 L40 0 L44 15 L30 0 Z" fill="rgba(50,140,170,0.82)" className="uw-fish-tail" style={{ transformOrigin: '30px 0px' }} />
            <line x1="-20" y1="0" x2="24" y2="-1" stroke="rgba(200,240,255,0.3)" strokeWidth="0.7" strokeDasharray="4 3" />
            <circle cx="-22" cy="-3" r="3.5" fill="rgba(255,255,255,0.92)" />
            <circle cx="-22.5" cy="-3" r="2" fill="rgba(10,20,40,0.97)" />
            <circle cx="-23.2" cy="-3.8" r="0.7" fill="rgba(255,255,255,0.9)" />
          </g>
        </g>

        {/* Fish 2 — silver, left-facing, upper */}
        <g className="uw-fish-swim-l1" style={{ animationDelay: '-12s' }}>
          <g transform="translate(0, 320)" className="uw-fish-bob uw-fish-body-swim" style={{ animationDelay: '-1s' }}>
            <ellipse cx="0" cy="0" rx="26" ry="10" fill="url(#fishSilverUw)" />
            <ellipse cx="2" cy="2" rx="15" ry="4.5" fill="rgba(230,248,255,0.22)" />
            <path d="M-10 -10 Q-3 -20, 8 -18 Q14 -14, 16 -10" fill="rgba(170,210,230,0.72)" />
            <path d="M24 0 L36 -13 L32 0 L36 13 L24 0 Z" fill="rgba(160,200,225,0.82)" className="uw-fish-tail" style={{ transformOrigin: '24px 0px', animationDelay: '-0.2s' }} />
            <line x1="-16" y1="0" x2="18" y2="-1" stroke="rgba(220,245,255,0.35)" strokeWidth="0.6" strokeDasharray="3 2" />
            <circle cx="-18" cy="-2" r="2.8" fill="rgba(255,255,255,0.92)" />
            <circle cx="-18.4" cy="-2" r="1.6" fill="rgba(8,15,35,0.97)" />
            <circle cx="-18.9" cy="-2.6" r="0.5" fill="rgba(255,255,255,0.9)" />
          </g>
        </g>

        {/* Fish 3 — orange, right-facing, lower */}
        <g className="uw-fish-swim-r2" style={{ animationDelay: '-8s' }}>
          <g transform="translate(0, 720)" className="uw-fish-bob uw-fish-body-swim" style={{ animationDelay: '-2s' }}>
            <ellipse cx="0" cy="0" rx="22" ry="8.5" fill="url(#fishOrangeUw)" />
            <ellipse cx="3" cy="2.5" rx="12" ry="4" fill="rgba(255,180,100,0.22)" />
            <path d="M-8 -8.5 Q-2 -17, 7 -15 Q13 -11, 15 -8.5" fill="rgba(220,70,10,0.78)" />
            <path d="M-4 4 Q-9 14, -2 15 Q1 12, 1 4.5" fill="rgba(220,70,10,0.5)" />
            <path d="M20 0 L30 -11 L27 0 L30 11 L20 0 Z" fill="rgba(200,55,8,0.88)" className="uw-fish-tail" style={{ transformOrigin: '20px 0px', animationDelay: '-0.3s' }} />
            <ellipse cx="-2" cy="-2" rx="5.5" ry="3" fill="rgba(255,255,255,0.72)" />
            <ellipse cx="8" cy="1" rx="4" ry="2" fill="rgba(255,255,255,0.65)" />
            <circle cx="-15" cy="-2" r="2.5" fill="rgba(255,255,255,0.92)" />
            <circle cx="-15.4" cy="-2" r="1.4" fill="rgba(8,5,0,0.97)" />
            <circle cx="-15.9" cy="-2.6" r="0.5" fill="rgba(255,255,255,0.88)" />
          </g>
        </g>

        {/* Fish 4 — deep blue, left-facing */}
        <g className="uw-fish-swim-l2" style={{ animationDelay: '-5s' }}>
          <g transform="translate(0, 600)" className="uw-fish-bob uw-fish-body-swim" style={{ animationDelay: '-3s' }}>
            <ellipse cx="0" cy="0" rx="28" ry="10.5" fill="url(#fishDeep)" />
            <ellipse cx="3" cy="2" rx="15" ry="4.5" fill="rgba(160,200,240,0.18)" />
            <path d="M-10 -10.5 Q-3 -21, 9 -19 Q15 -14, 17 -10.5" fill="rgba(80,110,180,0.75)" />
            <path d="M26 0 L38 -14 L34 0 L38 14 L26 0 Z" fill="rgba(65,92,170,0.85)" className="uw-fish-tail" style={{ transformOrigin: '26px 0px', animationDelay: '-0.15s' }} />
            <line x1="-18" y1="0" x2="20" y2="-1" stroke="rgba(180,215,250,0.28)" strokeWidth="0.7" strokeDasharray="4 2.5" />
            <circle cx="-20" cy="-2.5" r="3" fill="rgba(255,255,255,0.92)" />
            <circle cx="-20.4" cy="-2.5" r="1.8" fill="rgba(5,10,30,0.97)" />
            <circle cx="-21" cy="-3.2" r="0.6" fill="rgba(255,255,255,0.9)" />
          </g>
        </g>

        {/* Fish 5 — small teal, right-facing, top area */}
        <g className="uw-fish-swim-r2" style={{ animationDelay: '-18s' }}>
          <g transform="translate(0, 200)" className="uw-fish-bob uw-fish-body-swim" style={{ animationDelay: '-1.5s' }}>
            <ellipse cx="0" cy="0" rx="16" ry="6" fill="url(#fishTeal)" />
            <path d="M-6 -6 Q-2 -12, 5 -11 Q9 -8, 11 -6" fill="rgba(60,160,180,0.7)" />
            <path d="M15 0 L22 -8 L19 0 L22 8 L15 0 Z" fill="rgba(50,140,165,0.82)" className="uw-fish-tail" style={{ transformOrigin: '15px 0px', animationDelay: '-0.4s' }} />
            <circle cx="-10" cy="-1.5" r="2" fill="rgba(255,255,255,0.92)" />
            <circle cx="-10.3" cy="-1.5" r="1.2" fill="rgba(8,15,35,0.97)" />
            <circle cx="-10.7" cy="-2" r="0.4" fill="rgba(255,255,255,0.88)" />
          </g>
        </g>

        {/* ── Depth overlay vignette ── */}
        <rect x="0" y="0" width="1920" height="1080" fill="url(#depthVig)" />

        {/* ══════ PLANKTON / FLOATING PARTICLES ══════ */}
        {[
          [320,280,-3], [680,180,-7], [1050,350,-2], [1380,220,-9], [850,450,-5],
          [420,650,-11], [1200,580,-4], [1600,300,-8], [240,780,-6], [760,820,-14],
          [1480,700,-1], [940,650,-10], [100,400,-13], [1700,500,-3], [570,380,-12],
        ].map(([cx, cy, delay], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.8" fill="rgba(180,230,255,0.45)"
            className="uw-caustic"
            style={{ animationDelay: `${delay}s`, animationDuration: `${5 + (i % 4)}s` }}
          />
        ))}

        {/* ── Rising bubbles columns ── */}
        {[
          [80, 17, 0], [145, 21, -4], [215, 19, -8], [110, 23, -12],
          [900, 20, -6], [580, 22, -10], [1480, 27, -14], [1200, 18, -3],
          [1700, 24, -9], [400, 16, -5],
        ].map(([cx, dur, begin], i) => (
          <circle key={i} r={2.5 + (i % 3)} fill="rgba(180,230,255,0.14)" stroke="rgba(220,245,255,0.5)" strokeWidth="1">
            <animate attributeName="cy" values="1080;60" dur={`${dur}s`} repeatCount="indefinite" begin={`${begin}s`} />
            <animate attributeName="cx" values={`${cx};${cx + (i % 2 === 0 ? 8 : -6)}`} dur={`${dur}s`} repeatCount="indefinite" begin={`${begin}s`} />
            <animate attributeName="opacity" values="0.8;0.3;0" dur={`${dur}s`} repeatCount="indefinite" begin={`${begin}s`} />
          </circle>
        ))}

        {/* ── Caustic shimmer at surface ── */}
        <ellipse cx="500" cy="150" rx="400" ry="120" fill="rgba(80,200,240,0.05)" className="uw-caustic" />
        <ellipse cx="1400" cy="220" rx="300" ry="100" fill="rgba(60,180,220,0.04)" className="uw-caustic" style={{ animationDelay: '-3.5s' }} />
        <ellipse cx="950" cy="180" rx="250" ry="90" fill="rgba(100,220,255,0.035)" className="uw-caustic" style={{ animationDelay: '-7s' }} />
      </svg>
    </div>
  );
};

export default UnderwaterBackground;
