// fa-ui.jsx — shared forest-calm UI primitives with microinteractions.

const { useState, useEffect, useRef } = React;

// ── Card — rounded, layered, with tactile tap state ────────────────────
function Card({ children, onClick, style = {}, pad = 18, tone = 'surface', interactive }) {
  const [press, setPress] = useState(false);
  const clickable = !!onClick || interactive;
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(e); } }) : undefined}
      onPointerDown={() => clickable && setPress(true)}
      onPointerUp={() => setPress(false)}
      onPointerLeave={() => setPress(false)}
      className="fa-card"
      data-tone={tone}
      style={{
        position: 'relative', borderRadius: 26, padding: pad,
        background: 'var(--card)',
        border: '1px solid var(--card-line)',
        boxShadow: press ? 'var(--shadow-press)' : 'var(--shadow-card)',
        transform: press ? 'scale(0.984)' : 'scale(1)',
        transition: 'transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s ease',
        cursor: clickable ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Status chip ────────────────────────────────────────────────────────
function Chip({ tone = 'ok', children }) {
  const map = {
    ok:   { bg: 'var(--moss-soft)',  fg: 'var(--moss-deep)' },
    over: { bg: 'var(--clay-soft)',  fg: 'var(--clay)' },
    under:{ bg: 'var(--honey-soft)', fg: 'var(--honey-deep)' },
    calm: { bg: 'var(--beige)',      fg: 'var(--ink-soft)' },
  };
  const c = map[tone] || map.ok;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 11px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
      letterSpacing: 0.1, background: c.bg, color: c.fg,
      fontFamily: 'var(--sans)', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// ── Progress bar — fill renders at value immediately (robust in throttled
// tabs); the width transition still animates live value changes ──
function Bar({ pct, color, track = 'var(--bar-track)', h = 9, delay = 120 }) {
  const w = Math.min(pct, 100);
  const over = pct > 100;
  return (
    <div style={{ position: 'relative', height: h, borderRadius: 999, background: track, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0, width: `${w}%`, borderRadius: 999,
        background: color,
        transition: 'width 1s cubic-bezier(.2,.8,.2,1)',
      }} />
      {over && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, right: 0,
          width: w >= 100 ? '14%' : 0,
          background: 'repeating-linear-gradient(115deg, var(--clay) 0 6px, color-mix(in oklab, var(--clay), #fff 22%) 6px 12px)',
          borderRadius: 999, transition: 'width 1s ease',
          opacity: 0.92,
        }} />
      )}
    </div>
  );
}

// ── Donut / "Lesní koláč" — animated, tappable arcs. Tap a segment → it
// thickens, others dim, and the centre shows that segment's label + value.
function Donut({ segments, size = 168, thickness = 22, centerTop, centerMain, centerSub }) {
  const [sel, setSel] = useState(null);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const grow = true; // resting state = drawn; robust in throttled tabs
  let offset = 0;
  const gap = 0.012 * c; // small gap between arcs
  const active = sel != null ? segments[sel] : null;
  return (
    <div style={{ position: 'relative', width: size, height: size }} onClick={() => setSel(null)}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bar-track)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const len = Math.max(frac * c - gap, 0);
          const dash = `${grow ? len : 0} ${c}`;
          const on = sel === i;
          const el = (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
              stroke={s.color} strokeWidth={on ? thickness + 5 : thickness} strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              onClick={s.label ? (e) => { e.stopPropagation(); setSel(on ? null : i); } : undefined}
              style={{
                transition: `stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1) ${i*0.12}s, stroke-width .25s ease, opacity .25s ease`,
                opacity: sel != null && !on ? 0.32 : 1,
                cursor: s.label ? 'pointer' : 'default',
              }} />
          );
          offset += frac * c;
          return el;
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        pointerEvents: 'none', padding: thickness + 6,
      }}>
        {active ? (
          <React.Fragment>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: active.color }}></span>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{active.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 24, lineHeight: 1, color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap' }}>{kc(active.value)}</div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4 }}>{Math.round(active.value / total * 100)} %</div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            {centerTop && <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 2 }}>{centerTop}</div>}
            <div style={{ fontFamily: 'var(--serif)', fontSize: 34, lineHeight: 1, color: 'var(--ink)', fontWeight: 500 }}>{centerMain}</div>
            {centerSub && <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{centerSub}</div>}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// ── Section label (eyebrow above a group) ──────────────────────────────
function SectionLabel({ children, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '2px 4px 10px' }}>
      <div className="fa-seclabel" style={{ fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{children}</div>
      {action && <button className="fa-textbtn" onClick={onAction}>{action}</button>}
    </div>
  );
}

// ── Icon medallion — soft tinted circle holding a nature glyph ─────────
function Medallion({ icon, accent = 'moss', size = 42 }) {
  return (
    <div className="fa-medallion" style={{
      width: size, height: size, borderRadius: '38%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: accentSoft(accent), color: accentVar(accent),
      boxShadow: 'inset 0 0 0 1px color-mix(in oklab, ' + accentVar(accent) + ', transparent 78%)',
    }}>
      <Icon name={icon} size={size * 0.5} stroke={1.7} />
    </div>
  );
}

Object.assign(window, { Card, Chip, Bar, Donut, SectionLabel, Medallion });
