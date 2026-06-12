// fa-settings.jsx — working settings for the Více screen:
// • Zabezpečení: 4-digit PIN or (simulated) Face ID + lock screen on launch
// • Jemné připomínky: on/off + frequency + time (with Notification permission)
// • Měsíční příjem: edit income sources (the same data Plán uses)
// All persisted in localStorage; PIN stored as a plain string (prototype —
// the real app should hash it / use Keychain via Capacitor).

const { useState: useSt, useEffect: useStE, useRef: useStR } = React;

// ── stores ───────────────────────────────────────────────────────────────
function loadFaSecurity() { try { return JSON.parse(localStorage.getItem('fa.security')); } catch (e) { return null; } }
function saveFaSecurity(v) { try { v ? localStorage.setItem('fa.security', JSON.stringify(v)) : localStorage.removeItem('fa.security'); } catch (e) {} }
function loadFaReminders() { try { return JSON.parse(localStorage.getItem('fa.reminders')) || { on: false, freq: 'denně', time: '20:00' }; } catch (e) { return { on: false, freq: 'denně', time: '20:00' }; } }
function saveFaReminders(v) { try { localStorage.setItem('fa.reminders', JSON.stringify(v)); } catch (e) {} }

// ── shared bottom-sheet shell (same look as AddSheet) ───────────────────
function SettingsSheet({ open, title, onClose, children }) {
  const [shown, setShown] = useSt(false);
  useStE(() => {
    if (open) { const t = setTimeout(() => setShown(true), 15); return () => clearTimeout(t); }
    setShown(false);
  }, [open]);
  if (!open) return null;
  return (
    <div className={'fa-sheet-wrap' + (shown ? ' is-open' : '')}>
      <div className="fa-sheet-backdrop" onClick={onClose}></div>
      <div className="fa-sheet" role="dialog" aria-label={title}>
        <div className="fa-sheet-grip"></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="fa-cardtitle" style={{ fontSize: 21 }}>{title}</h3>
          <button className="fa-sheet-x" onClick={onClose} aria-label={L('Zrušit')}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── PIN dots + keypad ────────────────────────────────────────────────────
function PinDots({ len, max = 4, error }) {
  return (
    <div className={'fa-pin-dots' + (error ? ' is-err' : '')}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className="fa-pin-dot" data-on={i < len} />
      ))}
    </div>
  );
}

function PinPad({ onDigit, onBack, disabled }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <div className="fa-pin-pad">
      {keys.map((k, i) => k === '' ? <span key={i} /> : (
        <button key={i} className="fa-pin-key" disabled={disabled}
          onClick={() => k === '⌫' ? onBack() : onDigit(k)}>{k}</button>
      ))}
    </div>
  );
}

// ── Zabezpečení sheet: none / PIN / Face ID ─────────────────────────────
function SecuritySheet({ open, onClose, onChanged }) {
  const sec = loadFaSecurity();
  const [stage, setStage] = useSt('menu');   // menu | pin1 | pin2
  const [first, setFirst] = useSt('');
  const [entry, setEntry] = useSt('');
  const [err, setErr] = useSt(false);
  useStE(() => { if (open) { setStage('menu'); setFirst(''); setEntry(''); setErr(false); } }, [open]);

  const choose = (mode) => {
    if (mode === 'none') { saveFaSecurity(null); onChanged(); onClose(); }
    else if (mode === 'face') { saveFaSecurity({ mode: 'face' }); onChanged(); onClose(); }
    else { setStage('pin1'); setEntry(''); setFirst(''); }
  };

  const digit = (d) => {
    if (entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length < 4) return;
    // full PIN entered
    setTimeout(() => {
      if (stage === 'pin1') { setFirst(next); setEntry(''); setStage('pin2'); }
      else if (next === first) { saveFaSecurity({ mode: 'pin', pin: next }); onChanged(); onClose(); }
      else { setErr(true); setTimeout(() => { setErr(false); setEntry(''); setFirst(''); setStage('pin1'); }, 650); }
    }, 160);
  };

  const Row = ({ icon, label, sub, on, onClick }) => (
    <button className="fa-sec-row" data-on={on} onClick={onClick}>
      <Medallion icon={icon} accent={on ? 'moss' : 'sage'} size={38} />
      <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)', marginTop: 1 }}>{sub}</span>}
      </span>
      {on && <Icon name="check" size={18} stroke={2.2} color="var(--moss)" />}
    </button>
  );

  return (
    <SettingsSheet open={open} title={L('Zabezpečení')} onClose={onClose}>
      {stage === 'menu' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 6 }}>
          <Row icon="leaf" label={L('Bez zámku')} sub={L('Aplikace se otevře rovnou')} on={!sec} onClick={() => choose('none')} />
          <Row icon="key" label={L('PIN kód')} sub={sec && sec.mode === 'pin' ? L('Nastaven · klepni pro změnu') : L('4místný kód při spuštění')} on={sec && sec.mode === 'pin'} onClick={() => choose('pin')} />
          <Row icon="faceid" label="Face ID" sub={L('Odemknutí pohledem (simulace)')} on={sec && sec.mode === 'face'} onClick={() => choose('face')} />
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-faint)', margin: '6px 4px 0', lineHeight: 1.45 }}>
            {L('V hotové aplikaci se PIN ukládá šifrovaně a Face ID používá systémové ověření.')}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', margin: '2px 0 14px' }}>
            {stage === 'pin1' ? L('Zadej nový PIN') : L('Zopakuj PIN')}
          </p>
          <PinDots len={entry.length} error={err} />
          {err && <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--clay)', marginTop: 8 }}>{L('PINy se neshodují, zkus to znovu')}</div>}
          <PinPad onDigit={digit} onBack={() => setEntry(entry.slice(0, -1))} />
          <button className="fa-textbtn" style={{ marginTop: 4 }} onClick={() => setStage('menu')}>{L('Zrušit')}</button>
        </div>
      )}
    </SettingsSheet>
  );
}

// ── Jemné připomínky sheet ──────────────────────────────────────────────
function RemindersSheet({ open, onClose, onChanged }) {
  const [rem, setRem] = useSt(loadFaReminders);
  useStE(() => { if (open) setRem(loadFaReminders()); }, [open]);
  const update = (patch) => {
    const next = { ...rem, ...patch };
    setRem(next); saveFaReminders(next); onChanged();
    if (patch.on && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) {}
    }
  };
  const Seg = ({ value, options, onPick }) => (
    <div className="fa-lang">
      {options.map(o => <button key={o.v} data-on={value === o.v} onClick={() => onPick(o.v)}>{o.l}</button>)}
    </div>
  );
  return (
    <SettingsSheet open={open} title={L('Jemné připomínky')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Medallion icon="alert" accent="honey" size={38} />
          <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{L('Připomínat zápis výdajů')}</span>
          <button className="fa-switch" data-on={rem.on} onClick={() => update({ on: !rem.on })} aria-label={rem.on ? L('Zapnuto') : L('Vypnuto')}>
            <span className="fa-switch-knob" />
          </button>
        </div>
        {rem.on && (
          <React.Fragment>
            <div>
              <div className="fa-sheet-label">{L('Jak často')}</div>
              <Seg value={rem.freq} onPick={v => update({ freq: v })} options={[{ v: 'denně', l: L('Denně') }, { v: 'týdně', l: L('Týdně') }]} />
            </div>
            <div>
              <div className="fa-sheet-label">{L('V kolik hodin')}</div>
              <Seg value={rem.time} onPick={v => update({ time: v })} options={[{ v: '8:00', l: L('Ráno') + ' · 8:00' }, { v: '12:00', l: '12:00' }, { v: '20:00', l: L('Večer') + ' · 20:00' }]} />
            </div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-faint)', margin: '0 2px', lineHeight: 1.45 }}>
              {typeof Notification !== 'undefined' && Notification.permission === 'denied'
                ? L('Upozornění jsou v prohlížeči zablokovaná — povol je v nastavení.')
                : L('Jemné ťuknutí, žádný stres. V hotové aplikaci přijde jako notifikace.')}
            </p>
          </React.Fragment>
        )}
      </div>
    </SettingsSheet>
  );
}

// ── Měsíční příjem sheet — edits fa.plan.income (same data as Plán) ─────
function IncomeSheet({ open, onClose, onChanged, demo }) {
  const [list, setList] = useSt([]);
  useStE(() => {
    if (!open) return;
    const stored = faLoad('fa.plan.income', []);
    setList(stored.length ? stored.map(x => ({ ...x })) : APP.incomeSources.map(s => ({ name: s.name, amount: s.amount, recurring: true })));
  }, [open]);
  const total = list.reduce((s, x) => s + (+x.amount || 0), 0);
  const setAmt = (i, v) => setList(l => l.map((x, j) => j === i ? { ...x, amount: v.replace(/[^\d]/g, '') } : x));
  const save = () => {
    const clean = list.map(x => ({ ...x, amount: +x.amount || 0 })).filter(x => x.name);
    if (demo) {
      APP.income = total;
      APP.incomeSources = clean.map((x, i) => ({ name: x.name, amount: x.amount, accent: ['moss', 'honey', 'blush', 'sage'][i % 4] }));
    } else {
      faSave('fa.plan.income', clean);
    }
    onChanged(); onClose();
  };
  return (
    <SettingsSheet open={open} title={L('Měsíční příjem')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
        {list.map((x, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L(x.name)}</span>
            <input className="fa-inc-input" type="text" inputMode="numeric" value={x.amount}
              onChange={e => setAmt(i, e.target.value)} aria-label={L(x.name)} />
            <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)' }}>Kč</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--card-line)' }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{L('Celkem')}</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--ink)', fontWeight: 500 }}>{kc(total)}</span>
        </div>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-faint)', margin: 0, lineHeight: 1.45 }}>
          {L('Zdroje příjmu přidáš a odebereš v části Plán.')}
        </p>
        <button className="fa-cta fa-cta-solid" onClick={save}>{L('Uložit')}</button>
      </div>
    </SettingsSheet>
  );
}

// ── Lock screen — shown on launch when security is configured ──────────
function LockScreen({ security, userName, onUnlock }) {
  const [entry, setEntry] = useSt('');
  const [err, setErr] = useSt(false);
  const [scanning, setScanning] = useSt(false);

  const digit = (d) => {
    if (entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length < 4) return;
    setTimeout(() => {
      if (next === security.pin) onUnlock();
      else { setErr(true); setTimeout(() => { setErr(false); setEntry(''); }, 600); }
    }, 160);
  };

  const scanFace = () => {
    if (scanning) return;
    setScanning(true);
    setTimeout(onUnlock, 1100); // simulated scan
  };

  return (
    <div className="fa-lock" data-screen-label="Zámek">
      <div className="fa-lock-inner">
        <div className="fa-lock-mark">
          <Icon name={security.mode === 'face' ? 'faceid' : 'key'} size={30} stroke={1.5} />
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)', fontWeight: 500 }}>
          {userName ? Lf('Vítej zpět, {n}', { n: userName }) : L('Vítej zpět')}
        </div>
        {security.mode === 'pin' ? (
          <React.Fragment>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{L('Zadej PIN')}</div>
            <div style={{ marginTop: 18 }}><PinDots len={entry.length} error={err} /></div>
            {err && <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--clay)', marginTop: 8 }}>{L('Špatný PIN')}</div>}
            <PinPad onDigit={digit} onBack={() => setEntry(entry.slice(0, -1))} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{L('Klepni pro odemknutí')}</div>
            <button className={'fa-face-btn' + (scanning ? ' is-scan' : '')} onClick={scanFace} aria-label="Face ID">
              <Icon name="faceid" size={44} stroke={1.3} />
              <span className="fa-face-beam" />
            </button>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-faint)', marginTop: 10 }}>
              {scanning ? L('Ověřuji…') : 'Face ID'}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  loadFaSecurity, saveFaSecurity, loadFaReminders, saveFaReminders,
  SettingsSheet, SecuritySheet, RemindersSheet, IncomeSheet, LockScreen, PinPad, PinDots,
});
