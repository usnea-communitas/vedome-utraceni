// fa-prehled.jsx — the Přehled (overview) screen. One unified overview card
// (income + balance + "Lesní koláč peněz" donut), then the three 50/30/20
// category cards, reserves and extra-income cards.

function Prehled({ go, ratios, month, setMonth, expenses = [], deleteExpense }) {
  const a = APP;
  const segs = a.categories.map(c => ({ value: c.actual, color: accentVar(c.accent), label: L(c.name) }));
  // unallocated slice
  if (a.remaining > 0) segs.push({ value: a.remaining, color: 'var(--unalloc)', label: L('Nerozděleno') });

  return (
    <div className="fa-screen">
      <ScreenHeader
        eyebrow="Vědomé utrácení"
        title={L('Přehled')}
        right={<MonthPill month={month} setMonth={setMonth} ratios={ratios} go={go} />}
      />

      {/* ── Spojená přehledová karta: příjem + Lesní koláč ─────── */}
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 22 }}>
        {/* Lesní koláč peněz — hlavní priorita karty */}
        <div style={{ position: 'relative', padding: '18px 20px 16px' }}>
          <div className="fa-hero-glow" />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '6px 10px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon name="leaf" size={18} stroke={1.7} color="var(--brand)" />
                <h3 className="fa-cardtitle" style={{ fontSize: 19, whiteSpace: 'nowrap' }}>{faLabel(L('Lesní koláč peněz'), L('Kouzelný měšec'))}</h3>
              </div>
              {(() => {
                const anyOver = a.categories.some(c => c.ofTarget > 100);
                const nothing = !a.allocated;
                const tone = nothing ? 'calm' : anyOver ? 'over' : 'ok';
                const icon = nothing ? 'leaf' : anyOver ? 'alert' : 'check';
                const label = nothing ? L('zatím bez plánu') : anyOver ? L('nad plán') : L('v limitu');
                return <Chip tone={tone}><Icon name={icon} size={13} stroke={2.2} /> {label}</Chip>;
              })()}
            </div>
          {/* the legend sits beside the donut and wraps below it when the card is too narrow */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <Donut segments={segs} size={150} thickness={21} centerTop={L('Rozděleno')} centerMain={a.plannedPct + '\u00A0%'} centerSub={L('z příjmu')} />
            <div style={{ flex: '1 1 140px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {a.categories.map(c => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: accentVar(c.accent), flexShrink: 0, marginTop: 6 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ minWidth: 0, fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>{L(c.name)}</span>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: c.tone === 'over' ? 'var(--clay)' : 'var(--ink)', whiteSpace: 'nowrap' }}>{c.ofTarget}&nbsp;%</span>
                    </div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-soft)' }}>{Lf('{a} z {b}', { a: kc(c.actual), b: kc(c.target) })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 14px', marginTop: 16, fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-soft)' }}>
              <span>{L('Rozděleno')} <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{kc(a.allocated)}</strong></span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{L('Zbývá rozdělit')} <strong style={{ color: 'var(--moss-deep)', fontWeight: 600 }}>{kc(a.remaining)}</strong></span>
            </div>
            {a.spentTotal > 0 && (
              <div style={{ textAlign: 'center', marginTop: 6, fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                {Lf('z toho plán {a} a jednorázové výdaje {b}', { a: kc(a.plannedTotal || 0), b: kc(a.spentTotal) })}
              </div>
            )}
            {!a.allocated && (
              <p style={{ textAlign: 'center', margin: '10px auto 0', maxWidth: 270, fontFamily: 'var(--sans)', fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-soft)' }}>
                {L('Další krok: v Plánu rozepiš, co patří do Potřebných — nájem, energie, jídlo.')}
              </p>
            )}
          </div>
        </div>

        <button className="fa-cta" onClick={() => go('plan')}>
          {a.allocated ? L('Upravit měsíční plán') : L('Rozepsat měsíční plán')} <Icon name="chevron" size={16} stroke={2} />
        </button>
      </Card>

      {/* ── Poslední výdaje (uživatelské one-off) ─────────────── */}
      <RecentExpenses expenses={expenses} onDelete={deleteExpense} go={go} month={month} />

      {/* ── Mini strom cílů (odkaz na Cíle) ─────────────────────── */}
      <Card onClick={() => go('cile')} style={{ marginBottom: 22, paddingTop: 14, paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="sprout" size={17} stroke={1.7} color="var(--brand)" />
          <h3 className="fa-cardtitle" style={{ fontSize: 17, whiteSpace: 'nowrap' }}>{faLabel(L('Strom cílů'), L('Strom přání'))}</h3>
          <Icon name="chevron" size={16} stroke={1.8} color="var(--ink-faint)" style={{ marginLeft: 'auto' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GoalTree goals={a.reserves.goals} size={140} mini onClick={() => go('cile')} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{L('Naspořeno')}</div>
              <div style={{ fontFamily: 'var(--title)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{kc(a.reserves.total)}</div>
            </div>
            {a.reserves.goalTotal > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-soft)' }}>{Lf('z cíle {v}', { v: kc(a.reserves.goalTotal) })}</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--brand)' }}>{Math.round(a.reserves.total / a.reserves.goalTotal * 100)}&nbsp;%</span>
              </div>
              <Bar pct={Math.round(a.reserves.total / a.reserves.goalTotal * 100)} color="var(--brand)" h={7} />
            </div>
            ) : (
            <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.45 }}>{L('Zasaď první cíl a strom začne růst.')}</p>
            )}
          </div>
        </div>
      </Card>

      {/* ── Zdroje příjmu (roční, sloupcový graf) ────────────────── */}
      <SectionLabel>{L('Zdroje příjmu')}</SectionLabel>
      <Card style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)' }}>{L('Celkem')} · {L('ročně')}</span>
          <span style={{ fontFamily: 'var(--title)', fontSize: 23, fontWeight: 600, color: 'var(--ink)' }}>{kc(a.income * 12)}</span>
        </div>
        {(() => {
          const maxA = Math.max(...a.incomeSources.map(s => s.amount));
          return <SourceBars sources={a.incomeSources} maxA={maxA} />;
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
        <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{faCatNote(c)}</span>
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

function MonthPill({ month, setMonth, ratios, go }) {
  const [open, setOpen] = React.useState(false);
  const current = faCurrentMonth();
  const shown = faParseMonth(month);
  const [year, setYear] = React.useState(() => faMonthParts(shown).y);
  React.useEffect(() => { if (open) setYear(faMonthParts(shown).y); }, [open, shown]);
  const r = ratios || { nutne: 50, budouci: 20, radost: 30 };
  const pick = (key) => { setMonth(key); setOpen(false); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, position: 'relative' }}>
      <button className="fa-pill-btn" onClick={() => setMonth && setOpen(o => !o)} style={{ cursor: setMonth ? 'pointer' : 'default' }}
        aria-haspopup={setMonth ? 'true' : undefined} aria-expanded={setMonth ? open : undefined}>
        {faMonthLabel(shown)}{setMonth && <Icon name="chevron" size={13} stroke={2} style={{ transform: 'rotate(90deg)', marginLeft: 2 }} />}
      </button>
      <button className="fa-ratio-pill" onClick={() => go && go('vice')} style={{ cursor: go ? 'pointer' : 'default', border: 'none' }}>
        {r.nutne} / {r.radost} / {r.budouci}
      </button>
      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div className="fa-month-pop" role="dialog" aria-label={L('Vyber měsíc')}>
            <div className="fa-month-year">
              <button onClick={() => setYear(y => y - 1)} aria-label={L('Předchozí rok')}>‹</button>
              <span>{year}</span>
              <button onClick={() => setYear(y => y + 1)} aria-label={L('Další rok')}>›</button>
            </div>
            {FA_MONTHS.map((mn, i) => {
              const key = year + '-' + String(i + 1).padStart(2, '0');
              return (
                <button key={mn} data-on={key === shown} data-now={key === current} onClick={() => pick(key)}>{L(mn)}</button>
              );
            })}
            {shown !== current && (
              <button className="fa-month-now" onClick={() => pick(current)}>{L('Zpět na aktuální měsíc')}</button>
            )}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

// ── Year goals: snake-fill progress bars, auto from Cíle + add your own ──
// fill renders at value immediately (robust); transition covers live changes
function SnakeBar({ pct, color, h = 13, delay = 140 }) {
  const w = Math.min(pct, 100);
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
  const grow = true; // resting state = drawn
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

// ── income-source columns — tap a column to focus it (others dim) and see
// the monthly amount; tap again to go back to yearly view ───────────────
function SourceBars({ sources, maxA }) {
  const [sel, setSel] = React.useState(null);
  const tot = sources.reduce((s, x) => s + x.amount, 0) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 150, marginTop: 12, padding: '0 2px' }}>
      {sources.map((s, i) => {
        const h = Math.round(26 + (s.amount / maxA) * 74);
        const on = sel === i;
        return (
          <div key={s.name} className="fa-bar-col" data-dim={sel != null && !on}
            onClick={() => setSel(on ? null : i)}
            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
            <span className="fa-bar-pct" style={on ? { color: 'var(--ink)', fontWeight: 700 } : null}>{Math.round(s.amount / tot * 100)}&nbsp;%</span>
            <div className="fa-bar-track2">
              <div className="fa-bar-fill" data-on={on} style={{ height: `${h}%`, ['--c']: `var(--src-${i + 1})` }}>
                <span className="fa-bar-cap" />
              </div>
            </div>
            <span className="fa-bar-name">{L(s.name)}</span>
            <span className="fa-bar-amt" style={on ? { color: 'var(--brand)', fontWeight: 700 } : null}>
              {on ? `${fmt(s.amount)}\u00A0${L('Kč/měs')}` : `${fmt(s.amount * 12)}\u00A0Kč`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { Prehled, ScreenHeader, GrowthMark, YearGoals, SnakeBar, SourceBars });
