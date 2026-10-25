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
    const v = JSON.parse(localStorage.getItem('fa.security'));
    // only PIN locks exist now; older simulated modes (face) are ignored
    return v && v.mode === 'pin' && (v.hash || v.pin) ? v : null;
  } catch (e) { return null; }
}
function saveFaSecurity(v) { try { v ? localStorage.setItem('fa.security', JSON.stringify(v)) : localStorage.removeItem('fa.security'); } catch (e) {} }
function loadFaReminders() { try { return JSON.parse(localStorage.getItem('fa.reminders')) || { on: false, freq: 'denně', time: '20:00' }; } catch (e) { return { on: false, freq: 'denně', time: '20:00' }; } }
function saveFaReminders(v) { try { localStorage.setItem('fa.reminders', JSON.stringify(v)); } catch (e) {} }

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
          <PinPad onDigit={digit} onBack={() => setEntry(entry.slice(0, -1))} />
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

// ── Měsíční příjem sheet — edits fa.plan.income (same data as Plán) ─────
function IncomeSheet({ open, onClose, onChanged, demo }) {
  const [list, setList] = useSt([]);
  useStE(() => {
    if (!open) return;
    const stored = faLoad('fa.plan.income', []);
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
      faSave('fa.plan.income', clean);
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
            <PinPad onDigit={digit} onBack={() => setEntry(entry.slice(0, -1))} disabled={busy} />
            {onReset && <button type="button" className="fa-textbtn fa-lock-forgot-link" onClick={() => setForgot(true)}>{L('Nepamatuješ si PIN?')}</button>}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  loadFaSecurity, saveFaSecurity, loadFaReminders, saveFaReminders,
  faHashPin, faDownload, faReminderIcs,
  SettingsSheet, SecuritySheet, RemindersSheet, IncomeSheet, LockScreen, PinPad, PinDots,
});
