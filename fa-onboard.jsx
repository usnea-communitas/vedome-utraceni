// fa-onboard.jsx — first-run onboarding: welcome → name → income → ratios
// → first goal (optional) → theme. Calls onFinish(profile); persists nothing
// itself. Works in both themes (uses shared tokens). Full overlay above the app.

const { useState: useOb } = React;

const OB_PRESETS = [
  { name: 'Vyvážená 50/30/20', r: { nutne: 50, budouci: 20, radost: 30 } },
  { name: 'Úsporné', r: { nutne: 50, budouci: 30, radost: 20 } },
  { name: 'Volnější', r: { nutne: 45, budouci: 15, radost: 40 } },
];

const OB_GOALS = [
  { key: 'rezerva', name: 'Nouzová rezerva', icon: 'shield', accent: 'moss',  kind: 'rezerva', hint: '3–6 měsíčních výdajů' },
  { key: 'invest',  name: 'Investice',       icon: 'sprout', accent: 'honey', kind: 'invest',  hint: 'ETF, fondy, budoucnost' },
  { key: 'travel',  name: 'Dovolená',        icon: 'sun',    accent: 'blush', kind: 'travel',  hint: 'zážitek, na který se těšíš' },
  { key: 'custom',  name: 'Vlastní cíl',     icon: 'mountain', accent: 'sage', kind: 'custom', hint: 'cokoliv se jménem' },
];

function Onboarding({ onFinish, defaultRatios, initialTheme }) {
  const [step, setStep] = useOb(0);
  const [name, setName] = useOb('');
  const [income, setIncome] = useOb('');
  const [r, setR] = useOb({ ...(defaultRatios || { nutne: 50, budouci: 20, radost: 30 }) });
  const [goalKey, setGoalKey] = useOb(null);
  const [goalName, setGoalName] = useOb('');
  const [goalTarget, setGoalTarget] = useOb('');
  const [theme, setTheme] = useOb('lesní'); // onboarding vždy startuje na Lesním klidu

  const inc = faAmount(income);
  const sum = r.nutne + r.budouci + r.radost;
  const setPart = (k, v) => setR(o => ({ ...o, [k]: v }));

  const pickGoal = (g) => {
    setGoalKey(g.key);
    setGoalName(g.key === 'custom' ? '' : L(g.name));
    // emergency reserve: suggest three months of essentials, rounded to thousands
    if (g.key === 'rezerva' && !goalTarget && inc > 0) {
      setGoalTarget(String(Math.max(1000, Math.round(inc * r.nutne / 100 * 3 / 1000) * 1000)));
    }
  };
  const buildGoal = () => {
    if (!goalKey) return null;
    const g = OB_GOALS.find(x => x.key === goalKey);
    const target = faAmount(goalTarget);
    const nm = goalName.trim();
    if (!nm || target <= 0) return null;
    return { id: Date.now(), name: nm, target, saved: 0, icon: g.icon, accent: g.accent, kind: g.kind };
  };

  const finish = (skipGoal) => onFinish({
    name: name.trim() || null,
    income: inc,
    ratios: r,
    goal: skipGoal ? null : buildGoal(),
    theme,
  });

  const steps = [
    // ── 0 · welcome ──
    {
      valid: true, cta: L('Začít'),
      body: (
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 74, height: 74, margin: '0 auto 18px', borderRadius: '38%', background: 'var(--moss-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--moss)' }}>
            <Icon name="sprout" size={40} stroke={1.5} />
          </div>
          <h2 className="fa-onb-h">{L('Vítej ve vědomém utrácení')}</h2>
          <p className="fa-onb-p">{L('Žádné odříkání — jen jasný plán: co je potřeba, co tě těší a co posíláš svému budoucímu já.')}</p>
        </div>
      ),
    },
    // ── 1 · name ──
    {
      valid: true, cta: L('Pokračovat'),
      body: (
        <div>
          <h2 className="fa-onb-h">{L('Jak ti máme říkat?')}</h2>
          <p className="fa-onb-p">{L('Jen pro pozdravy uvnitř appky. Klidně přeskoč.')}</p>
          <input className="fa-onb-input" type="text" value={name} maxLength={24}
            placeholder={L('např. Anička')} onChange={e => setName(e.target.value)} />
        </div>
      ),
    },
    // ── 2 · income ──
    {
      valid: inc > 0, cta: L('Pokračovat'),
      body: (
        <div>
          <h2 className="fa-onb-h">{L('Tvůj měsíční příjem')}</h2>
          <p className="fa-onb-p">{L('Výplata a pravidelné přivýdělky dohromady. Později jde upravit v Plánu.')}</p>
          <div className="fa-onb-money">
            <input className="fa-onb-input" type="text" inputMode="decimal" value={income}
              placeholder="0" onChange={e => setIncome(e.target.value)} style={{ textAlign: 'right' }} />
            <span>Kč</span>
          </div>
        </div>
      ),
    },
    // ── 3 · ratios ──
    {
      valid: sum === 100 && inc > 0, cta: L('Pokračovat'),
      body: (
        <div>
          <h2 className="fa-onb-h">{L('Rozděl si příjem')}</h2>
          <p className="fa-onb-p">{L('Osvědčený základ je 50 / 30 / 20 — uprav si ho podle sebe.')}</p>
          <div style={{ display: 'flex', gap: 7, margin: '4px 0 16px', flexWrap: 'wrap' }}>
            {OB_PRESETS.map(p => {
              const on = p.r.nutne === r.nutne && p.r.budouci === r.budouci && p.r.radost === r.radost;
              return <button key={p.name} className="fa-onb-chip" data-on={on} onClick={() => setR({ ...p.r })}>{L(p.name)}</button>;
            })}
          </div>
          {APP.categories.map(c => (
            <div key={c.key} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: accentVar(c.accent) }}></span>{L(c.name)}
                </span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)' }}>{r[c.key]} % · {kc(Math.round(inc * r[c.key] / 100))}</span>
              </div>
              <input type="range" className="fa-range" min={0} max={100} step={5} value={r[c.key]}
                style={{ ['--accent']: accentVar(c.accent) }}
                onChange={e => setPart(c.key, +e.target.value)} />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, fontFamily: 'var(--sans)', fontSize: 12.5, color: sum === 100 ? 'var(--moss-deep)' : 'var(--clay)' }}>
            <Icon name={sum === 100 ? 'check' : 'alert'} size={14} stroke={2} />
            {sum === 100 ? L('Krásně vyvážené — dohromady 100 %.') : Lf('Dohromady {v} % — uprav na 100 %.', { v: sum })}
          </div>
        </div>
      ),
    },
    // ── 4 · first goal (optional) ──
    {
      valid: buildGoal() != null, cta: L('Pokračovat'),
      skip: true,
      body: (
        <div>
          <h2 className="fa-onb-h">{L('Tvůj první cíl')}</h2>
          <p className="fa-onb-p">{L('Pojmenovaný cíl se plní snáz. Vyber, na co šetříš — nebo přeskoč a přidej později.')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {OB_GOALS.map(g => (
              <button key={g.key} className="fa-onb-goal" data-on={goalKey === g.key} onClick={() => pickGoal(g)}>
                <span className="fa-onb-goal-ico" style={{ background: accentSoft(g.accent), color: accentVar(g.accent) }}>
                  <Icon name={g.icon} size={19} stroke={1.7} />
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{L(g.name)}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-soft)' }}>{L(g.hint)}</span>
                </span>
                {goalKey === g.key && <Icon name="check" size={16} stroke={2.2} color={accentVar(g.accent)} />}
              </button>
            ))}
          </div>
          {goalKey && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {goalKey === 'custom' && (
                <input className="fa-onb-input" type="text" value={goalName} maxLength={28}
                  placeholder={L('Název cíle')} onChange={e => setGoalName(e.target.value)} />
              )}
              <div className="fa-onb-money">
                <input className="fa-onb-input" type="text" inputMode="decimal" value={goalTarget}
                  placeholder={L('Cílová částka')} onChange={e => setGoalTarget(e.target.value)} style={{ textAlign: 'right' }} />
                <span>Kč</span>
              </div>
            </div>
          )}
        </div>
      ),
    },
    // ── 5 · theme ──
    {
      valid: true, cta: L('Dokončit'),
      body: (
        <div>
          <h2 className="fa-onb-h">{L('Vyber si vzhled')}</h2>
          <p className="fa-onb-p">{L('Kdykoliv jde změnit ve Více → Vzhled.')}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="fa-onb-theme" data-on={theme === 'lesní'} onClick={() => setTheme('lesní')}>
              <span className="fa-onb-theme-art" style={{ background: 'linear-gradient(160deg, #EFE9D8 0%, #DCE1C4 55%, #AFC392 100%)', color: '#3D5235' }}>
                <Icon name="sprout" size={26} stroke={1.6} />
              </span>
              <span>{L('Lesní klid')}</span>
            </button>
            <button className="fa-onb-theme" data-on={theme === 'kouzelnický'} onClick={() => setTheme('kouzelnický')}>
              <span className="fa-onb-theme-art" style={{ background: 'linear-gradient(165deg, #2A2C4A 0%, #1B1C33 60%, #12121F 100%)', color: '#D9B45C' }}>
                <Icon name="castle" size={26} stroke={1.6} />
              </span>
              <span>{L('Kouzelnický')}</span>
            </button>
          </div>
        </div>
      ),
    },
  ];

  const s = steps[step];
  const last = step === steps.length - 1;
  const advance = () => last ? finish(false) : setStep(step + 1);

  return (
    <div className="fa-onb">
      <div className="fa-onb-card">
        {step > 0 && (
          <button className="fa-onb-back" onClick={() => setStep(step - 1)} aria-label={L('Zpět')}>
            <Icon name="chevron" size={16} stroke={2} style={{ transform: 'rotate(180deg)' }} />
          </button>
        )}
        <div className="fa-onb-dots">
          {steps.map((_, i) => <span key={i} data-on={i === step}></span>)}
        </div>
        {s.body}
        <button className="fa-cta fa-cta-solid" style={{ marginTop: 20, opacity: s.valid ? 1 : 0.45, pointerEvents: s.valid ? 'auto' : 'none' }}
          onClick={advance}>
          {s.cta} <Icon name="chevron" size={16} stroke={2} />
        </button>
        {s.skip && (
          <button className="fa-textbtn" style={{ marginTop: 12, alignSelf: 'center' }} onClick={() => setStep(step + 1)}>
            {L('Přeskočit — přidám později')}
          </button>
        )}
      </div>
    </div>
  );
}

// profile persistence
function loadFaProfile() { try { return JSON.parse(localStorage.getItem('fa.profile')); } catch (e) { return null; } }
function saveFaProfile(p) { try { localStorage.setItem('fa.profile', JSON.stringify(p)); } catch (e) {} }
function clearFaProfile() { try { localStorage.removeItem('fa.profile'); } catch (e) {} }

Object.assign(window, { Onboarding, loadFaProfile, saveFaProfile, clearFaProfile, OB_GOALS });
