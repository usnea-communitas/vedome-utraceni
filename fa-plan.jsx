// fa-plan.jsx — interactive monthly plan.
// Emphasis on the split graph (not the income number). Total income is a
// collapsible row you expand to add individual incomes. Each of the 3 categories
// (Potřebné / Budoucí já / Radost) carries a short description, a structure
// graphic, and expands to manage individual items: add (incl. auto-suggested),
// delete, and a recurring-monthly toggle. State persists to localStorage.

const { useState: usePl, useEffect: usePlE } = React;

// ── persisted state helpers ──
function plLoad(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
function plSave(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

// ── seed data (used until the user edits; mirrors APP totals) ──
const PLAN_INCOME0 = [
  { name: 'Hlavní práce', amount: 1900, recurring: true },
  { name: 'Coaching', amount: 430, recurring: true },
  { name: 'Podpora', amount: 180, recurring: true },
  { name: 'Drobné brigády', amount: 90, recurring: false },
];
const PLAN_ITEMS0 = {
  nutne:   [ { name: 'Nájem', amount: 780, recurring: true }, { name: 'Energie', amount: 360, recurring: true }, { name: 'Jídlo', amount: 280, recurring: true }, { name: 'Doprava', amount: 90, recurring: true } ],
  budouci: [ { name: 'Spoření', amount: 230, recurring: true }, { name: 'Investice', amount: 150, recurring: true } ],
  radost:  [ { name: 'Kavárna', amount: 210, recurring: true }, { name: 'Výlety', amount: 200, recurring: false }, { name: 'Předplatné', amount: 120, recurring: true } ],
};
const PLAN_SUGGEST = {
  nutne:   ['Telefon a internet', 'Doprava', 'Jídlo', 'Energie'],
  budouci: ['Rezerva', 'Investice', 'Spoření'],
  radost:  ['Dárky', 'Výlety', 'Předplatné', 'Kavárna'],
};
const PLAN_DESC = {
  nutne: 'Nájem, energie a jídlo — základ, bez kterého se neobejdeš.',
  budouci: 'Spoření a investice, které pěstuješ pro sebe.',
  radost: 'Kavárny, výlety a drobnosti, co tě těší.',
};

function Plan({ go, month, setMonth, ratios }) {
  const cats = APP.categories; // {key,name,icon,accent,targetPct}
  const [income, setIncome] = usePl(() => plLoad('fa.plan.income', PLAN_INCOME0));
  const [items, setItems] = usePl(() => plLoad('fa.plan.items', PLAN_ITEMS0));
  const [open, setOpen] = usePl(null); // 'income' | cat.key | null
  usePlE(() => plSave('fa.plan.income', income), [income]);
  usePlE(() => plSave('fa.plan.items', items), [items]);

  const incomeTotal = income.reduce((s, x) => s + (+x.amount || 0), 0);
  const catTotal = (k) => (items[k] || []).reduce((s, x) => s + (+x.amount || 0), 0);
  const allocated = cats.reduce((s, c) => s + catTotal(c.key), 0);
  const remaining = incomeTotal - allocated;

  const segs = cats.map(c => ({ value: catTotal(c.key), color: accentVar(c.accent) }));
  if (remaining > 0) segs.push({ value: remaining, color: 'var(--unalloc)' });

  const setCatItems = (k, next) => setItems({ ...items, [k]: next });

  return (
    <div className="fa-screen">
      <ScreenHeader eyebrow={L('Měsíční plán')} title={L('Plán')} right={<MonthPill month={APP.month} setMonth={setMonth} ratios={ratios} go={go} />} />

      {/* ── Hero: the split graph is the priority ── */}
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ position: 'relative', padding: '18px 18px 14px' }}>
          <div className="fa-hero-glow" />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
              <h3 className="fa-cardtitle" style={{ fontSize: 18, whiteSpace: 'nowrap' }}>{L('Co rozdělit')}</h3>
              <span style={{ fontFamily: 'var(--title)', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>{Math.round(allocated / (incomeTotal || 1) * 100)}&nbsp;%</span>
            </div>
            <PlanRibbon segments={segs} h={18} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginTop: 12 }}>
              {cats.map(c => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2.5, background: accentVar(c.accent) }} />
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{L(c.name)} {Math.round(catTotal(c.key) / (incomeTotal || 1) * 100)} %</span>
                </div>
              ))}
              {remaining > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2.5, background: 'var(--unalloc)' }} />
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{L('Volné')} {Math.round(remaining / (incomeTotal || 1) * 100)} %</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* status banner */}
        <div style={{ padding: '11px 16px', background: remaining < 0 ? 'var(--clay-soft)' : remaining === 0 ? 'var(--moss-soft)' : 'var(--honey-soft)', display: 'flex', alignItems: 'center', gap: 9, borderTop: '1px solid var(--card-line)' }}>
          <Icon name={remaining < 0 ? 'alert' : remaining === 0 ? 'check' : 'leaf'} size={16} stroke={1.8} color={remaining < 0 ? 'var(--clay)' : remaining === 0 ? 'var(--moss-deep)' : 'var(--honey-deep)'} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 500, color: remaining < 0 ? 'var(--clay)' : remaining === 0 ? 'var(--moss-deep)' : 'var(--honey-deep)' }}>
            {remaining < 0 ? Lf('Překročeno o {v}', { v: kc(-remaining) }) : remaining === 0 ? L('Vše rozděleno — krásně vyvážené.') : Lf('Ještě zbývá rozdělit {v}.', { v: kc(remaining) })}
          </span>
        </div>

        {/* total income — collapsible (smaller, secondary) */}
        <button className="fa-planrow" onClick={() => setOpen(open === 'income' ? null : 'income')}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-soft)' }}>{L('Celkový příjem')}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontWeight: 600 }}>{kc(incomeTotal)}</div>
          </div>
          <Icon name="chevron" size={17} stroke={1.9} color="var(--ink-faint)" style={{ transform: open === 'income' ? 'rotate(90deg)' : 'none', transition: 'transform .25s' }} />
        </button>
        {open === 'income' && (
          <div style={{ borderTop: '1px solid var(--card-line)', background: 'color-mix(in oklab, var(--cream), transparent 35%)' }}>
            <ItemEditor list={income} setList={setIncome} accent="moss" suggest={[]} addLabel={L('Přidat příjem')} />
          </div>
        )}
      </Card>

      {/* ── Categories ── */}
      <SectionLabel>{L('Rozděl podle 50 / 30 / 20')}</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cats.map(c => {
          const total = catTotal(c.key);
          const pctIncome = Math.round(total / (incomeTotal || 1) * 100);
          const over = pctIncome > c.targetPct;
          const isOpen = open === c.key;
          return (
            <Card key={c.key} pad={0} style={{ overflow: 'hidden' }}>
              <button className="fa-cat-head" onClick={() => setOpen(isOpen ? null : c.key)}>
                <Medallion icon={c.icon} accent={c.accent} size={40} />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', fontWeight: 500, margin: 0, whiteSpace: 'nowrap' }}>{L(c.name)}</h3>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{L('cíl')} {c.targetPct} %</span>
                  </div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, lineHeight: 1.35, color: 'var(--ink-soft)', marginTop: 3 }}>{L(PLAN_DESC[c.key])}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)' }}>{kc(total)}</div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600, color: over ? 'var(--clay)' : 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{pctIncome} %</div>
                </div>
                <Icon name="chevron" size={17} stroke={1.9} color="var(--ink-faint)" style={{ flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .25s' }} />
              </button>
              {/* structure graphic */}
              <div style={{ padding: '0 16px 14px' }}>
                <StructureBar items={items[c.key] || []} accent={c.accent} />
              </div>
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--card-line)', background: 'color-mix(in oklab, var(--cream), transparent 35%)' }}>
                  <ItemEditor list={items[c.key] || []} setList={(n) => setCatItems(c.key, n)} accent={c.accent}
                    suggest={PLAN_SUGGEST[c.key]} addLabel={L('Přidat položku')} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Měsíční rozhodnutí — jednoduchá grafická rekapitulace (bez klikání) ── */}
      <div style={{ marginTop: 22 }}>
        <SectionLabel>{L('Měsíční rozhodnutí')}</SectionLabel>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cats.map(c => {
              const total = catTotal(c.key);
              const pctIncome = Math.round(total / (incomeTotal || 1) * 100);
              return (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Medallion icon={c.icon} accent={c.accent} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap' }}>{L(c.name)}</span>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: pctIncome > c.targetPct ? 'var(--clay)' : 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{pctIncome} % / {L('cíl')} {c.targetPct} %</span>
                    </div>
                    <Bar pct={Math.min(pctIncome / c.targetPct * 100, 100)} color={accentVar(c.accent)} h={8} delay={120} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <button className="fa-cta fa-cta-solid" style={{ marginTop: 18 }} onClick={() => go('prehled')}>{L('Uložit plán')}</button>
    </div>
  );
}

// ── stacked allocation ribbon ──
function PlanRibbon({ segments, h = 14 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div style={{ display: 'flex', gap: 3, height: h, borderRadius: 999, overflow: 'hidden', background: 'var(--bar-track)' }}>
      {segments.map((s, i) => (
        <div key={i} style={{ flex: Math.max(s.value, 0.0001), background: s.color, borderRadius: 999, transition: 'flex .6s cubic-bezier(.2,.8,.2,1)' }} />
      ))}
    </div>
  );
}

// ── mini structure bar: proportion of each item within a category ──
function StructureBar({ items, accent }) {
  const total = items.reduce((s, x) => s + (+x.amount || 0), 0) || 1;
  const base = accentVar(accent);
  if (!items.length) return <div style={{ height: 8, borderRadius: 999, background: 'var(--bar-track)' }} />;
  return (
    <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 999, overflow: 'hidden' }}>
      {items.map((it, i) => (
        <div key={i} title={it.name} style={{
          flex: Math.max(+it.amount || 0, 0.0001),
          background: `color-mix(in oklab, ${base}, #fff ${(i % 4) * 13}%)`,
          borderRadius: 999,
        }} />
      ))}
    </div>
  );
}

// ── item editor: rows (name, amount, recurring toggle, delete) + add + suggest ──
function ItemEditor({ list, setList, accent, suggest, addLabel }) {
  const [name, setName] = usePl('');
  const [amount, setAmount] = usePl('');
  const update = (i, patch) => setList(list.map((it, k) => k === i ? { ...it, ...patch } : it));
  const remove = (i) => setList(list.filter((_, k) => k !== i));
  const add = (nm, amt, rec) => {
    const a = parseInt(String(amt).replace(/\s/g, ''), 10);
    if (!String(nm).trim() || !a || a <= 0) return false;
    setList([...list, { name: String(nm).trim(), amount: a, recurring: rec !== false }]);
    return true;
  };
  const commit = () => { if (add(name, amount, true)) { setName(''); setAmount(''); } };
  const used = new Set(list.map(it => it.name));
  const chips = (suggest || []).filter(s => !used.has(s));

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
      {list.map((it, i) => (
        <div key={i} className="fa-item">
          <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L(it.name)}</span>
          <button className={'fa-rec' + (it.recurring ? ' on' : '')} title={L('Opakuje se měsíčně')}
            onClick={() => update(i, { recurring: !it.recurring })}>
            <Icon name="repeat" size={13} stroke={2} />
          </button>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{kc(it.amount)}</span>
          <button className="fa-item-del" onClick={() => remove(i)} aria-label="x"><Icon name="trash" size={15} stroke={1.7} /></button>
        </div>
      ))}

      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-faint)', alignSelf: 'center' }}>{L('Návrhy')}:</span>
          {chips.map(s => (
            <button key={s} className="fa-chip" onClick={() => add(s, defaultFor(s), true)}>
              <Icon name="plus" size={11} stroke={2.4} /> {L(s)}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
        <input className="fa-input" value={name} placeholder={L('Název položky')} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && commit()} style={{ flex: 1.4 }} />
        <input className="fa-input" type="number" inputMode="numeric" value={amount} placeholder={L('Částka (Kč)')} onChange={e => setAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && commit()} style={{ flex: 1, minWidth: 0 }} />
        <button className="fa-input-btn" onClick={commit} style={{ ['--accent']: accentVar(accent) }}>{L('Přidat')}</button>
      </div>
    </div>
  );
}

// sensible default amount for a suggested item
function defaultFor(name) {
  const map = { 'Telefon a internet': 90, 'Doprava': 90, 'Jídlo': 280, 'Energie': 360, 'Rezerva': 200, 'Investice': 150, 'Spoření': 230, 'Dárky': 100, 'Výlety': 200, 'Předplatné': 120, 'Kavárna': 180 };
  return map[name] || 100;
}

Object.assign(window, { Plan, PlanRibbon, StructureBar, ItemEditor });
