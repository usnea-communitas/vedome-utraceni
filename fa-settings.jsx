// fa-settings.jsx — working settings for the Více screen:
// • Zabezpečení: optional 4-digit PIN + lock screen on launch. The PIN is kept
//   only as a SHA-256 hash; it guards against a casual glance, the data itself
//   stays unencrypted in this browser's localStorage.
// • Jemné připomínky: frequency + time, delivered as a calendar file (.ics) —
//   a web app cannot wake the phone on its own.
// • Měsíční příjem: edit income sources (the same data Plán uses)

const { useState: useSt, useEffect: useStE, useRef: useStR } = React;

// ── stores ───────────────────────────────────────────────────────────────
function loadFaSecurity() {
  try {
    const v = JSON.parse(faStorage.get('fa.security'));
    // only PIN locks exist now; older simulated modes (face) are ignored
    return v && v.mode === 'pin' && (v.hash || v.pin) ? v : null;
  } catch (e) { return null; }
}
function saveFaSecurity(v) { try { v ? faStorage.set('fa.security', JSON.stringify(v)) : faStorage.remove('fa.security'); } catch (e) {} }
function loadFaReminders() { try { return JSON.parse(faStorage.get('fa.reminders')) || { on: false, freq: 'denně', time: '20:00' }; } catch (e) { return { on: false, freq: 'denně', time: '20:00' }; } }
function saveFaReminders(v) { try { faStorage.set('fa.reminders', JSON.stringify(v)); } catch (e) {} }

// SHA-256 of the PIN (salted with the app name); falls back to a simple
// string hash where WebCrypto is unavailable (non-secure origins).
async function faHashPin(pin) {
  const text = 'vedome-utraceni:' + pin;
  try {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return 'f' + h.toString(16);
}

// save a text file to the user's device
function faDownload(filename, text, type) {
  try {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (e) { return false; }
}

// recurring calendar reminder (floating local time, 10 min, alarm at start)
function faReminderIcs(rem) {
  const parts = String(rem.time || '20:00').split(':');
  const h = parseInt(parts[0], 10) || 0, m = parseInt(parts[1], 10) || 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (start <= now) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + 10 * 60000);
  const p = n => String(n).padStart(2, '0');
  const local = d => d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00';
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
  const title = esc(L('Zapsat výdaje do Vědomého utrácení'));
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vedome utraceni//CS', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:vedome-utraceni-' + now.getTime() + '@vedome-utraceni',
    'DTSTAMP:' + stamp,
    'DTSTART:' + local(start),
    'DTEND:' + local(end),
    'RRULE:FREQ=' + (rem.freq === 'týdně' ? 'WEEKLY' : 'DAILY'),
    'SUMMARY:' + title,
    'DESCRIPTION:' + esc(L('Pár minut na zápis výdajů. Žádný stres.')),
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + title, 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}

// ── shared bottom-sheet shell (same look as AddSheet) ───────────────────
// Opening moves the keyboard focus into the sheet (unless a field there already
// took it) and Escape closes it, so a keyboard never wanders behind the backdrop.
function SettingsSheet({ open, title, onClose, children }) {
  const [shown, setShown] = useSt(false);
  const box = useStR(null);
  const close = useStR(onClose);
  close.current = onClose;
  useStE(() => {
    if (open) { const t = setTimeout(() => setShown(true), 15); return () => clearTimeout(t); }
    setShown(false);
  }, [open]);
  useStE(() => {
    if (!open) return;
    const t = setTimeout(() => { const el = box.current; if (el && !el.contains(document.activeElement)) el.focus(); }, 30);
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); close.current && close.current(); } };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [open]);
  if (!open) return null;
  return (
    <div className={'fa-sheet-wrap' + (shown ? ' is-open' : '')}>
      <div className="fa-sheet-backdrop" onClick={onClose}></div>
      <div className="fa-sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={box}>
        <div className="fa-sheet-grip"></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="fa-cardtitle" style={{ fontSize: 21 }}>{title}</h2>
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

// a physical keyboard works on the PIN screens too: digits type, Backspace deletes.
// The PIN confirms itself at the fourth digit, as on the keypad, so Enter has nothing
// to submit; it only must not press a focused keypad key a second time.
function useFaPinKeys(active, onDigit, onBack) {
  const latest = useStR(null);
  // layout effects, so the keys work from the moment the screen is shown
  React.useLayoutEffect(() => { latest.current = { onDigit, onBack }; });
  React.useLayoutEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      // the number row, or the numeric keypad even with Num Lock off
      const d = /^[0-9]$/.test(e.key) ? e.key : /^Numpad[0-9]$/.test(e.code) ? e.code.slice(6) : null;
      if (d) { e.preventDefault(); latest.current.onDigit(d); }
      else if (e.key === 'Backspace') { e.preventDefault(); latest.current.onBack(); }
      else if (e.key === 'Enter' && t && t.classList && t.classList.contains('fa-pin-key')) e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
}

function PinPad({ onDigit, onBack, disabled }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <div className="fa-pin-pad">
      {keys.map((k, i) => k === '' ? <span key={i} /> : (
        <button key={i} className="fa-pin-key" disabled={disabled}
          aria-label={k === '⌫' ? L('Smazat') : k}
          onClick={() => k === '⌫' ? onBack() : onDigit(k)}>{k}</button>
      ))}
    </div>
  );
}

// ── Zabezpečení sheet: none / PIN ───────────────────────────────────────
function SecuritySheet({ open, onClose, onChanged }) {
  const sec = loadFaSecurity();
  const [stage, setStage] = useSt('menu');   // menu | pin1 | pin2
  const [first, setFirst] = useSt('');
  const [entry, setEntry] = useSt('');
  const [err, setErr] = useSt(false);
  useStE(() => { if (open) { setStage('menu'); setFirst(''); setEntry(''); setErr(false); } }, [open]);

  const choose = (mode) => {
    if (mode === 'none') { saveFaSecurity(null); onChanged(); onClose(); }
    else { setStage('pin1'); setEntry(''); setFirst(''); }
  };

  const digit = (d) => {
    if (entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length < 4) return;
    // full PIN entered
    setTimeout(async () => {
      if (stage === 'pin1') { setFirst(next); setEntry(''); setStage('pin2'); }
      else if (next === first) { saveFaSecurity({ mode: 'pin', hash: await faHashPin(next) }); onChanged(); onClose(); }
      else { setErr(true); setTimeout(() => { setErr(false); setEntry(''); setFirst(''); setStage('pin1'); }, 650); }
    }, 160);
  };
  const back = () => setEntry(e => e.slice(0, -1));
  useFaPinKeys(open && stage !== 'menu', digit, back);

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
          <Row icon="key" label={L('PIN kód')} sub={sec ? L('Nastaven · klepni pro změnu') : L('4místný kód při spuštění')} on={!!sec} onClick={() => choose('pin')} />
          <p style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-faint)', margin: '6px 4px 0', lineHeight: 1.45 }}>
            {L('PIN brání jen náhodnému nahlédnutí. Data zůstávají v tomto prohlížeči a nejsou šifrovaná.')}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', margin: '2px 0 14px' }}>
            {stage === 'pin1' ? L('Zadej nový PIN') : L('Zopakuj PIN')}
          </p>
          <PinDots len={entry.length} error={err} />
          {err && <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--clay)', marginTop: 8 }}>{L('PINy se neshodují, zkus to znovu')}</div>}
          <PinPad onDigit={digit} onBack={back} />
          <button className="fa-textbtn" style={{ marginTop: 4 }} onClick={() => setStage('menu')}>{L('Zrušit')}</button>
        </div>
      )}
    </SettingsSheet>
  );
}

// ── Jemné připomínky sheet — reminder as a calendar event ───────────────
function RemindersSheet({ open, onClose, onChanged }) {
  const [rem, setRem] = useSt(loadFaReminders);
  const [saved, setSaved] = useSt(false);
  useStE(() => { if (open) { setRem(loadFaReminders()); setSaved(false); } }, [open]);
  const update = (patch) => {
    const next = { ...rem, ...patch };
    setRem(next); saveFaReminders(next); onChanged();
  };
  const addToCalendar = () => {
    const ok = faDownload('vedome-utraceni-pripominka.ics', faReminderIcs(rem), 'text/calendar;charset=utf-8');
    if (ok) { update({ on: true }); setSaved(true); }
  };
  const Seg = ({ value, options, onPick }) => (
    <div className="fa-lang">
      {options.map(o => <button key={o.v} data-on={value === o.v} onClick={() => { onPick(o.v); setSaved(false); }}>{o.l}</button>)}
    </div>
  );
  return (
    <SettingsSheet open={open} title={L('Jemné připomínky')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Medallion icon="alert" accent="honey" size={38} />
          <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
            {L('Aplikace běží v prohlížeči, takže sama upozornit neumí. Přidej si připomínku do kalendáře v telefonu nebo počítači — ozve se ve zvolený čas.')}
          </span>
        </div>
        <div>
          <div className="fa-sheet-label">{L('Jak často')}</div>
          <Seg value={rem.freq} onPick={v => update({ freq: v })} options={[{ v: 'denně', l: L('Denně') }, { v: 'týdně', l: L('Týdně') }]} />
        </div>
        <div>
          <div className="fa-sheet-label">{L('V kolik hodin')}</div>
          <Seg value={rem.time} onPick={v => update({ time: v })} options={[{ v: '8:00', l: L('Ráno') + ' · 8:00' }, { v: '12:00', l: '12:00' }, { v: '20:00', l: L('Večer') + ' · 20:00' }]} />
        </div>
        <button className="fa-cta fa-cta-solid" onClick={addToCalendar}>{L('Přidat do kalendáře')}</button>
        {saved && (
          <p role="status" style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--moss-deep)', margin: '0 2px', lineHeight: 1.45 }}>
            {L('Soubor s připomínkou se stáhl. Otevři ho a potvrď přidání do kalendáře.')}
          </p>
        )}
        {rem.on && (
          <button className="fa-textbtn" style={{ alignSelf: 'flex-start' }} onClick={() => { update({ on: false }); setSaved(false); }}>
            {L('Označit jako vypnuté')}
          </button>
        )}
      </div>
    </SettingsSheet>
  );
}

// ── Měsíční příjem sheet — edits the income of the month shown (same data as Plán) ──
function IncomeSheet({ open, onClose, onChanged, demo }) {
  const [list, setList] = useSt([]);
  useStE(() => {
    if (!open) return;
    const stored = faPlanFor(APP.month).income;
    setList(stored.length ? stored.map(x => ({ ...x })) : APP.incomeSources.map(s => ({ name: s.name, amount: s.amount, recurring: true })));
  }, [open]);
  const total = list.reduce((s, x) => s + faAmount(x.amount), 0);
  const setAmt = (i, v) => setList(l => l.map((x, j) => j === i ? { ...x, amount: v.replace(/[^\d.,\s]/g, '') } : x));
  const save = () => {
    const clean = list.map(x => ({ ...x, amount: faAmount(x.amount) })).filter(x => x.name);
    if (demo) {
      APP.income = total;
      APP.incomeSources = clean.map((x, i) => ({ name: x.name, amount: x.amount, accent: ['moss', 'honey', 'blush', 'sage'][i % 4] }));
    } else {
      const plan = faPlanFor(APP.month);
      if (JSON.stringify(clean) !== JSON.stringify(plan.income)) faSetPlanFor(APP.month, { ...plan, income: clean });
    }
    onChanged(); onClose();
  };
  return (
    <SettingsSheet open={open} title={L('Měsíční příjem')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
        {list.map((x, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{faDataLabel(x.name)}</span>
            <input className="fa-inc-input" type="text" inputMode="decimal" value={x.amount}
              onChange={e => setAmt(i, e.target.value)} aria-label={faDataLabel(x.name)} />
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

// ── Lock screen — shown on launch when a PIN is set ─────────────────────
function LockScreen({ security, userName, onUnlock, onReset }) {
  const [entry, setEntry] = useSt('');
  const [err, setErr] = useSt(false);
  const [busy, setBusy] = useSt(false);
  const [forgot, setForgot] = useSt(false); // the PIN cannot be recovered: offer an honest fresh start

  const digit = (d) => {
    if (busy || entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length < 4) return;
    setBusy(true);
    setTimeout(async () => {
      let ok = false;
      if (security.hash) ok = (await faHashPin(next)) === security.hash;
      else if (security.pin) {
        // legacy plain-text PIN: accept once, then upgrade to a hash
        ok = next === security.pin;
        if (ok) saveFaSecurity({ mode: 'pin', hash: await faHashPin(next) });
      }
      setBusy(false);
      if (ok) onUnlock();
      else { setErr(true); setTimeout(() => { setErr(false); setEntry(''); }, 600); }
    }, 160);
  };
  const back = () => { if (!busy) setEntry(e => e.slice(0, -1)); };
  useFaPinKeys(!forgot, digit, back);

  return (
    <div className="fa-lock" data-screen-label="Zámek" role="dialog" aria-modal="true" aria-label={L('Zadej PIN')}>
      <div className="fa-lock-inner">
        <div className="fa-lock-mark">
          <Icon name="key" size={30} stroke={1.5} />
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)', fontWeight: 500 }}>
          {userName ? Lf('Vítej zpět, {n}', { n: userName }) : L('Vítej zpět')}
        </h1>
        {forgot ? (
          <div className="fa-lock-forgot">
            <p>{L('PIN nejde obnovit. Můžeš smazat všechna data v tomto prohlížeči a začít znovu — plán, výdaje, cíle i reflexe zmizí. Pokud máš zálohu, obnovíš ji potom ve Více → Data.')}</p>
            <button type="button" className="fa-lock-reset" onClick={onReset}>{L('Smazat data a začít znovu')}</button>
            <button type="button" className="fa-textbtn" onClick={() => setForgot(false)}>{L('Zpět k PINu')}</button>
          </div>
        ) : (
          <React.Fragment>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{L('Zadej PIN')}</div>
            <div style={{ marginTop: 18 }}><PinDots len={entry.length} error={err} /></div>
            {err && <div role="alert" style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--clay)', marginTop: 8 }}>{L('Špatný PIN')}</div>}
            <PinPad onDigit={digit} onBack={back} disabled={busy} />
            {onReset && <button type="button" className="fa-textbtn fa-lock-forgot-link" onClick={() => setForgot(true)}>{L('Nepamatuješ si PIN?')}</button>}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// ── a sentence with pictures in it: "{share}" becomes the phone's share button ──
function faRich(text, parts) {
  return String(text).split(/(\{\w+\})/).map((piece, i) => {
    const m = piece.match(/^\{(\w+)\}$/);
    return m && parts[m[1]] ? <React.Fragment key={i}>{parts[m[1]]}</React.Fragment> : piece;
  });
}
// a button of the phone itself, drawn as it looks there; it gets a name for
// screen readers only when the sentence does not name it already
function FaKey({ icon, label }) {
  const glyph = <Icon name={icon} size={15} stroke={1.9} />;
  return label
    ? <span className="fa-key" role="img" aria-label={label}>{glyph}</span>
    : <span className="fa-key" aria-hidden="true">{glyph}</span>;
}
// a mouse or trackpad: the password field can take the focus at once without
// a phone keyboard covering the explanation
function faFinePointer() {
  try { return !!(window.matchMedia && matchMedia('(pointer: fine)').matches); } catch (e) { return false; }
}

// ── password fields ─────────────────────────────────────────────────────
function PasswordField({ id, label, value, onChange, autoComplete, shown, onToggleShown, invalid, describedBy, inputRef }) {
  return (
    <div className="fa-pw">
      <label className="fa-sheet-label" htmlFor={id}>{label}</label>
      <div className="fa-pw-box">
        <input id={id} ref={inputRef} className="fa-pw-input" type={shown ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)} autoComplete={autoComplete}
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          aria-invalid={invalid ? 'true' : undefined} aria-describedby={describedBy} />
        {onToggleShown && (
          <button type="button" className="fa-pw-eye" aria-controls={id} onClick={onToggleShown}>
            {shown ? L('Skrýt') : L('Ukázat')}
          </button>
        )}
      </div>
    </div>
  );
}
const faPasswordLength = pw => Array.from(String(pw)).length;

// ── Záloha s heslem: the backup, encrypted in this browser ─────────────
function PasswordBackupSheet({ open, onClose }) {
  const [pw, setPw] = useSt('');
  const [again, setAgain] = useSt('');
  const [shown, setShown] = useSt(false);
  const [busy, setBusy] = useSt(false);
  const [done, setDone] = useSt(false);
  const [err, setErr] = useSt(null);   // 'short' | 'match' | 'fail'
  const first = useStR(null);
  const second = useStR(null);
  useStE(() => {
    if (!open) return;
    setPw(''); setAgain(''); setShown(false); setBusy(false); setDone(false); setErr(null);
    if (!faFinePointer()) return;
    const t = setTimeout(() => first.current && first.current.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);
  const can = faCanEncrypt();
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (faPasswordLength(pw) < FA_BACKUP_MIN_PASSWORD) { setErr('short'); setDone(false); first.current && first.current.focus(); return; }
    if (pw !== again) { setErr('match'); setDone(false); second.current && second.current.focus(); return; }
    setErr(null); setBusy(true);
    try {
      const text = await faExportEncrypted(pw);
      if (!faDownload('vedome-utraceni-zaloha-s-heslem-' + faTodayIso() + '.json', text, 'application/json')) throw new Error('download');
      setPw(''); setAgain(''); setDone(true);
    } catch (x) { setErr('fail'); }
    setBusy(false);
  };
  const message = err === 'short' ? Lf('Heslo musí mít aspoň {n} znaků.', { n: FA_BACKUP_MIN_PASSWORD })
    : err === 'match' ? L('Hesla se neshodují.')
    : err === 'fail' ? L('Zálohu se nepodařilo vytvořit.') : '';
  return (
    <SettingsSheet open={open} title={L('Záloha s heslem')} onClose={onClose}>
      <form className="fa-pwform" onSubmit={submit} noValidate>
        <div className="fa-sheet-lead">
          <Medallion icon="key" accent="sage" size={38} />
          <p>{L('Zálohu zašifrujeme přímo v tomto prohlížeči. Bez hesla ji nikdo nepřečte, takže může i do e-mailu nebo na sdílený disk.')}</p>
        </div>
        {!can ? (
          <p className="fa-pw-msg is-err" role="alert">{L('Tento prohlížeč šifrovat neumí. Použij běžnou zálohu.')}</p>
        ) : (
          <React.Fragment>
            <PasswordField id="fa-backup-pw" label={L('Heslo')} value={pw} onChange={v => { setPw(v); setDone(false); }} inputRef={first}
              autoComplete="new-password" shown={shown} onToggleShown={() => setShown(s => !s)}
              invalid={err === 'short'} describedBy="fa-backup-help" />
            <PasswordField id="fa-backup-again" label={L('Heslo ještě jednou')} value={again} onChange={v => { setAgain(v); setDone(false); }} inputRef={second}
              autoComplete="new-password" shown={shown} invalid={err === 'match'} />
            <p id="fa-backup-help" className="fa-pw-help">{Lf('Aspoň {n} znaků. Dobře poslouží věta, kterou si zapamatuješ.', { n: FA_BACKUP_MIN_PASSWORD })}</p>
            <p className="fa-pw-warn"><Icon name="key" size={16} stroke={1.8} />
              <span>{L('Heslo si zapiš nebo ulož do správce hesel. Když ho zapomeneš, zálohu neotevře nikdo, ani my.')}</span></p>
            {message && <p className="fa-pw-msg is-err" role="alert">{message}</p>}
            {done && <p className="fa-pw-msg is-ok" role="status">{L('Záloha s heslem se stáhla. Obnovíš ji ve Více → Data → Obnovit ze zálohy.')}</p>}
            <button type="submit" className="fa-cta fa-cta-solid" disabled={busy}>{busy ? L('Šifruji…') : L('Stáhnout zálohu s heslem')}</button>
          </React.Fragment>
        )}
      </form>
    </SettingsSheet>
  );
}

// ── restoring a backup with a password ──────────────────────────────────
function PasswordRestoreSheet({ open, text, onClose }) {
  const [pw, setPw] = useSt('');
  const [shown, setShown] = useSt(false);
  const [state, setState] = useSt('idle');   // idle | working | done
  const [err, setErr] = useSt('');
  const field = useStR(null);
  useStE(() => {
    if (!open) return;
    setPw(''); setShown(false); setState('idle'); setErr('');
    if (!faFinePointer()) return;
    const t = setTimeout(() => field.current && field.current.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);
  const submit = async (e) => {
    e.preventDefault();
    if (state !== 'idle') return;
    if (!pw) { field.current && field.current.focus(); return; }
    setErr(''); setState('working');
    const res = await faImportEncrypted(text, pw);
    if (res.ok) { setState('done'); setTimeout(() => location.reload(), 700); return; }
    setState('idle');
    setErr(res.error === 'password' ? L('Heslo nesedí. Data zůstala beze změny.')
      : res.error === 'unsupported' ? L('Tento prohlížeč šifrování neumí. Zkus zálohu obnovit v jiném prohlížeči.')
      : res.error === 'shape' ? L('Záloha je poškozená nebo upravená. Data zůstala beze změny.')
      : L('Tenhle soubor nevypadá jako záloha Vědomého utrácení.'));
    if (res.error === 'password' && field.current) { field.current.focus(); field.current.select(); }
  };
  return (
    <SettingsSheet open={open} title={L('Obnovit ze zálohy')} onClose={onClose}>
      <form className="fa-pwform" onSubmit={submit} noValidate>
        <div className="fa-sheet-lead">
          <Medallion icon="key" accent="honey" size={38} />
          <p>{L('Tahle záloha je zašifrovaná. Zadej heslo, se kterým vznikla. Obnovení nahradí současná data obsahem zálohy.')}</p>
        </div>
        <PasswordField id="fa-restore-pw" label={L('Heslo k záloze')} value={pw} onChange={setPw} inputRef={field}
          autoComplete="current-password" shown={shown} onToggleShown={() => setShown(s => !s)} invalid={!!err} />
        {err && <p className="fa-pw-msg is-err" role="alert">{err}</p>}
        {state === 'done' && <p className="fa-pw-msg is-ok" role="status">{L('Data obnovena. Načítám…')}</p>}
        <button type="submit" className="fa-cta fa-cta-solid" disabled={state !== 'idle' || !pw}>{state === 'working' ? L('Otevírám zálohu…') : L('Obnovit data')}</button>
      </form>
    </SettingsSheet>
  );
}

// ── Jak chráníme tvoje data: where the numbers live, and where they never go ──
function DataSafetySheet({ open, onClose }) {
  const stops = [
    { icon: 'home', title: L('V tomto prohlížeči'), text: L('Plán, výdaje, cíle, reflexe a nastavení. Nic z toho se samo nikam neposílá.') },
    { icon: 'vault', title: L('V souborech, které si uložíš'), text: L('Záloha, záloha s heslem a tabulka výdajů. Vzniknou jen tehdy, když o ně požádáš, a zůstanou tam, kam je uložíš.') },
    { icon: null, title: L('Na našem serveru'), text: L('Nic. Server s daty ani účty nemáme. Hosting aplikaci jen doručí jako každý web; tvoje čísla k němu nedorazí.') },
  ];
  const facts = [
    [L('PIN'), L('Brání jen náhodnému nahlédnutí na tomto zařízení. Data pod ním šifrovaná nejsou a záloha PIN neobsahuje.')],
    [L('Běžná záloha'), L('Je to čitelný soubor. Ukládej ho jen tam, kam se cizí nedostanou; do e-mailu nebo na sdílený disk patří záloha s heslem.')],
    [L('Záloha s heslem'), L('Šifruje se přímo v prohlížeči (AES-256). Heslo nikde neukládáme, takže bez něj zálohu neotevře nikdo, ani my.')],
    [L('Jiné zařízení'), L('Data se mezi zařízeními samy nepřenášejí. Udělej zálohu a na druhém zařízení ji obnov.')],
    [L('Smazání'), L('Více → Data → Smazat všechna data vymaže vše v tomto prohlížeči. Data zmizí i se smazáním dat webů v nastavení prohlížeče, proto si dělej zálohy.')],
    [L('Workshop'), L('Pracuje s vymyšlenými příběhy uloženými zvlášť. Tvoje vlastní data nečte ani nemění.')],
  ];
  return (
    <SettingsSheet open={open} title={L('Jak chráníme tvoje data')} onClose={onClose}>
      <p className="fa-safe-lead">{L('Tvoje čísla zůstávají u tebe. Tady je, kudy vedou.')}</p>
      <ol className="fa-safe-path">
        {stops.map((s, i) => (
          <li key={i} className={'fa-safe-stop' + (s.icon ? '' : ' is-none') + (stops[i + 1] && !stops[i + 1].icon ? ' to-none' : '')}>
            <span className="fa-safe-node">{s.icon && <Icon name={s.icon} size={18} stroke={1.8} />}</span>
            <span className="fa-safe-body">
              <span className="fa-safe-title">{s.title}</span>
              <span className="fa-safe-text">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <h3 className="fa-safe-h">{L('Dobré vědět')}</h3>
      <dl className="fa-safe-facts">
        {facts.map(([term, text], i) => (
          <div key={i}><dt>{term}</dt><dd>{text}</dd></div>
        ))}
      </dl>
      <p className="fa-safe-foot">{L('Kód aplikace je otevřený (licence MIT), takže to může kdokoli ověřit.')}</p>
    </SettingsSheet>
  );
}

// ── Na plochu telefonu: how to add the app to the home screen ──────────
// A home-screen app on an iPhone keeps its own storage, apart from Safari
// (WebKit treats it as a separate app), so the guide says how to bring the data over.
function faStandalone() {
  try { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) { return false; }
}
function faDevicePlatform() {
  try {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
  } catch (e) {}
  return 'other';
}
function HomeScreenSheet({ open, onClose }) {
  const [os, setOs] = useSt(() => (faDevicePlatform() === 'android' ? 'android' : 'ios'));
  useStE(() => { if (open) setOs(faDevicePlatform() === 'android' ? 'android' : 'ios'); }, [open]);
  const installed = faStandalone();
  const keys = {
    share: <FaKey icon="share" />,
    more: <FaKey icon="dotsh" label={L('Další volby')} />,
    add: <FaKey icon="addsquare" />,
    menu: <FaKey icon="dotsv" label={L('Další volby')} />,
  };
  const steps = os === 'ios' ? [
    L('Otevři aplikaci v Safari.'),
    L('Klepni na {share} Sdílet. V iOS 26 je pod tlačítkem {more} vedle adresy.'),
    L('Vyber {add} Přidat na plochu, nech zapnuté otevírání jako webové aplikace a klepni na Přidat.'),
  ] : [
    L('Otevři aplikaci v Chromu.'),
    L('Klepni na {menu} vedle adresy.'),
    L('Vyber Nainstalovat aplikaci nebo Přidat na plochu a potvrď.'),
  ];
  const note = os === 'ios'
    ? L('Na iPhonu a iPadu má aplikace na ploše vlastní úložiště, oddělené od Safari. Než ji začneš používat, ulož si v Safari zálohu a v aplikaci na ploše ji obnov (Více → Data).')
    : L('Kdyby v aplikaci na ploše chyběla data, ulož si v prohlížeči zálohu a v aplikaci ji obnov (Více → Data).');
  return (
    <SettingsSheet open={open} title={L('Na plochu telefonu')} onClose={onClose}>
      <div className="fa-sheet-lead">
        <Medallion icon="phone" accent="moss" size={38} />
        <p>{installed ? L('Aplikaci už máš na ploše a právě běží odtud.') : L('Otevře se přes celou obrazovku jako běžná aplikace a funguje i bez připojení.')}</p>
      </div>
      <div className="fa-lang fa-os" role="group" aria-label={L('Telefon')}>
        <button type="button" data-on={os === 'ios'} aria-pressed={os === 'ios' ? 'true' : 'false'} onClick={() => setOs('ios')}>{L('iPhone a iPad')}</button>
        <button type="button" data-on={os === 'android'} aria-pressed={os === 'android' ? 'true' : 'false'} onClick={() => setOs('android')}>{L('Android')}</button>
      </div>
      <ol className="fa-steps">
        {steps.map((s, i) => <li key={os + i}><span className="fa-step-n" aria-hidden="true">{i + 1}</span><span>{faRich(s, keys)}</span></li>)}
      </ol>
      <p className="fa-pw-warn"><Icon name="vault" size={16} stroke={1.8} /><span>{note}</span></p>
    </SettingsSheet>
  );
}

Object.assign(window, {
  loadFaSecurity, saveFaSecurity, loadFaReminders, saveFaReminders,
  faHashPin, faDownload, faReminderIcs,
  SettingsSheet, SecuritySheet, RemindersSheet, IncomeSheet, LockScreen, PinPad, PinDots,
  PasswordBackupSheet, PasswordRestoreSheet, DataSafetySheet, HomeScreenSheet, faStandalone, faDevicePlatform, faRich,
});
