// fa-forest.jsx — a "living forest" ambient backdrop.
// Layers (back → front): canopy gradient wash · drifting light pools ·
// swaying tree-crown silhouettes · sweeping god-rays · dappled light through
// leaves · slow falling leaves · grain · frosted cream veil.
//
// Optional `videoSrc` plays a real forest clip behind the veil instead of the
// CSS canopy (loops, muted, cover). Honors prefers-reduced-motion and the
// `motion` tweak: off | barely | gentle | living.

// Seamless looping video via crossfade: two stacked copies of the clip;
// shortly before the active one ends we restart the other from 0 and dissolve
// between them, so the loop seam is never a hard cut.
// `endTrim` cuts dead time at the clip's tail (e.g. a fade-to-black) — we treat
// the effective end as duration - endTrim and never let a copy sit on the end.
function CrossfadeVideo({ src, fade = 0.8, endTrim = 0, startAt = 0, filter, style = {} }) {
  const aRef = React.useRef(null);
  const bRef = React.useRef(null);
  const activeRef = React.useRef('a');
  React.useEffect(() => {
    const va = aRef.current, vb = bRef.current;
    if (!va || !vb) return;
    [va, vb].forEach(v => { v.muted = true; v.loop = false; });
    va.style.opacity = '1'; vb.style.opacity = '0';
    const play = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    const endOf = (v) => (v.duration ? v.duration - endTrim : Infinity);
    const restart = (v) => { try { v.currentTime = startAt; } catch (e) {} };
    restart(va); play(va);
    let raf;
    const swap = () => {
      const cur = activeRef.current === 'a' ? va : vb;
      const nxt = activeRef.current === 'a' ? vb : va;
      restart(nxt); play(nxt);
      cur.style.opacity = '0'; nxt.style.opacity = '1';
      activeRef.current = activeRef.current === 'a' ? 'b' : 'a';
    };
    const tick = () => {
      const cur = activeRef.current === 'a' ? va : vb;
      const nxt = activeRef.current === 'a' ? vb : va;
      const end = endOf(cur);
      // keep the visible one playing if a stall paused it mid-segment
      if (cur.paused && cur.currentTime < end - fade) play(cur);
      // if we somehow overran into the dead tail, jump back immediately
      if (cur.currentTime >= end - 0.02 && nxt.paused) { swap(); }
      else if (cur.currentTime >= end - fade && nxt.paused) { swap(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // safety net: if a copy ever fires 'ended' (rAF was throttled), loop at once
    const onEnded = (e) => { e.target.style.opacity = '0'; swap(); };
    va.addEventListener('ended', onEnded);
    vb.addEventListener('ended', onEnded);
    const onVis = () => {
      if (document.hidden) { va.pause(); vb.pause(); }
      else play(activeRef.current === 'a' ? va : vb);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      va.removeEventListener('ended', onEnded);
      vb.removeEventListener('ended', onEnded);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [src, fade, endTrim, startAt]);
  const base = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'cover', transition: `opacity ${fade}s linear`, filter, ...style,
  };
  return (
    <React.Fragment>
      <video ref={aRef} src={src} muted playsInline preload="auto" style={base} />
      <video ref={bRef} src={src} muted playsInline preload="auto" style={base} />
    </React.Fragment>
  );
}

function ForestBackground({ motion = 'gentle', videoSrc = null }) {
  const animate = motion !== 'off';
  const lvl = { off: 0, barely: 1, gentle: 2, living: 3 }[motion] ?? 2;
  // duration multiplier — slower for "barely", a touch livelier for "living"
  const mul = motion === 'barely' ? 1.5 : motion === 'living' ? 0.82 : 1;
  const dur = (s) => `${(s * mul).toFixed(1)}s`;

  const blob = (c, w, h, top, left, anim, secs, blur = 46, op = 0.9) => ({
    position: 'absolute', width: w, height: h, top, left,
    borderRadius: '50%', background: c, filter: `blur(${blur}px)`,
    opacity: op, willChange: 'transform',
    animation: animate ? `${anim} ${dur(secs)} ease-in-out infinite alternate` : 'none',
  });

  // ── a soft organic tree-crown silhouette (cluster of blurred leaf blobs) ──
  const Crown = ({ w, h, top, left, fill, swayAnim, secs, delay = 0, blur = 9, op = 0.5, origin = 'top center' }) => (
    <div style={{
      position: 'absolute', width: w, height: h, top, left,
      transformOrigin: origin, willChange: 'transform',
      animation: animate ? `${swayAnim} ${dur(secs)} ease-in-out ${delay}s infinite alternate` : 'none',
    }}>
      <svg viewBox="0 0 200 160" width="100%" height="100%" style={{ filter: `blur(${blur}px)`, opacity: op, display: 'block' }}>
        <g fill={fill}>
          <ellipse cx="60" cy="60" rx="52" ry="44" />
          <ellipse cx="110" cy="48" rx="58" ry="50" />
          <ellipse cx="150" cy="70" rx="46" ry="40" />
          <ellipse cx="95" cy="90" rx="62" ry="46" />
          <ellipse cx="40" cy="96" rx="40" ry="36" />
          <ellipse cx="160" cy="104" rx="38" ry="34" />
        </g>
      </svg>
    </div>
  );

  // ── falling leaves (living only) ──
  const leafShape = (color) => (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <path d="M5 19 C5 11 11 5 19 5 C19 13 13 19 5 19Z M5 19 C9 15 13 11 17 7"
        fill={color} stroke="none" opacity="0.9" />
    </svg>
  );
  const leaves = lvl >= 3
    ? Array.from({ length: 6 }).map((_, i) => (
        <span key={i} style={{
          position: 'absolute', top: '-8%',
          left: `${10 + i * 15}%`,
          width: 13 + (i % 3) * 4, height: 13 + (i % 3) * 4,
          color: ['var(--moss)', 'var(--sage)', 'var(--honey)'][i % 3],
          opacity: 0.28, willChange: 'transform',
          animation: `faLeafFall ${dur(15 + i * 2.5)} linear ${-i * 3.5}s infinite`,
        }}>{leafShape('currentColor')}</span>
      ))
    : null;

  // soft floating motes (pollen / light) — living only
  const motes = lvl >= 3
    ? Array.from({ length: 7 }).map((_, i) => (
        <span key={'m' + i} className="fa-mote" style={{
          left: `${8 + i * 13}%`,
          bottom: `-${6 + (i % 3) * 4}%`,
          width: 5 + (i % 3) * 3, height: 5 + (i % 3) * 3,
          animationDuration: dur(16 + i * 3),
          animationDelay: `${-i * 4}s`,
        }} />
      ))
    : null;

  return (
    <div aria-hidden="true" style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'var(--canopy-base)', zIndex: 0,
    }}>
      {/* deep canopy gradient wash */}
      <div style={{ position: 'absolute', inset: -40, background: 'var(--canopy-wash)' }} />

      {/* drifting blurred light pools (depth) */}
      {lvl >= 1 && <div style={blob('var(--canopy-1)', 320, 320, '-14%', '-22%', 'faDrift1', 42)} />}
      {lvl >= 1 && <div style={blob('var(--canopy-3)', 360, 360, '44%', '-28%', 'faDrift3', 60)} />}
      {lvl >= 1 && <div style={blob('var(--canopy-1)', 280, 280, '62%', '48%', 'faDrift2', 48)} />}

      {/* optional real forest video, behind everything-but-wash */}
      {videoSrc && (
        <React.Fragment>
          <CrossfadeVideo src={videoSrc} fade={0.8}
            filter="saturate(1.32) contrast(1.05) brightness(1.04)" />
          {/* mossy tint to deepen the greens warmly */}
          <div style={{ position: 'absolute', inset: 0, background: 'var(--moss)', mixBlendMode: 'soft-light', opacity: 0.35 }} />
          {/* warm top + bottom vignette so chrome/nav stay legible */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(241,234,220,0.5) 0%, rgba(241,234,220,0) 22%, rgba(241,234,220,0) 74%, rgba(241,234,220,0.55) 100%)' }} />
        </React.Fragment>
      )}

      {/* swaying tree-crown silhouettes (no video) */}
      {!videoSrc && lvl >= 2 && (
        <React.Fragment>
          {/* top canopy — looking up into the crowns */}
          <Crown w="62%" h="42%" top="-18%" left="-12%" fill="var(--canopy-3)" swayAnim="faSwayA" secs={9} op={0.6} blur={10} />
          <Crown w="58%" h="40%" top="-20%" left="30%" fill="var(--canopy-1)" swayAnim="faSwayB" secs={11} delay={1.2} op={0.55} blur={11} />
          <Crown w="50%" h="36%" top="-15%" left="66%" fill="var(--canopy-3)" swayAnim="faSwayA" secs={10} delay={0.6} op={0.52} blur={10} />
          {/* lower side crowns for framing */}
          <Crown w="46%" h="34%" top="58%" left="-16%" fill="var(--canopy-3)" swayAnim="faSwayB" secs={13} delay={0.4} op={0.42} blur={13} origin="bottom center" />
          <Crown w="44%" h="32%" top="66%" left="74%" fill="var(--canopy-1)" swayAnim="faSwayA" secs={12} delay={1.6} op={0.4} blur={13} origin="bottom center" />
        </React.Fragment>
      )}

      {/* sweeping god-rays from upper canopy (CSS scene only) */}
      {!videoSrc && lvl >= 2 && (
        <React.Fragment>
          <div style={{
            position: 'absolute', top: '-12%', left: '14%', width: '34%', height: '90%',
            background: 'var(--canopy-shaft)', filter: 'blur(26px)',
            transform: 'rotate(12deg)', transformOrigin: 'top center',
            animation: animate ? `faGodray ${dur(16)} ease-in-out infinite alternate` : 'none',
          }} />
          <div style={{
            position: 'absolute', top: '-12%', left: '52%', width: '26%', height: '80%',
            background: 'var(--canopy-shaft)', filter: 'blur(30px)',
            transform: 'rotate(16deg)', transformOrigin: 'top center', opacity: 0.7,
            animation: animate ? `faGodray2 ${dur(21)} ease-in-out 1.5s infinite alternate` : 'none',
          }} />
        </React.Fragment>
      )}

      {/* warm top glow */}
      {!videoSrc && (
      <div style={{
        position: 'absolute', top: '-10%', left: '22%', width: '56%', height: '50%',
        background: 'var(--canopy-shaft)', filter: 'blur(30px)',
        transform: 'rotate(8deg)', opacity: 0.6,
        animation: animate ? `faGlow ${dur(20)} ease-in-out infinite alternate` : 'none',
      }} />
      )}

      {/* dappled light through moving leaves (CSS scene only) */}
      {!videoSrc && lvl >= 2 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: lvl >= 3 ? 9 : 6 }).map((_, i) => (
            <span key={'d' + i} style={{
              position: 'absolute',
              top: `${8 + (i * 37) % 70}%`, left: `${(i * 53 + 12) % 86}%`,
              width: 60 + (i % 3) * 26, height: 60 + (i % 3) * 26,
              borderRadius: '50%', background: 'var(--dapple)', filter: 'blur(22px)',
              willChange: 'opacity, transform',
              animation: animate ? `faDapple ${dur(7 + (i % 4) * 2)} ease-in-out ${-i * 1.3}s infinite` : 'none',
            }} />
          ))}
        </div>
      )}

      {!videoSrc && leaves}

      {/* lichen / paper grain (skip over video — it grays the footage) */}
      {!videoSrc && (
      <div style={{
        position: 'absolute', inset: 0, opacity: 'var(--grain-opacity)',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        mixBlendMode: 'multiply',
      }} />
      )}

      {/* frosted cream veil — lighter over video so the forest stays vivid */}
      <div style={{
        position: 'absolute', inset: 0,
        background: videoSrc ? 'rgba(244,239,228,0.22)' : 'var(--veil)',
        backdropFilter: videoSrc ? 'none' : 'blur(2px)',
        WebkitBackdropFilter: videoSrc ? 'none' : 'blur(2px)',
      }} />

      {!videoSrc && motes}
    </div>
  );
}

Object.assign(window, { ForestBackground, CrossfadeVideo });
