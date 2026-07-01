// fa-tree.jsx — animated "goal tree" v2: one branch per goal, foliage grows
// with progress, idly sways, taps open a detail bubble, completed goals get a
// sparkle crown, and deposits fire a little leaf-burst (event 'fa-goal-deposit').
// Large hero on Cíle; small clickable version on Přehled that links to Cíle.

const { useState: useTr, useEffect: useTrE } = React;

// branch geometry (base→tip path + foliage centre). First N used for N goals.
const TR_BRANCHES = [
  { d: 'M108 150 C 92 147 76 141 60 129', fx: 52, fy: 122 },
  { d: 'M112 143 C 130 139 148 133 164 121', fx: 172, fy: 114 },
  { d: 'M108 133 C 93 121 81 105 71 87',   fx: 63, fy: 79 },
  { d: 'M112 129 C 129 117 141 99 149 81', fx: 157, fy: 73 },
  { d: 'M110 126 C 110 106 110 94 110 75', fx: 110, fy: 62 },
];

// organic blob cluster (deep shadow → body → light tips)
const TR_BLOBS = [
  { dx: 0, dy: 4, r: 15.5, t: 'shade' },
  { dx: 0, dy: 0, r: 14.5, t: 'body' },
  { dx: -11.5, dy: 3, r: 10.5, t: 'body' },
  { dx: 11.5, dy: 3, r: 10.5, t: 'body' },
  { dx: -6, dy: -9.5, r: 9.5, t: 'lite' },
  { dx: 6.5, dy: -9, r: 9, t: 'lite' },
  { dx: 0, dy: -13, r: 6.5, t: 'lite' },
];

function Foliage({ cx, cy, pct, accent, delay, mini, dim, selected, onTap }) {
  const base = accentVar(accent);
  const s = 0.62 + 0.38 * Math.min(pct, 1);
  const full = pct >= 1;
  return (
    <g transform={`translate(${cx},${cy})`}
      className={'fa-tree-tip' + (mini ? ' is-mini' : '')}
      style={{ opacity: dim ? 0.45 : 1, transition: 'opacity .3s ease' }}
      onClick={mini ? undefined : (e) => { e.stopPropagation(); onTap && onTap(); }}>
      <g className="fa-tree-sway" style={{ animationDelay: `${-delay * 5}s`, animationDuration: `${6.5 + delay * 2}s` }}>
        <g style={{
          transformBox: 'fill-box', transformOrigin: 'center',
          transform: `scale(${s})`,
          transition: 'transform 1s cubic-bezier(.2,.8,.2,1)',
        }}>
          {TR_BLOBS.map((b, i) => (
            <circle key={i} cx={b.dx} cy={b.dy} r={b.r}
              fill={b.t === 'shade'
                ? `color-mix(in oklab, ${base}, #000 20%)`
                : b.t === 'lite'
                  ? `color-mix(in oklab, ${base}, #fff 16%)`
                  : base}
              opacity={b.t === 'shade' ? 0.55 : 0.95} />
          ))}
          <circle cx={-4.5} cy={-6.5} r={5} fill="rgba(255,255,255,0.28)" />
          {selected && <circle cx="0" cy="-1" r="19" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.7" />}
        </g>
        {!mini && (
          <text x="0" y="3.5" textAnchor="middle" pointerEvents="none"
            style={{ fontFamily: 'var(--sans)', fontSize: 9.5, fontWeight: 700, fill: '#fff',
              paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.25)', strokeWidth: 2 }}>
            {Math.round(pct * 100)}%
          </text>
        )}
        {full && (
          <text className="fa-tree-crown" x="0" y={-20 * s - 4} textAnchor="middle"
            style={{ fontSize: mini ? 9 : 12, fill: 'var(--brand)' }}>✦</text>
        )}
      </g>
    </g>
  );
}

// leaf-burst particles (deposit celebration)
function Burst({ cx, cy, accent }) {
  const base = accentVar(accent);
  const parts = Array.from({ length: 8 }).map((_, i) => {
    const ang = (i / 8) * Math.PI * 2 + 0.4;
    return { x: Math.cos(ang) * (16 + (i % 3) * 7), y: Math.sin(ang) * (13 + (i % 2) * 8) - 10, r: 2 + (i % 3) };
  });
  return (
    <g transform={`translate(${cx},${cy})`} className="fa-tree-burst" pointerEvents="none">
      {parts.map((p, i) => (
        <circle key={i} cx="0" cy="0" r={p.r}
          fill={`color-mix(in oklab, ${base}, #fff ${(i % 4) * 8}%)`}
          style={{ ['--bx']: p.x + 'px', ['--by']: p.y + 'px', animationDelay: `${i * 0.025}s` }} />
      ))}
    </g>
  );
}

// tap-detail bubble (SVG, clamped into the viewBox). Resting state is visible;
// entrance is a transform-only pop toggled via setTimeout (throttle-safe).
function TipBubble({ branch, goal }) {
  const [inn, setInn] = useTr(false);
  useTrE(() => { const t = setTimeout(() => setInn(true), 15); return () => clearTimeout(t); }, []);
  const pct = goal.target > 0 ? Math.round(goal.saved / goal.target * 100) : 0;
  const name = goal.name.length > 16 ? goal.name.slice(0, 15) + '…' : goal.name;
  const line2 = `${kc(goal.saved)} z ${kc(goal.target)}`;
  const w = Math.max(name.length, line2.length) * 6.4 + 26;
  const x = Math.max(8 + w / 2, Math.min(212 - w / 2, branch.fx));
  const above = branch.fy > 56;
  const y = above ? branch.fy - 48 : branch.fy + 30;
  return (
    <g className={'fa-tree-bubble' + (inn ? ' is-in' : '')} pointerEvents="none">
      <path d={above
        ? `M ${branch.fx - 5} ${y + 34} L ${branch.fx} ${y + 41} L ${branch.fx + 5} ${y + 34} Z`
        : `M ${branch.fx - 5} ${y} L ${branch.fx} ${y - 7} L ${branch.fx + 5} ${y} Z`}
        fill="var(--card)" stroke="var(--card-line)" strokeWidth="1" />
      <rect x={x - w / 2} y={y} width={w} height={34} rx={10}
        fill="var(--card)" stroke="var(--card-line)" strokeWidth="1" />
      <text x={x} y={y + 14} textAnchor="middle"
        style={{ fontFamily: 'var(--sans)', fontSize: 10.5, fontWeight: 700, fill: 'var(--ink)' }}>
        {L(name)} · {pct} %
      </text>
      <text x={x} y={y + 26.5} textAnchor="middle"
        style={{ fontFamily: 'var(--sans)', fontSize: 9.5, fill: 'var(--ink-soft)' }}>
        {line2}
      </text>
    </g>
  );
}

function GoalTree({ goals, size = 230, mini = false, onClick }) {
  // resting state is fully grown so it can never stick hidden in a throttled tab
  const grown = true;
  const list = goals.slice(0, 5);
  const [sel, setSel] = useTr(null);          // selected goal index (hero only)
  const [burst, setBurst] = useTr(null);      // {idx} during deposit celebration

  // deposit celebration — fired by Cíle's deposit()
  useTrE(() => {
    if (mini) return;
    let t;
    const h = (e) => {
      const idx = list.findIndex(g => g.id === (e.detail || {}).id);
      if (idx >= 0) { setBurst({ idx, key: Date.now() }); clearTimeout(t); t = setTimeout(() => setBurst(null), 1100); }
    };
    window.addEventListener('fa-goal-deposit', h);
    return () => { clearTimeout(t); window.removeEventListener('fa-goal-deposit', h); };
  }, [goals, mini]);

  return (
    <div onClick={mini ? onClick : () => setSel(null)} className={'fa-tree' + (mini ? ' mini' : '')}
      style={{ width: size, margin: '0 auto', cursor: (mini && onClick) ? 'pointer' : 'default' }}>
      <svg viewBox="0 0 220 205" width="100%" height="auto" style={{ display: 'block', overflow: 'visible' }}>
        {/* ground mound */}
        <ellipse cx="110" cy="197" rx="64" ry="9" fill="var(--tree-ground)" opacity="0.5" />
        {/* trunk */}
        <path d="M104 198 C 102 172 103 152 108 132 C 110 124 110 124 112 132 C 117 152 118 172 116 198 Z"
          fill="var(--tree-bark)" />
        <path d="M110 150 L110 196" stroke="color-mix(in oklab, var(--tree-bark), #000 18%)" strokeWidth="1.4" opacity="0.5" />
        {/* branches grow in */}
        {list.map((g, i) => (
          <path key={'b' + i} d={TR_BRANCHES[i].d} fill="none"
            stroke="var(--tree-bark)" strokeWidth={mini ? 4.2 : 5} strokeLinecap="round"
            pathLength="100" strokeDasharray="100"
            strokeDashoffset={grown ? 0 : 100}
            style={{
              transition: `stroke-dashoffset .8s cubic-bezier(.3,.7,.3,1) ${0.1 + i * 0.12}s, opacity .3s ease`,
              opacity: !mini && sel != null && sel !== i ? 0.45 : 1,
            }} />
        ))}
        {/* foliage per goal */}
        {list.map((g, i) => (
          <Foliage key={'f' + (g.id || i)} cx={TR_BRANCHES[i].fx} cy={TR_BRANCHES[i].fy}
            pct={g.target > 0 ? Math.min(g.saved / g.target, 1) : 0} accent={g.accent}
            delay={0.4 + i * 0.12} mini={mini}
            dim={!mini && sel != null && sel !== i}
            selected={!mini && sel === i}
            onTap={() => setSel(sel === i ? null : i)} />
        ))}
        {/* deposit celebration */}
        {burst && list[burst.idx] && (
          <Burst key={burst.key} cx={TR_BRANCHES[burst.idx].fx} cy={TR_BRANCHES[burst.idx].fy}
            accent={list[burst.idx].accent} />
        )}
        {/* detail bubble on top */}
        {!mini && sel != null && list[sel] && (
          <TipBubble branch={TR_BRANCHES[sel]} goal={list[sel]} />
        )}
      </svg>
    </div>
  );
}

Object.assign(window, { GoalTree });
