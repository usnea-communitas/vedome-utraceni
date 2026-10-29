// fa-wizard.jsx — "Kouzelnický" night-academy backdrop.
// Layers (back → front): night gradient · indigo light pools · twinkling
// stars · moon glow · castle silhouette with flickering windows · drifting
// mist · floating candle embers · grain · edge vignette.
// Mirrors ForestBackground's API (motion levels + optional videoSrc for a
// real castle loop later). Honors prefers-reduced-motion.

function WizardCastle({ animate, dur }) {
  // warm windows — a few flicker (class wz-win), staggered via inline delay; all
  // stay lit and still when motion is off
  const win = (x, y, w, h, flicker, delay) => (
    <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.3}
      fill="#F4C45A" className={flicker && animate ? 'wz-win' : undefined}
      style={flicker && animate ? { animationDelay: `${delay}s` } : undefined} />
  );
  return (
    <div style={{ position: 'absolute', left: '-3%', right: '-3%', bottom: 0, height: '52%' }}>
      <svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMax meet" width="100%" height="100%"
        style={{ position: 'absolute', bottom: 0, display: 'block' }}>
        {/* silhouette */}
        <g fill="#070A18">
          {/* base wall */}
          <rect x="0" y="150" width="400" height="80" />
          {/* left tower (conical) */}
          <rect x="34" y="104" width="30" height="80" />
          <polygon points="30,106 49,70 68,106" />
          {/* small crenellated tower */}
          <path d="M78 184 V120 h4 v-5 h4 v5 h4 v-5 h4 v5 h4 v64 Z" />
          {/* central keep */}
          <rect x="170" y="58" width="60" height="126" />
          <polygon points="166,60 200,12 234,60" />
          <rect x="199" y="2" width="2" height="14" />
          <polygon points="194,6 194,1 201,4" fill="#9B7327" />
          {/* mid tower */}
          <rect x="120" y="116" width="26" height="68" />
          <polygon points="116,118 133,90 150,118" />
          {/* right big tower */}
          <rect x="252" y="92" width="36" height="92" />
          <polygon points="248,94 270,56 292,94" />
          {/* right conical */}
          <rect x="300" y="110" width="28" height="74" />
          <polygon points="296,112 314,80 332,112" />
          {/* far-right crenellated */}
          <path d="M340 184 V128 h4 v-5 h4 v5 h4 v-5 h4 v5 h4 v56 Z" />
        </g>
        {/* cool rim light on roof edges */}
        <g stroke="rgba(150,170,220,0.32)" strokeWidth="1.1" fill="none" strokeLinejoin="round">
          <polyline points="30,106 49,70 68,106" />
          <polyline points="166,60 200,12 234,60" />
          <polyline points="116,118 133,90 150,118" />
          <polyline points="248,94 270,56 292,94" />
          <polyline points="296,112 314,80 332,112" />
        </g>
        {/* warm windows */}
        <g>
          {win(193, 74, 14, 22, true, 0)}
          {win(178, 104, 8, 12, true, 1.4)}
          {win(214, 104, 8, 12, false)}
          {win(195, 126, 10, 14, true, 0.6)}
          {win(45, 128, 8, 12, true, 2.1)}
          {win(46, 150, 8, 12, false)}
          {win(264, 116, 9, 13, true, 1.1)}
          {win(264, 140, 9, 13, false)}
          {win(309, 132, 7, 11, true, 2.6)}
          {win(127, 134, 7, 11, false)}
          {win(96, 168, 7, 12, true, 1.8)}
          {win(356, 150, 7, 12, false)}
          {win(150, 176, 8, 14, true, 0.9)}
          {win(238, 178, 8, 14, false)}
          {win(300, 178, 8, 14, true, 3.1)}
        </g>
      </svg>
    </div>
  );
}

function WizardBackground({ motion = 'gentle', videoSrc = null }) {
  const animate = motion !== 'off';
  const lvl = { off: 0, barely: 1, gentle: 2, living: 3 }[motion] ?? 2;
  const mul = motion === 'barely' ? 1.5 : motion === 'living' ? 0.82 : 1;
  const dur = (s) => `${(s * mul).toFixed(1)}s`;

  // deterministic stars in the upper ~58% (above the castle); in the calm scene
  // (motion off: reduced motion, Save-Data or the Tweaks panel) they stay, still
  const stars = Array.from({ length: lvl >= 3 ? 48 : 34 }).map((_, i) => {
    const x = (i * 53 + 11) % 100;
    const y = (i * 27 + 6) % 56;
    const sz = i % 7 === 0 ? 2.6 : i % 3 === 0 ? 1.7 : 1.1;
    return <span key={i} className="wz-star" style={{
      left: `${x}%`, top: `${y}%`, width: sz, height: sz,
      ...(animate
        ? { animationDuration: dur(2.6 + (i % 5)), animationDelay: `${-(i % 7) * 0.6}s` }
        : { animation: 'none', opacity: 0.45 + (i % 4) * 0.15 }),
    }} />;
  });

  const embers = lvl >= 3
    ? Array.from({ length: 7 }).map((_, i) => (
        <span key={'e' + i} className="wz-ember" style={{
          left: `${9 + i * 12.5}%`, bottom: `${10 + (i % 3) * 7}%`,
          width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2,
          animationDuration: dur(11 + i * 2),
          animationDelay: `${-i * 2.4}s`,
        }} />
      ))
    : null;

  const CF = window.CrossfadeVideo;

  return (
    <div aria-hidden="true" style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: '#0B0F22', zIndex: 0,
    }}>
      {/* night gradient */}
      <div style={{ position: 'absolute', inset: -40,
        background: 'radial-gradient(120% 82% at 70% -6%, #1E2750 0%, #131B38 44%, #0A0E20 100%)' }} />
      {/* indigo light pools (CSS scene only) */}
      {!videoSrc && lvl >= 2 && <div style={{ position: 'absolute', top: '-12%', left: '-16%', width: 300, height: 300,
        borderRadius: '50%', background: 'radial-gradient(circle,#2C3C82,transparent 68%)', filter: 'blur(52px)',
        opacity: 0.5, animation: animate ? `wzDrift1 ${dur(50)} ease-in-out infinite alternate` : 'none' }} />}
      {!videoSrc && lvl >= 2 && <div style={{ position: 'absolute', top: '26%', right: '-18%', width: 260, height: 260,
        borderRadius: '50%', background: 'radial-gradient(circle,#3C2A6A,transparent 68%)', filter: 'blur(52px)',
        opacity: 0.46, animation: animate ? `wzDrift2 ${dur(58)} ease-in-out infinite alternate` : 'none' }} />}
      {/* stars (CSS scene only) */}
      {!videoSrc && stars}
      {/* moon glow (CSS scene only) */}
      {!videoSrc && (
      <div style={{ position: 'absolute', top: '6%', right: '13%', width: 78, height: 78, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 36%, #FBF3D6 0%, #ECDBA4 44%, rgba(236,219,164,0) 72%)',
        boxShadow: '0 0 48px 16px rgba(243,230,184,0.22)',
        animation: animate ? `wzMoon ${dur(26)} ease-in-out infinite alternate` : 'none' }} />
      )}
      {/* optional real castle loop + grading so parchment cards pop */}
      {videoSrc && CF && (
        <React.Fragment>
          <CF src={videoSrc} fade={0.85} endTrim={0.5} filter="saturate(1.2) contrast(1.08) brightness(1.12)" style={{ opacity: 1, transform: 'scale(1.3) translateY(-17%)' }} />
          {/* darken status-bar strip (top) and nav + hide watermark (bottom) */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(7,9,22,0.34) 0%, rgba(7,9,22,0.06) 8%, rgba(7,9,22,0) 17%, rgba(7,9,22,0) 68%, rgba(7,9,22,0.4) 86%, rgba(7,9,22,0.72) 100%)' }} />
        </React.Fragment>
      )}
      {/* castle silhouette (CSS scene only) */}
      {!videoSrc && <WizardCastle animate={animate} dur={dur} />}
      {/* drifting mist near the base (CSS scene only) */}
      {!videoSrc && lvl >= 2 && <div style={{ position: 'absolute', left: 0, right: 0, bottom: '6%', height: '32%',
        background: 'linear-gradient(0deg, rgba(150,170,214,0.16), transparent)', filter: 'blur(9px)',
        animation: animate ? `wzMist ${dur(30)} ease-in-out infinite alternate` : 'none' }} />}
      {/* candle embers (CSS scene only) */}
      {!videoSrc && embers}
      {/* fine grain */}
      <div style={{ position: 'absolute', inset: 0, opacity: 'var(--grain-opacity)',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        mixBlendMode: 'overlay' }} />
      {/* edge vignette for focus */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 0 0 120px 26px rgba(4,6,16,0.55)' }} />
    </div>
  );
}

Object.assign(window, { WizardBackground });
