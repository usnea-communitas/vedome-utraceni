// fa-screens.jsx — Cíle, Plán, Tipy, Reflexe, Více screens.

const { useState: useS2 } = React;

// ════════════════════════════════════════════════════════════════════
// CÍLE — reserves & savings goals, each a "growing plant"
// ════════════════════════════════════════════════════════════════════
function Cile({ go, month, setMonth, ratios, profile }) {
  const real = profile && !profile.demo;
  const [, bump] = useS2(0);
  const [adding, setAdding] = useS2(false);
  const [openId, setOpenId] = useS2(null);
  const r = APP.reserves;
  const totalPct = r.goalTotal > 0 ? Math.round(r.total / r.goalTotal * 100) : 0;
  const empty = r.goals.length === 0;
  const mutate = (fn) => { if (!real) return; saveFaGoals(fn(loadFaGoals())); faHydrate(ratios); bump(x => x + 1); };
  const addGoal = (g) => mutate(list => [...list, g]);
  const removeGoal = (id) => { mutate(list => list.filter(g => g.id !== id)); setOpenId(null); };
  const deposit = (id, amount) => {
    mutate(list => list.map(g => g.id === id ? { ...g, saved: Math.max(0, (+g.saved || 0) + amount) } : g));
    try { window.dispatchEvent(new CustomEvent('fa-goal-deposit', { detail: { id } })); } catch (e) {}
  };
  return (
    <div className="fa-screen">
      <ScreenHeader eyebrow={L('Rezervy a cíle')} title={L('Cíle')} right={<MonthPill month={APP.month} setMonth={setMonth} ratios={ratios} go={go} />} />

      {empty ? (
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ position: 'relative', padding: '26px 22px 24px', textAlign: 'center' }}>
          <div className="fa-hero-glow" />
          <div style={{ position: 'relative' }}>
            <GoalTree goals={[]} size={150} />
            <h3 className="fa-cardtitle" style={{ marginTop: 8 }}>{L('Zasaď svůj první cíl')}</h3>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', margin: '8px auto 0', maxWidth: 250, lineHeight: 1.5 }}>{L('Každý cíl je větev tvého stromu. S každou naspořenou korunou poroste.')}</p>
            {real && !adding && (
              <button className="fa-cta fa-cta-solid" style={{ marginTop: 16 }} onClick={() => setAdding(true)}>
                {L('Přidat cíl')} <Icon name="chevron" size={16} stroke={2} />
              </button>
            )}
          </div>
        </div>
      </Card>
      ) : (
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ position: 'relative', padding: '22px 20px 20px', textAlign: 'center' }}>
          <div className="fa-hero-glow" />
          <div style={{ position: 'relative' }}>
            <GoalTree goals={r.goals} size={232} />
            <div style={{ fontFamily: 'var(--title)', fontSize: 40, color: 'var(--ink)', fontWeight: 600, lineHeight: 1, marginTop: 6 }}>{fmt(r.total)}<span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600, color: 'var(--ink-soft)' }}> Kč</span></div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>{Lf('z cíle {v}', { v: kc(r.goalTotal) })}</div>
            <div style={{ marginTop: 15 }}><Bar pct={totalPct} color="var(--brand)" h={11} /></div>
          </div>
        </div>
        <div style={{ height: 1, margin: '0 20px', background: 'linear-gradient(90deg, transparent, var(--card-line) 18%, var(--card-line) 82%, transparent)' }} />
        <div style={{ display: 'flex', padding: '14px 8px' }}>
          <HeroStat label={L('Aktivní cíle')} value={r.goals.length} />
          <div style={{ width: 1, background: 'var(--card-line)' }} />
          <HeroStat label={L('Investováno')} value={r.investPct + '\u00A0%'} accent="honey" />
          <div style={{ width: 1, background: 'var(--card-line)' }} />
          <HeroStat label={L('Zbývá splnit')} value={kc(r.remainingToGoal)} />
        </div>
      </Card>
      )}

      {!empty && (
        <SectionLabel action={real ? L('Přidat cíl') : null} onAction={real ? () => setAdding(true) : undefined}>{faLabel(L('Tvůj malý les'), L('Tvé malé trezory'))}</SectionLabel>
      )}
      {adding && <AddGoalForm onAdd={addGoal} onClose={() => setAdding(false)} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {r.goals.map((g, i) => (
          <GoalCard key={g.id || g.name} g={g} i={i} real={real}
            open={openId === (g.id || g.name)}
            onToggle={() => setOpenId(openId === (g.id || g.name) ? null : (g.id || g.name))}
            onDeposit={(v) => deposit(g.id, v)}
            onDelete={() => removeGoal(g.id)} />
        ))}
      </div>

      {APP.extra.total > 0 && (<React.Fragment>
      <SectionLabel>{L('Mimořádné příjmy')}</SectionLabel>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Medallion icon="sun" accent="honey" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)', fontWeight: 500 }}>{kc(APP.extra.total)}</div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{L(APP.extra.note)}</div>
          </div>
        </div>
      </Card>
      </React.Fragment>)}
    </div>
  );
}

// inline add-goal form (presets shared with onboarding)
function AddGoalForm({ onAdd, onClose }) {
  const presets = window.OB_GOALS || [];
  const [key, setKey] = useS2(null);
  const [name, setName] = useS2('');
  const [target, setTarget] = useS2('');
  const pick = (g) => { setKey(g.key); setName(g.key === 'custom' ? '' : L(g.name)); };
  const valid = key && name.trim() && faAmount(target) > 0;
  const commit = () => {
    if (!valid) return;
    const g = presets.find(x => x.key === key);
    onAdd({ id: Date.now(), name: name.trim(), target: faAmount(target), saved: 0, icon: g.icon, accent: g.accent, kind: g.kind });
    onClose();
  };
  return (
    <Card pad={16} style={{ marginBottom: 12 }}>
      <h3 className="fa-cardtitle" style={{ fontSize: 17, marginBottom: 11 }}>{L('Nový cíl')}</h3>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 11 }}>
        {presets.map(g => (
          <button key={g.key} className="fa-onb-chip" data-on={key === g.key} onClick={() => pick(g)}>{L(g.name)}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <input className="fa-onb-input" type="text" value={name} maxLength={28} placeholder={L('Název cíle')}
          onChange={e => setName(e.target.value)} style={{ padding: '11px 13px', fontSize: 14.5 }} />
        <div className="fa-onb-money">
          <input className="fa-onb-input" type="text" inputMode="decimal" value={target} placeholder={L('Cílová částka')}
            onChange={e => setTarget(e.target.value)} style={{ textAlign: 'right', padding: '11px 13px', fontSize: 14.5 }} />
          <span>Kč</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 13 }}>
        <button className="fa-cta fa-cta-solid" style={{ flex: 1 }} disabled={!valid} onClick={commit}>{L('Přidat')}</button>
        <button className="fa-ghostbtn" onClick={onClose}>{L('Zrušit')}</button>
      </div>
    </Card>
  );
}

function GoalCard({ g, i, real, open, onToggle, onDeposit, onDelete }) {
  const pct = g.target > 0 ? Math.round(g.saved / g.target * 100) : 0;
  const [amt, setAmt] = useS2('');
  const commit = () => { const v = faAmount(amt); if (v > 0) { onDeposit(v); setAmt(''); } };
  return (
    <Card pad={16} interactive onClick={real ? onToggle : undefined}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <PlantStage pct={pct} accent={g.accent} icon={g.icon} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', fontWeight: 500, margin: 0 }}>{L(g.name)}</h3>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{Lf('{a} z {b}', { a: kc(g.saved), b: kc(g.target) })}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: accentVar(g.accent), lineHeight: 1 }}>{pct} %</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 4, whiteSpace: 'nowrap' }}>{Lf('zbývá {v}', { v: kc(Math.max(g.target - g.saved, 0)) })}</div>
        </div>
      </div>
      <Bar pct={pct} color={accentVar(g.accent)} delay={160 + i * 90} />
      {real && open && (
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, marginTop: 13, alignItems: 'center' }}>
          <input className="fa-onb-input" type="text" inputMode="decimal" value={amt} placeholder={L('Částka v Kč')}
            onChange={e => setAmt(e.target.value)} style={{ flex: 1, padding: '9px 12px', fontSize: 14, minWidth: 0 }} />
          <button className="fa-ghostbtn" onClick={commit} style={{ flexShrink: 0 }}><Icon name="plus" size={14} stroke={2} /> {L('Vložit')}</button>
          <button className="fa-textbtn" onClick={onDelete} style={{ color: 'var(--clay)', flexShrink: 0 }}>{L('Smazat')}</button>
        </div>
      )}
    </Card>
  );
}

// 3-up stat inside a hero card footer
function HeroStat({ label, value, accent }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '0 6px', minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 10.5, letterSpacing: 0.3, color: 'var(--ink-soft)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: accent === 'honey' ? 'var(--honey-deep)' : 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

// little plant in a soft pot — stage grows with progress
function PlantStage({ pct, accent, icon }) {
  return (
    <div style={{
      width: 46, height: 46, borderRadius: '38%', flexShrink: 0, position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: accentSoft(accent),
      boxShadow: 'inset 0 0 0 1px color-mix(in oklab, ' + accentVar(accent) + ', transparent 80%)',
    }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: `${30 + pct * 0.5}%`,
        background: 'color-mix(in oklab, ' + accentVar(accent) + ', transparent 80%)',
        transition: 'height 1s cubic-bezier(.2,.8,.2,1)',
      }} />
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <Icon name={icon} size={24} stroke={1.7} color={accentVar(accent)} />
      </div>
    </div>
  );
}

// big centerpiece: stylised growing tree (rings) for the reserves hero
function GrowthScene({ pct }) {
  const rings = [
    { r: 46, c: 'var(--grow-ring-outer)' },
    { r: 34, c: 'var(--grow-ring-mid)' },
    { r: 22, c: 'var(--grow-ring-in)' },
  ];
  const show = Math.ceil(pct / 100 * rings.length) || 1;
  return (
    <div style={{ width: 116, height: 116, margin: '0 auto', position: 'relative' }}>
      <svg width="116" height="116" viewBox="0 0 116 116">
        {rings.map((ring, i) => (
          <circle key={i} cx="58" cy="58" r={ring.r} fill="none" stroke={ring.c}
            strokeWidth={i === rings.length - 1 ? 0 : 8}
            opacity={i < show ? 1 : 0.25}
            style={{ transition: `opacity .8s ease ${i*0.15}s` }} />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="sprout" size={46} stroke={1.5} color="var(--grow-mark)" />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PLÁN lives in fa-plan.jsx (interactive: expandable income + categories,
// add/delete items, recurring, descriptions, structure graphics).
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// TIPY — gentle conscious-spending tips
// ════════════════════════════════════════════════════════════════════
// deeper category explanations (Tipy) — keyed by category key
const CAT_EXPLAIN = {
  nutne: 'Pevný základ života. Patří sem nájem, energie, jídlo, doprava — výdaje, které se opakují a drží tě v bezpečí. Cíl 50 % příjmu je zdravá hranice: když je nutné výrazně vyšší, je čas hledat, kde uvolnit tlak.',
  budouci: 'Tvoje budoucí svoboda. Spoření, rezerva a investice, které dnes odkládáš pro sebe zítra. I 20 % dělá s časem a složeným úročením zázraky — důležitější než kolik je, že to děláš pravidelně.',
  radost: 'Tvoje dnešní radost. Kavárny, výlety, koníčky a drobnosti, co ti dělají život hezčí. Plánovat radost naschvál je dovednost — utrácení bez viny tě udrží u rozpočtu mnohem déle než odříkání.',
};

function Tipy() {
  return (
    <div className="fa-screen">
      <ScreenHeader eyebrow={L('Laskavé rady')} title={L('Tipy')} />
      <div style={{ marginTop: 8 }}>
        <SectionLabel>{faLabel(L('Síla složeného úročení'), L('Kouzlo složeného úročení'))}</SectionLabel>
        <div className="fa-invest-note" style={{ marginTop: 0, marginBottom: 12 }}>
          <Icon name="bulb" size={15} stroke={1.7} />
          <p style={{ margin: 0 }}>
            {L('Složené úročení znamená, že výnosy samy vydělávají další výnosy. Index S&P\u00a0500 historicky vynesl s reinvesticí dividend zhruba 7–10\u00a0% ročně. Graf je zjednodušená ilustrace — minulé výnosy nezaručují budoucí a nejde o investiční doporučení.')}
          </p>
        </div>
        <InvestSim />
      </div>

      <div style={{ marginTop: 22 }}>
        <SectionLabel>{L('Laskavé rady')}</SectionLabel>
        <p className="fa-lede" style={{ marginTop: 0, marginBottom: 10 }}>{L('Malé návyky, které dělají velký klid. Klepni na kartu a otoč ji — čeká tě malá zajímavost.')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {APP.tipy.map((t, i) => <TipFlip key={i} t={t} />)}
        </div>
      </div>

      {/* ── Tři kategorie, tři role — hlubší vysvětlení ── */}
      <div style={{ marginTop: 22 }}>
        <SectionLabel>{L('Tři kategorie, tři role')}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {APP.categories.map(c => (
            <Card key={c.key} pad={18} interactive>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
                <Medallion icon={c.icon} accent={c.accent} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontWeight: 500, margin: 0 }}>{L(c.name)}</h3>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 1 }}>{L('cíl')} {c.targetPct} % {L('z příjmu')}</div>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-soft)', margin: 0 }}>{L(CAT_EXPLAIN[c.key])}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// flip card: front = tip, back = playful fact / financial literacy
function TipFlip({ t }) {
  const [flipped, setFlipped] = useS2(false);
  const faceBase = { padding: 18 };
  return (
    <div className="fa-flip" data-flipped={flipped} onClick={() => setFlipped(f => !f)} style={{ height: 172 }}>
      <div className="fa-flip-inner" style={{ transform: `rotateY(${flipped ? 180 : 0}deg)` }}>
        {/* front */}
        <div className="fa-flip-face fa-flip-front" style={{ ...faceBase, justifyContent: 'center', gap: 15, opacity: flipped ? 0 : 1, background: 'var(--card)', border: '1px solid var(--card-line)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <Medallion icon={t.icon} accent={t.accent} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--ink)', fontWeight: 500, margin: '2px 0 6px' }}>{L(t.t)}</h3>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-soft)', margin: 0 }}>{L(t.d)}</p>
            </div>
          </div>
          <div className="fa-flip-hint"><Icon name="arrow" size={15} stroke={1.9} /> {L('Otoč pro zajímavost')}</div>
        </div>
        {/* back */}
        <div className="fa-flip-face fa-flip-back" style={{ ...faceBase, justifyContent: 'space-between', opacity: flipped ? 1 : 0, background: accentSoft(t.accent), border: '1px solid color-mix(in oklab, ' + accentVar(t.accent) + ', transparent 72%)', boxShadow: 'var(--shadow-card)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
              <Icon name="bulb" size={19} stroke={1.7} color={accentVar(t.accent)} />
              <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: accentVar(t.accent) }}>{L(t.factTitle)}</span>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 16.5, lineHeight: 1.5, color: 'var(--ink)', margin: 0 }}>{L(t.fact)}</p>
          </div>
          <div className="fa-flip-hint" style={{ color: accentVar(t.accent) }}><Icon name="leaf" size={15} stroke={1.8} /> {L('Zpět na tip')}</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// REFLEXE — monthly quiz with A/B/C/D answers + a graphic month review
// Each option scores 0–3; total maps to an assessment + tailored tip.
const REFLEX_QUIZ = [
  { q: 'Když tento měsíc přišly peníze, co se dělo?', icon: 'coins', accent: 'honey', opts: [
    { t: 'Hned se rozkutálely, ani nevím kam', s: 0 },
    { t: 'Něco se utratilo, něco zůstalo náhodou', s: 1 },
    { t: 'Většina šla podle plánu', s: 2 },
    { t: 'Nejdřív stranou pro budoucí já, pak zbytek', s: 3 },
  ] },
  { q: 'Jaké to bylo u větších výdajů?', icon: 'blossom', accent: 'blush', opts: [
    { t: 'S úzkostí, často je lituju', s: 0 },
    { t: 'Napětí, ale nějak to šlo', s: 1 },
    { t: 'Klidně — byly promyšlené', s: 2 },
    { t: 'S radostí — bylo jasné, že si je můžu dovolit', s: 3 },
  ] },
  { q: 'Kolik šlo do „Budoucí já" (spoření a investice)?', icon: 'sprout', accent: 'moss', opts: [
    { t: 'Nic, nezbylo', s: 0 },
    { t: 'Pár korun na konci měsíce', s: 1 },
    { t: 'Skoro podle cíle', s: 2 },
    { t: 'Celý cíl, hned po výplatě', s: 3 },
  ] },
  { q: 'Jak to bylo s radostí a drobným potěšením?', icon: 'sun', accent: 'honey', opts: [
    { t: 'Buď vina, nebo úplné odříkání', s: 0 },
    { t: 'Náhodně, bez plánu', s: 1 },
    { t: 'Občas naplánované', s: 2 },
    { t: 'Vědomě naplánovaná, bez výčitek', s: 3 },
  ] },
];

const REFLEX_RESULT = {
  tense:   { key: 'tense',  label: 'Stísněně',   accent: 'clay',  tip: 'Zkus jedinou změnu: hned po výplatě odlož 10 % stranou, než cokoli utratíš. Malý automatický krok ti vrátí pocit kontroly — a příští reflexe bude lehčí.' },
  balance: { key: 'balance', label: 'V rovnováze', accent: 'honey', tip: 'Máš pevný základ. Tento měsíc zkus pojmenovat jeden konkrétní cíl a posílat na něj pravidelnou částku. Z rovnováhy se tak pomalu stane radost.' },
  joy:     { key: 'joy',    label: 'S radostí',  accent: 'moss',  tip: 'Krásná práce. Udrž si to: zautomatizuj spoření a dopřej si bez výčitek jednu naplánovanou radost. Můžeš zvážit i mírné zvýšení investic.' },
};
function reflexBand(score, max) {
  const pct = score / max;
  if (pct < 0.42) return REFLEX_RESULT.tense;
  if (pct < 0.75) return REFLEX_RESULT.balance;
  return REFLEX_RESULT.joy;
}

function Reflexe({ month }) {
  const mKey = month || APP.month;
  const [answers, setAnswersRaw] = useS2(() => { try { const s = loadFaReflexe(); return (s[mKey] && s[mKey].answers) || {}; } catch (e) { return {}; } });
  const setAnswers = (next) => { setAnswersRaw(next); const s = loadFaReflexe(); s[mKey] = { answers: next }; saveFaReflexe(s); };
  const qKeys = Object.keys(answers);
  const answered = qKeys.length;
  const maxScore = REFLEX_QUIZ.length * 3;
  const score = Object.values(answers).reduce((a, b) => a + b.s, 0);
  const done = answered === REFLEX_QUIZ.length;
  const band = reflexBand(score, maxScore);
  const pct = Math.round(score / maxScore * 100);
  return (
    <div className="fa-screen">
      <ScreenHeader eyebrow={L('Konec měsíce')} title={L('Reflexe')} />
      <p className="fa-lede">{L('Odpověz na pár otázek a podívej se, jak ti tento měsíc bylo s penězi.')}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
        {REFLEX_QUIZ.map((q, qi) => (
          <Card key={qi} pad={18}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 13 }}>
              <Medallion icon={q.icon} accent={q.accent} size={38} />
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 17.5, color: 'var(--ink)', fontWeight: 500, margin: '2px 0 0', lineHeight: 1.3 }}>{L(q.q)}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.opts.map((o, oi) => {
                const sel = answers[qi] && answers[qi].sel === oi;
                return (
                  <button key={oi} className="fa-quiz-opt" data-on={sel}
                    onClick={() => setAnswers({ ...answers, [qi]: { s: o.s, sel: oi } })}>
                    <span className="fa-quiz-letter">{'ABCD'[oi]}</span>
                    <span className="fa-quiz-text">{L(o.t)}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* progress + result */}
      <div style={{ marginTop: 22 }}>
        <SectionLabel>{L('Přehled minulého měsíce')}</SectionLabel>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {!done ? (
            <div style={{ padding: '26px 20px', textAlign: 'center' }}>
              <Donut segments={[{ value: answered, color: 'var(--brand)' }, { value: REFLEX_QUIZ.length - answered, color: 'var(--bar-track)' }]}
                size={120} thickness={14} centerMain={answered + '/' + REFLEX_QUIZ.length} centerSub={L('odpovězeno')} />
              <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-soft)', margin: '14px auto 0', maxWidth: 230, lineHeight: 1.5 }}>{L('Odpověz na všechny otázky a ukáže se tvé hodnocení i tip na příští měsíc.')}</p>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative', padding: '24px 20px 20px', textAlign: 'center' }}>
                <div className="fa-hero-glow" />
                <div style={{ position: 'relative' }}>
                  <Donut segments={reflexSegments(score, maxScore)} size={132} thickness={16}
                    centerTop={L('Hodnocení')} centerMain={pct + '\u00A0%'} centerSub={L(band.label)} />
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 15px', borderRadius: 999, background: accentSoft(band.accent), color: accentVar(band.accent) }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: accentVar(band.accent) }} />
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600 }}>{L('Tento měsíc:')} {L(band.label)}</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '4px 18px 20px' }}>
                <div className="fa-invest-note" style={{ marginTop: 0 }}>
                  <Icon name="bulb" size={16} stroke={1.7} />
                  <div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 4 }}>{L('Tip na příští měsíc')}</div>
                    <p style={{ margin: 0 }}>{L(band.tip)}</p>
                  </div>
                </div>
                <button className="fa-textbtn" style={{ marginTop: 12 }} onClick={() => setAnswers({})}>{L('Vyplnit znovu')}</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function reflexSegments(score, max) {
  const b = reflexBand(score, max);
  const col = b.key === 'joy' ? 'var(--moss)' : b.key === 'balance' ? 'var(--honey)' : 'var(--clay)';
  return [{ value: score, color: col }, { value: max - score, color: 'var(--bar-track)' }];
}

// ════════════════════════════════════════════════════════════════════
// VÍCE — settings, warmly restyled
// ════════════════════════════════════════════════════════════════════
function Vice({ lang, setLang, theme, setTheme, ratios, setRatios, profile, setProfile, resetAll }) {
  const real = profile && !profile.demo;
  const [sheet, setSheet] = useS2(null); // 'income' | 'security' | 'reminders' | null
  const [, bump] = useS2(0);
  const refresh = () => { if (setProfile) setProfile(loadFaProfile()); bump(n => n + 1); };
  const sec = loadFaSecurity();
  const rem = loadFaReminders();
  const secLabel = sec ? L('PIN kód') : L('Vypnuto');
  const remLabel = rem.on ? `${L('V kalendáři')} · ${L(rem.freq === 'denně' ? 'Denně' : 'Týdně')}` : L('Vypnuto');
  // backup / restore
  const fileRef = React.useRef(null);
  const [dataMsg, setDataMsg] = useS2('');
  const exportBackup = () => {
    const ok = faDownload('vedome-utraceni-zaloha-' + faTodayIso() + '.json', faExportData(), 'application/json');
    setDataMsg(ok ? L('Záloha se stáhla. Ulož si ji na bezpečné místo.') : L('Zálohu se nepodařilo vytvořit.'));
  };
  const onImportFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = faImportData(String(reader.result || ''));
      if (res.ok) { setDataMsg(L('Data obnovena. Načítám…')); setTimeout(() => location.reload(), 700); }
      else setDataMsg(L('Tenhle soubor nevypadá jako záloha Vědomého utrácení.'));
    };
    reader.onerror = () => setDataMsg(L('Soubor se nepodařilo přečíst.'));
    reader.readAsText(f);
  };
  const groups = [
    { h: 'Účet', rows: [
      { i: 'sprout', t: APP.user || L('Bez jména'), d: L('Osobní profil'), raw: true },
      { i: 'sun', t: L('Měsíční příjem'), d: kc(APP.income), raw: true, open: 'income' },
      { i: 'shield', t: L('Zabezpečení'), d: secLabel, raw: true, open: 'security' },
    ] },
    { h: 'Vědomé utrácení', rows: [ { i: 'bell', t: L('Jemné připomínky'), d: remLabel, raw: true, open: 'reminders' } ] },
  ];
  return (
    <div className="fa-screen">
      <ScreenHeader eyebrow={L('Nastavení')} title={L('Více')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {groups.map((grp, gi) => (
          <div key={gi}>
            <SectionLabel>{L(grp.h)}</SectionLabel>
            <Card pad={0} style={{ overflow: 'hidden' }}>
              {grp.rows.map((row, ri) => (
                <div key={ri} className="fa-row" style={{ borderTop: ri ? '1px solid var(--card-line)' : 'none', cursor: row.open ? 'pointer' : 'default' }}
                  role={row.open ? 'button' : undefined} tabIndex={row.open ? 0 : undefined}
                  onKeyDown={row.open ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheet(row.open); } }) : undefined}
                  onClick={row.open ? () => setSheet(row.open) : undefined}>
                  <Medallion icon={row.i === 'bell' ? 'alert' : row.i} accent={['moss','honey','blush','sage'][ri % 4]} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.raw ? row.t : L(row.t)}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', whiteSpace: 'nowrap', flexShrink: 0 }}>{row.raw ? row.d : L(row.d)}</span>
                  <Icon name="chevron" size={16} stroke={1.8} color="var(--ink-faint)" />
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <SectionLabel>{L('Vzhled')}</SectionLabel>
        <Card pad={14}>
          <div className="fa-lang">
            <button data-on={theme === 'lesní'} onClick={() => setTheme('lesní')}>{L('Lesní klid')}</button>
            <button data-on={theme === 'kouzelnický'} onClick={() => setTheme('kouzelnický')}>{L('Kouzelnický')}</button>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 18 }}>
        <SectionLabel>{L('Poměry kategorií')}</SectionLabel>
        <RatioEditor ratios={ratios} setRatios={setRatios} />
      </div>

      <div style={{ marginTop: 18 }}>
        <SectionLabel>{L('Jazyk')}</SectionLabel>
        <Card pad={14}>
          <div className="fa-lang">
            {FA_LANGS.map(l => (
              <button key={l.code} data-on={lang === l.code} onClick={() => setLang(l.code)}>{l.name}</button>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 18 }}>
        <SectionLabel>{L('Data')}</SectionLabel>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <DataRow icon="leaf" accent="moss" label={L('Zálohovat data do souboru')}
            sub={L('Data jsou jen v tomto prohlížeči. Záloha je pojistka i cesta na jiné zařízení.')} onClick={exportBackup} />
          <DataRow icon="sprout" accent="honey" label={L('Obnovit ze zálohy')}
            sub={L('Nahradí současná data obsahem souboru')} onClick={() => fileRef.current && fileRef.current.click()} border />
          {real && (
            <div style={{ borderTop: '1px solid var(--card-line)' }}>
              <DangerRow label={L('Smazat všechna data')} confirmLabel={L('Opravdu smazat? Nejde vrátit')} onConfirm={resetAll} />
            </div>
          )}
        </Card>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onImportFile} />
        {dataMsg && (
          <p role="status" style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-soft)', margin: '9px 6px 0', lineHeight: 1.45 }}>{dataMsg}</p>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 26, opacity: 0.7 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--brand)', whiteSpace: 'nowrap' }}>
          <Icon name="leaf" size={15} stroke={1.7} />
          <span className="fa-footer-name" style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink-soft)', fontStyle: 'italic' }}>Vědomé utrácení</span>
        </div>
        <div className="fa-footer-sub" style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 4, letterSpacing: 0.3 }}>{faLabel(L('Lesní klid'), L('Kouzelnický'))} · {L('verze 1.0')}</div>
      </div>

      <IncomeSheet open={sheet === 'income'} onClose={() => setSheet(null)} onChanged={refresh} demo={!real} />
      <SecuritySheet open={sheet === 'security'} onClose={() => setSheet(null)} onChanged={refresh} />
      <RemindersSheet open={sheet === 'reminders'} onClose={() => setSheet(null)} onChanged={refresh} />
    </div>
  );
}

// two-step destructive row (tap → arm → tap to confirm)
function DangerRow({ label, confirmLabel, onConfirm }) {
  const [armed, setArmed] = useS2(false);
  return (
    <div className="fa-row" style={{ cursor: 'pointer' }} role="button" tabIndex={0}
      onClick={() => armed ? onConfirm() : setArmed(true)}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); armed ? onConfirm() : setArmed(true); } }}>
      <Medallion icon="alert" accent="blush" size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 14.5, fontWeight: 600, color: 'var(--clay)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{armed ? confirmLabel : label}</div>
      </div>
      {armed && <button className="fa-textbtn" onClick={e => { e.stopPropagation(); setArmed(false); }}>{L('Zrušit')}</button>}
      <Icon name="chevron" size={16} stroke={1.8} color="var(--ink-faint)" />
    </div>
  );
}

// plain action row inside a settings card (a real <button>)
function DataRow({ icon, accent, label, sub, onClick, border }) {
  return (
    <button type="button" className="fa-row fa-row-btn" onClick={onClick} style={{ borderTop: border ? '1px solid var(--card-line)' : 'none' }}>
      <Medallion icon={icon} accent={accent} size={36} />
      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', fontWeight: 500 }}>{label}</span>
        {sub && <span style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.4 }}>{sub}</span>}
      </span>
      <Icon name="chevron" size={16} stroke={1.8} color="var(--ink-faint)" />
    </button>
  );
}

// editable 50/30/20 ratios — three steppers + live total
function RatioEditor({ ratios, setRatios }) {
  const cats = APP.categories;
  const total = cats.reduce((s, c) => s + (ratios[c.key] || 0), 0);
  const ok = total === 100;
  const set = (key, v) => { const n = Math.max(0, Math.min(100, Math.round(v))); setRatios({ ...ratios, [key]: n }); };
  return (
    <Card pad={16}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {cats.map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: accentVar(c.accent), flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L(c.name)}</span>
            <div className="fa-step">
              <button onClick={() => set(c.key, (ratios[c.key] || 0) - 5)} aria-label="minus">−</button>
              <span style={{ minWidth: 46, textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)' }}>{ratios[c.key] || 0}&nbsp;%</span>
              <button onClick={() => set(c.key, (ratios[c.key] || 0) + 5)} aria-label="plus">+</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--card-line)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: ok ? 'var(--moss-deep)' : 'var(--clay)' }}>
          <Icon name={ok ? 'check' : 'alert'} size={15} stroke={2} /> {L('Celkem')} {total}&nbsp;%
        </span>
        <button className="fa-textbtn" onClick={() => setRatios({ nutne: 50, budouci: 20, radost: 30 })}>{L('Obnovit 50 / 30 / 20')}</button>
      </div>
    </Card>
  );
}

Object.assign(window, { Cile, Tipy, Reflexe, Vice, RatioEditor, PlantStage, GrowthScene, AddGoalForm, GoalCard, DangerRow, DataRow });
