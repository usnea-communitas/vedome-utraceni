// fa-add.jsx — one-off expense capture: floating + button, bottom sheet
// with curated + repeated suggestions, localStorage persistence, and
// recomputation of category actuals/derived stats.

const { useState: useX, useEffect: useXE, useRef: useXR } = React;

// ── persistence ─────────────────────────────────────────────────────────
function loadFaExpenses() {
  try { return JSON.parse(localStorage.getItem('fa.expenses')) || []; } catch (e) { return []; }
}
function saveFaExpenses(list) {
  try { localStorage.setItem('fa.expenses', JSON.stringify(list)); } catch (e) {}
}

// ── curated common one-off expenses (Czech keys → i18n via L()) ────────
const FA_SUGGESTED = [
  { name: 'Nákup potravin', cat: 'nutne',   icon: 'fir' },
  { name: 'Benzín',         cat: 'nutne',   icon: 'leaf' },
  { name: 'Lékárna',        cat: 'nutne',   icon: 'shield' },
  { name: 'Káva',           cat: 'radost',  icon: 'blossom' },
  { name: 'Restaurace',     cat: 'radost',  icon: 'sun' },
  { name: 'Dárek',          cat: 'radost',  icon: 'blossom' },
  { name: 'Investice',      cat: 'budouci', icon: 'sprout' },
  { name: 'Spoření',        cat: 'budouci', icon: 'shield' },
];

// ── apply expenses onto the shared APP model (after ratios!) ───────────
function applyFaExpenses(expenses) {
  if (!APP._baseActuals) APP._baseActuals = APP.categories.map(c => c.actual);
  APP.plannedTotal = APP._baseActuals.reduce((s, v) => s + (+v || 0), 0);
  APP.spentTotal = expenses.reduce((s, e) => s + (+e.amount || 0), 0);
  APP.categories.forEach((c, i) => {
    const extra = expenses.reduce((s, e) => s + (e.cat === c.key ? e.amount : 0), 0);
    c.actual = APP._baseActuals[i] + extra;
    c.incomePct = Math.round(c.actual / APP.income * 100);
    c.ofTarget = c.target ? Math.round(c.actual / c.target * 100) : 0;
    const diff = c.actual - c.target;
    if (diff > 0) { c.tone = 'over'; c.status = 'Řešit'; }
    else if (c.key === 'budouci' && diff < 0) { c.tone = 'under'; c.status = 'Řešit'; }
    else { c.tone = 'ok'; c.status = 'OK'; }
  });
}

// localized note derived from live numbers (replaces static c.note)
function faCatNote(c) {
  const diff = c.actual - c.target;
  if (diff > 0) return Lf('Překročeno o {v}.', { v: kc(diff) });
  if (c.key === 'budouci' && diff < 0) return Lf('Pod cílem o {v}.', { v: kc(-diff) });
  return L('V rámci cíle.');
}

// default date of a new expense: today while looking at the current month,
// otherwise the 1st of the month being viewed (easy to change in the sheet)
function faDefaultDay(month) {
  const today = faTodayIso();
  return !month || month === today.slice(0, 7) ? today : month + '-01';
}

// ── floating + button ───────────────────────────────────────────────────
function AddFab({ onClick }) {
  return (
    <button className="fa-fab" onClick={onClick} aria-label={L('Přidat výdaj')}>
      <Icon name="plus" size={26} stroke={2.1} />
    </button>
  );
}

// ── bottom sheet ────────────────────────────────────────────────────────
function AddSheet({ open, onClose, onSave, expenses, month }) {
  const [amount, setAmount] = useX('');
  const [day, setDay] = useX('');
  const [name, setName] = useX('');
  const [cat, setCat] = useX('radost');
  const [shown, setShown] = useX(false);
  const amountRef = useXR(null);
  const savedRef = useXR(false);

  // slide-in: resting closed; .is-open added a tick after mount
  useXE(() => {
    if (open) {
      setAmount(''); setName(''); setCat('radost'); setDay(faDefaultDay(month)); savedRef.current = false;
      const id = setTimeout(() => setShown(true), 20);
      return () => clearTimeout(id);
    }
    setShown(false);
  }, [open]);

  // Esc closes the sheet
  useXE(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // repeated = names used ≥2× in history (most recent first), with last amount
  const counts = {};
  expenses.forEach(e => { counts[e.name] = (counts[e.name] || 0) + 1; });
  const seen = new Set();
  const repeated = [...expenses].reverse().filter(e => {
    if (counts[e.name] < 2 || seen.has(e.name)) return false;
    seen.add(e.name); return true;
  }).slice(0, 4);
  const curated = FA_SUGGESTED.filter(s => !seen.has(s.name)).slice(0, 8 - repeated.length);

  const amt = faAmount(amount);
  const valid = amt > 0 && name.trim().length > 0;
  const bump = (v) => setAmount(prev => String(faAmount(prev) + v));

  const pick = (n, c2) => {
    // Suggestions should only choose the label/category. Do not focus the
    // amount field or prefill a historical amount: on iOS this could summon
    // the numeric keyboard while the sheet is animating, briefly exposing the
    // app's dark background; it also made suggested expenses feel like they
    // had a random, hard-to-change amount.
    setName(n); setCat(c2);
  };
  const save = () => {
    if (!valid || savedRef.current) return;
    savedRef.current = true;
    try { navigator.vibrate && navigator.vibrate(12); } catch (e) {}
    onSave({ name: name.trim(), amount: amt, cat, ts: Date.now(), day: day || faTodayIso() });
    onClose();
  };

  return (
    <div className={'fa-sheet-wrap' + (shown ? ' is-open' : '')}>
      <div className="fa-sheet-backdrop" onClick={onClose}></div>
      <div className="fa-sheet" role="dialog" aria-label={L('Nový výdaj')}>
        <div className="fa-sheet-grip"></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="fa-cardtitle" style={{ fontSize: 21 }}>{L('Nový výdaj')}</h3>
          <button className="fa-sheet-x" onClick={onClose} aria-label={L('Zrušit')}>✕</button>
        </div>

        {/* amount */}
        <div className="fa-amount-row">
          <input ref={amountRef} className="fa-amount" type="text" inputMode="decimal"
            placeholder="0" value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^\d.,\s]/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') save(); }} />
          <span className="fa-amount-unit">Kč</span>
        </div>

        {/* quick amounts */}
        <div className="fa-chips" style={{ marginBottom: 12 }}>
          {[50, 100, 200, 500].map(v => (
            <button key={v} className="fa-chipbtn" onClick={() => bump(v)}>+{v}</button>
          ))}
        </div>

        {/* name */}
        <input className="fa-field" type="text" placeholder={L('Za co to bylo?')}
          value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); }} />

        {/* date — lets you log an expense into another day or month */}
        <label className="fa-date-row">
          <span>{L('Datum')}</span>
          <input className="fa-field fa-date" type="date" value={day} onChange={e => setDay(e.target.value)} />
        </label>

        {/* category picker */}
        <div className="fa-catpick">
          {APP.categories.map(c => {
            const left = c.target - c.actual;
            return (
              <button key={c.key} data-on={cat === c.key} onClick={() => setCat(c.key)}
                style={{ ['--cp']: accentVar(c.accent), ['--cp-soft']: accentSoft(c.accent) }}>
                <Icon name={c.icon} size={17} stroke={1.8} />
                <span>{L(c.name)}</span>
                <em className="fa-cat-left" data-neg={left < 0}>{left >= 0 ? Lf('zbývá {v}', { v: kc(left) }) : Lf('přes o {v}', { v: kc(-left) })}</em>
              </button>
            );
          })}
        </div>

        {/* suggestions */}
        {(repeated.length > 0 || curated.length > 0) && (
          <div style={{ marginTop: 14 }}>
            {repeated.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div className="fa-sheet-label">{L('Opakované')}</div>
                <div className="fa-chips">
                  {repeated.map(e => (
                    <button key={e.name} className="fa-chipbtn" data-acc="true" onClick={() => pick(e.name, e.cat)}>
                      {e.name} · {kc(e.amount)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="fa-sheet-label">{L('Návrhy')}</div>
            <div className="fa-chips">
              {curated.map(s => (
                <button key={s.name} className="fa-chipbtn" onClick={() => pick(L(s.name), s.cat)}>
                  <Icon name={s.icon} size={14} stroke={1.8} /> {L(s.name)}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="fa-cta fa-cta-solid" style={{ marginTop: 16, opacity: valid ? 1 : 0.45, pointerEvents: valid ? 'auto' : 'none' }} onClick={save}>
          {L('Přidat výdaj')}{valid ? ' · ' + kc(amt) : ''}
        </button>
      </div>
    </div>
  );
}

// ── recent expenses card (Přehled) ──────────────────────────────────────
function RecentExpenses({ expenses, onDelete, go, month }) {
  if (!expenses.length) return null;
  const recent = [...expenses].sort((x, y) => faExpenseDay(y).localeCompare(faExpenseDay(x)) || (y.ts - x.ts)).slice(0, 4);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const catOf = k => APP.categories.find(c => c.key === k) || APP.categories.find(c => c.key === 'radost') || APP.categories[0];
  return (
    <div style={{ marginBottom: 22 }}>
      <SectionLabel>{L('Poslední výdaje')}</SectionLabel>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        {recent.map((e, i) => {
          const c = catOf(e.cat);
          return (
            <div key={e.ts} className="fa-exp-row" style={{ borderTop: i ? '1px solid var(--card-line)' : 'none' }}>
              <span className="fa-exp-dot" style={{ background: accentVar(c.accent) }}></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-faint)' }}>{L(c.name)} · {faDayLabel(faExpenseDay(e))}</div>
              </div>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', whiteSpace: 'nowrap' }}>−{kc(e.amount)}</span>
              <button className="fa-exp-del" onClick={() => onDelete(e.ts)} aria-label={L('Smazat')}>✕</button>
            </div>
          );
        })}
        <div className="fa-exp-foot">
          <span>{month && month !== faCurrentMonth()
            ? Lf('Celkem za {m}: {v}', { m: getFaLang() === 'en' ? faMonthLabel(month) : faMonthLabel(month).toLocaleLowerCase(), v: kc(total) })
            : Lf('Celkem tento měsíc {v}', { v: kc(total) })}</span>
        </div>
      </Card>
    </div>
  );
}

// ── toast with undo (shown after adding an expense) ──────────────────
function FaToast({ toast, onUndo, onHide }) {
  useXE(() => {
    if (!toast) return;
    const id = setTimeout(onHide, 4500);
    return () => clearTimeout(id);
  }, [toast]);
  if (!toast) return null;
  return (
    <div className="fa-toast" key={toast.ts}>
      <Icon name="check" size={15} stroke={2.2} />
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toast.name} · −{kc(toast.amount)}</span>
      <button onClick={() => { onUndo(toast.ts); onHide(); }}>{L('Zpět')}</button>
    </div>
  );
}

Object.assign(window, { loadFaExpenses, saveFaExpenses, applyFaExpenses, faCatNote, AddFab, AddSheet, RecentExpenses, FaToast, FA_SUGGESTED });
