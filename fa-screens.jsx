// fa-prehled.jsx — the Přehled (overview) screen. One unified overview card
// (income + balance + "Lesní koláč peněz" donut), then the three 50/30/20
// category cards, reserves and extra-income cards.

function Prehled({ go }) {
  const a = APP;
  const segs = a.categories.map(c => ({ value: c.actual, color: accentVar(c.accent) }));
  // unallocated slice
  segs.push({ value: a.remaining, color: 'var(--unalloc)' });

  return (
    <div className="fa-screen">
      <ScreenHeader
        eyebrow="Vědomé utrácení"
        title={L('Přehled')}
        right={<MonthPill month={a.month} />}
      />

      {/* ── Spojená přehledová karta: příjem + Lesní koláč ─────── */}
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 22 }}>
        {/* Lesní koláč peněz — hlavní priorita karty */}
        <div style={{ position: 'relative', padding: '18px 20px 16px' }}>
          <div className="fa-hero-glow" />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon name="leaf" size={18} stroke={1.7} color="var(--brand)" />
                <h3 className="fa-cardtitle" style={{ fontSize: 19, whiteSpace: 'nowrap' }}>{faLabel(L('Lesní koláč peněz'), L('Kouzelný měšec'))}</h3>
              </div>
              <Chip tone="ok"><Icon name="check" size={13} stroke={2.2} /> {L('v limitu')}</Chip>
            </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Donut segments={segs} size={150} thickness={21} centerTop={L('Plán')} centerMain={a.plannedPct + '\u00A0%'} centerSub={L('naplánováno')} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {a.categories.map(c => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: accentVar(c.accent), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>{L(c.name)}</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{kc(c.actual)} · {Lf('cíl {p} %', { p: c.targetPct })}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: c.tone === 'over' ? 'var(--clay)' : 'var(--ink)', whiteSpace: 'nowrap' }}>{c.ofTarget}&nbsp;%</span>
                </div>
              ))}
            </div>
          </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 16, fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-soft)' }}>
              <span>{L('Rozděleno')} <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{kc(a.allocated)}</strong></span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{L('Zbývá rozdělit')} <strong style={{ color: 'var(--moss-deep)', fontWeight: 600 }}>{kc(a.remaining)}</strong></span>
            </div>
          </div>
        </div>

        <button className="fa-cta" onClick={() => go('plan')}>
          {L('Upravit měsíční plán')} <Icon name="chevron" size={16} stroke={2} />
        </button>
      </Card>

      {/* ── Mini strom cílů (odkaz na Cíle) ─────────────────────── */}
      <Card onClick={() => go('cile')} style={{ marginBottom: 22, paddingTop: 14, paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="sprout" size={17} stroke={1.7} color="var(--brand)" />
          <h3 className="fa-cardtitle" style={{ fontSize: 17 }}>{faLabel(L('Strom cílů'), L('Strom přání'))}</h3>
          <Icon name="chevron" size={16} stroke={1.8} color="var(--ink-faint)" style={{ marginLeft: 'auto' }} />
        </div>
        <GoalTree goals={a.reserves.goals} size={150} mini onClick={() => go('cile')} />
      </Card>

      {/* ── Zdroje příjmu (roční, sloupcový graf) ────────────────── */}
      <SectionLabel>{L('Zdroje příjmu')}</SectionLabel>
      <Card style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)' }}>{L('Celkem')} · {L('ročně')}</span>
          <span style={{ fontFamily: 'var(--title)', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>{kc(a.income * 12)}</span>
        </div>
        {(() => {
          const maxA = Math.max(...a.incomeSources.map(s => s.amount));
          return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 132, marginTop: 10 }}>
              {a.incomeSources.map((s, i) => {
                const h = Math.round(20 + (s.amount / maxA) * 80); // % of column area
                return (
                  <div key={s.name} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink)', marginBottom: 5, whiteSpace: 'nowrap' }}>{Math.round(s.amount / a.income * 100)}&nbsp;%</span>
                    <div className="fa-col" style={{ height: `${h}%`, background: `linear-gradient(180deg, color-mix(in oklab, var(--src-${i + 1}), #fff 16%), var(--src-${i + 1}))` }} />
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 10.5, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 7, textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{L(s.name)}</span>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--ink-faint)', marginTop: 1, whiteSpace: 'nowrap' }}>{fmt(s.amount * 12)}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Card>

      {/* ── Roční cíle (Year goals) — naplňující se „hadi" ──────── */}
      <SectionLabel action={L('Detail')} onAction={() => go('cile')}>{L('Roční cíle')}</SectionLabel>
      <YearGoals go={go} />
    </div>
  );
}

// ── Category row (inside the merged "Měsíční rozhodnutí" card) ──────────
function CategoryRow({ c, index }) {
  const overflow = c.ofTarget > 100;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Medallion icon={c.icon} accent={c.accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontWeight: 500, margin: 0, whiteSpace: 'nowrap' }}>{L(c.name)}</h3>
            <Chip tone={c.tone}>{L(c.status)}</Chip>
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, whiteSpace: 'nowrap' }}>{Lf('Cíl {p} % · {v}', { p: c.targetPct, v: kc(c.target) })}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--ink)', lineHeight: 1 }}>{fmt(c.actual)}</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-soft)', marginTop: 3, whiteSpace: 'nowrap' }}>{Lf('{p} % z příjmu', { p: c.incomePct })}</div>
        </div>
      </div>
      <Bar pct={c.ofTarget} color={accentVar(c.accent)} delay={180 + index * 80} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9 }}>
        <Icon name={overflow ? 'alert' : 'check'} size={14} stroke={2}
          color={overflow ? 'var(--clay)' : c.tone === 'under' ? 'var(--honey-deep)' : 'var(--moss)'} />
        <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{L(c.note)}</span>
      </div>
    </div>
  );
}

// ── Small bits ──────────────────────────────────────────────────────────
function Stat({ label, value, accent }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 19, color: accent ? 'var(--moss-deep)' : 'var(--ink)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function ScreenHeader({ eyebrow, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', margin: '4px 4px 18px' }}>
      <div>
        <div className="fa-eyebrow" style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 3 }}>{eyebrow}</div>
        <h1 className="fa-title" style={{ fontFamily: 'var(--title)', fontSize: 33, fontWeight: 600, color: 'var(--ink)', margin: 0, letterSpacing: -0.4 }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

function MonthPill({ month }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', padding: '7px 13px', borderRadius: 999, background: 'var(--card)', border: '1px solid var(--card-line)', boxShadow: 'var(--shadow-chip)' }}>{L(month)}</span>
      <span className="fa-ratio-pill" style={{ fontFamily: 'var(--sans)', fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, color: 'var(--moss)', padding: '3px 9px', borderRadius: 999, background: 'var(--moss-soft)', whiteSpace: 'nowrap' }}>50 / 30 / 20</span>
    </div>
  );
}

// ── Year goals: snake-fill progress bars, auto from Cíle + add your own ──
function SnakeBar({ pct, color, h = 13, delay = 140 }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => { const t = setTimeout(() => setW(Math.min(pct, 100)), delay); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div style={{ position: 'relative', height: h, borderRadius: 999, background: 'var(--bar-track)', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: `${w}%`, borderRadius: 999,
        background: `linear-gradient(90deg, color-mix(in oklab, ${color}, #fff 14%), ${color})`,
        transition: 'width 1.1s cubic-bezier(.2,.8,.2,1)',
        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35)`,
      }}>
        <span style={{
          position: 'absolute', right: 2, top: '50%', width: h - 6, height: h - 6,
          transform: 'translateY(-50%)', borderRadius: '50%',
          background: 'color-mix(in oklab, ' + color + ', #fff 30%)',
          boxShadow: '0 0 5px color-mix(in oklab, ' + color + ', transparent 40%)',
          opacity: w > 4 ? 1 : 0,
        }} />
      </div>
    </div>
  );
}

// Year goals — functional: base goals auto-pulled from Cíle (APP.reserves.goals),
// plus user-added custom goals persisted to localStorage. Real add form.
const YG_STORE = 'fa.yearGoals.custom';
function ygLoad() { try { return JSON.parse(localStorage.getItem(YG_STORE)) || []; } catch (e) { return []; } }
function ygSave(list) { try { localStorage.setItem(YG_STORE, JSON.stringify(list)); } catch (e) {} }

function YearGoals({ go }) {
  const [custom, setCustom] = React.useState(ygLoad);
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [target, setTarget] = React.useState('');
  const accents = ['blush', 'sage', 'honey', 'moss'];

  const goals = [...APP.reserves.goals, ...custom];

  const commit = () => {
    const t = parseInt(String(target).replace(/\s/g, ''), 10);
    if (!name.trim() || !t || t <= 0) return;
    const next = [...custom, { name: name.trim(), icon: 'shield', accent: accents[custom.length % accents.length], saved: 0, target: t, custom: true }];
    setCustom(next); ygSave(next);
    setName(''); setTarget(''); setAdding(false);
  };
  const remove = (idx) => { const next = custom.filter((_, i) => i !== idx); setCustom(next); ygSave(next); };

  return (
    <Card pad={0} style={{ overflow: 'hidden', marginBottom: 8 }}>
      {goals.map((g, i) => {
        const pct = Math.min(Math.round(g.saved / g.target * 100), 999);
        const done = pct >= 100;
        const customIdx = g.custom ? custom.indexOf(g) : -1;
        return (
          <div key={g.name + i} className="fa-listrow" onClick={() => !g.custom && go('cile')}
            style={{ borderTop: i ? '1px solid var(--card-line)' : 'none', cursor: g.custom ? 'default' : 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <Medallion icon={g.icon} accent={g.accent} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L(g.name)}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 1, whiteSpace: 'nowrap' }}>{Lf('{a} z {b}', { a: kc(g.saved), b: kc(g.target) })}</div>
              </div>
              {g.custom && (
                <button className="fa-goal-x" onClick={(e) => { e.stopPropagation(); remove(customIdx); }} aria-label="x">
                  <Icon name="plus" size={14} stroke={2.2} style={{ transform: 'rotate(45deg)' }} />
                </button>
              )}
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: done ? 'var(--moss-deep)' : accentVar(g.accent), whiteSpace: 'nowrap' }}>{pct}&nbsp;%</div>
            </div>
            <SnakeBar pct={pct} color={accentVar(g.accent)} delay={160 + i * 90} />
          </div>
        );
      })}

      {adding ? (
        <div style={{ borderTop: '1px dashed var(--card-line)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input className="fa-input" autoFocus value={name} placeholder={L('Název cíle')}
            onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && commit()} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="fa-input" type="number" inputMode="numeric" value={target} placeholder={L('Cílová částka (Kč)')}
              onChange={e => setTarget(e.target.value)} onKeyDown={e => e.key === 'Enter' && commit()} style={{ flex: 1 }} />
            <button className="fa-input-btn" onClick={commit}>{L('Uložit')}</button>
            <button className="fa-input-btn ghost" onClick={() => { setAdding(false); setName(''); setTarget(''); }}>{L('Zrušit')}</button>
          </div>
        </div>
      ) : (
        <button className="fa-addgoal" onClick={(e) => { e.stopPropagation(); setAdding(true); }}>
          <span className="fa-addgoal-plus"><Icon name="plus" size={15} stroke={2.2} /></span>
          {L('Přidat cíl, který chceš sledovat')}
        </button>
      )}
    </Card>
  );
}

// growth ring with sprout — used for reserves
function GrowthMark({ pct }) {
  const size = 52, r = 22, c = 2 * Math.PI * r;
  const [grow, setGrow] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setGrow(true), 200); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bar-track)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--brand)" strokeWidth={5} strokeLinecap="round"
          strokeDasharray={`${grow ? (pct/100)*c : 0} ${c}`} style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="sprout" size={22} stroke={1.7} color="var(--brand)" />
      </div>
    </div>
  );
}

Object.assign(window, { Prehled, ScreenHeader, GrowthMark, YearGoals, SnakeBar });
