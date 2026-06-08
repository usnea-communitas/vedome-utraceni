// fa-tree.jsx — animated "goal tree": one branch per goal, each grows (foliage
// fills + sways) with that goal's progress. Large hero on Cíle; a small
// clickable version on Přehled that links to Cíle.

const { useState: useTr, useEffect: useTrE } = React;

// branch geometry (base→tip path + foliage centre). First N used for N goals.
const TR_BRANCHES = [
  { d: 'M108 150 C 92 147 76 141 60 129', fx: 52, fy: 122 },
  { d: 'M112 143 C 130 139 148 133 164 121', fx: 172, fy: 114 },
  { d: 'M108 133 C 93 121 81 105 71 87',   fx: 63, fy: 79 },
  { d: 'M112 129 C 129 117 141 99 149 81', fx: 157, fy: 73 },
  { d: 'M110 126 C 110 106 110 94 110 75', fx: 110, fy: 62 },
];

function Foliage({ cx, cy, pct, accent, grown, delay, mini }) {
  const base = accentVar(accent);
  const s = 0.42 + 0.58 * Math.min(pct, 1);          // grown size by progress
  const blobs = [
    { dx: 0, dy: 0, r: 15 }, { dx: -11, dy: 3, r: 11 }, { dx: 11, dy: 3, r: 11 },
    { dx: -5, dy: -10, r: 10 }, { dx: 6, dy: -9, r: 10 },
  ];
  return (
    <g style={{
      transformBox: 'fill-box', transformOrigin: 'center',
      transform: `translate(${cx}px,${cy}px) scale(${grown ? s : 0.0001})`,
      opacity: grown ? 1 : 0,
      transition: `transform 1s cubic-bezier(.2,.8,.2,1) ${delay}s, opacity .6s ease ${delay}s`,
    }}>
      {blobs.map((b, i) => (
        <circle key={i} cx={b.dx} cy={b.dy} r={b.r}
          fill={`color-mix(in oklab, ${base}, #fff ${(i % 3) * 10}%)`}
          opacity={0.92} />
      ))}
      {/* soft highlight */}
      <circle cx={-4} cy={-6} r={5} fill="rgba(255,255,255,0.25)" />
      {!mini && (
        <text x="0" y="4" textAnchor="middle"
          style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 700, fill: '#fff' }}>
          {Math.round(pct * 100)}%
        </text>
      )}
    </g>
  );
}

function GoalTree({ goals, size = 230, mini = false, onClick }) {
  const [grown, setGrown] = useTr(false);
  useTrE(() => { const t = setTimeout(() => setGrown(true), 80); return () => clearTimeout(t); }, []);
  const list = goals.slice(0, 5);

  return (
    <div onClick={onClick} className={'fa-tree' + (mini ? ' mini' : '')}
      style={{ width: size, margin: '0 auto', cursor: onClick ? 'pointer' : 'default' }}>
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
            style={{ transition: `stroke-dashoffset .8s cubic-bezier(.3,.7,.3,1) ${0.1 + i * 0.12}s` }} />
        ))}
        {/* foliage per goal */}
        {list.map((g, i) => (
          <Foliage key={'f' + i} cx={TR_BRANCHES[i].fx} cy={TR_BRANCHES[i].fy}
            pct={Math.min(g.saved / g.target, 1)} accent={g.accent} grown={grown}
            delay={0.4 + i * 0.12} mini={mini} />
        ))}
      </svg>
    </div>
  );
}

Object.assign(window, { GoalTree });
