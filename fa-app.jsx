// fa-app.jsx — app shell: bottom nav, animated screen transitions,
// Tweaks panel, and mount.

const { useState: useA, useEffect: useAE, useRef: useAR } = React;

const NAV = [
  { key: 'prehled', label: 'Přehled', icon: 'home' },
  { key: 'plan',    label: 'Plán',    icon: 'plan' },
  { key: 'cile',    label: 'Cíle',    icon: 'mountain' },
  { key: 'tipy',    label: 'Tipy',    icon: 'bulb' },
  { key: 'reflexe', label: 'Reflexe', icon: 'book' },
  { key: 'vice',    label: 'Více',    icon: 'more' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "lesní",
  "scene": "video",
  "motion": "gentle",
  "depth": "cream",
  "card": "layered",
  "accent": "classic"
}/*EDITMODE-END*/;

const FOREST_VIDEO = 'assets/forest-ambient.mp4';

// Desktop preview: the phone frame (402 × 874) is scaled down to fit the window,
// keeping the page's 28 px padding around it, so the whole app stays reachable
// on laptop screens (1366 × 768, 1280 × 720).
const FRAME_W = 402, FRAME_H = 874;

// "Reduce motion" and Save-Data both turn the ambient background into a still
// scene: no 0.6 MB video, no floating animation. Both are read live.
function faMotionPrefs() {
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  return { reduce, saveData };
}
function faFrameScale() {
  const s = Math.min(1, (window.innerHeight - 56) / FRAME_H, (window.innerWidth - 56) / FRAME_W);
  return Math.max(0.5, Math.floor(s * 1000) / 1000);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useA('prehled');
  // English by default; a chosen language is kept in localStorage ('fa.lang') and restored on load
  const [lang, setLang] = useA(loadFaLang);
  const [entered, setEntered] = useA(false);
  const scrollRef = useAR(null);

  // On a real phone (or installed to home screen) drop the device bezel and
  // fill the viewport natively — avoids a double status bar and a clipped nav.
  const [bare, setBare] = useA(false);
  const [frameScale, setFrameScale] = useA(faFrameScale);
  const [profile, setProfile] = useA(() => { faMigrateYearGoals(); return loadFaProfile(); });
  const [locked, setLocked] = useA(() => !!(loadFaProfile() && loadFaSecurity()));
  const [theme, setTheme] = useA(() => { try { return localStorage.getItem('fa.theme') || TWEAK_DEFAULTS.theme; } catch (e) { return TWEAK_DEFAULTS.theme; } });
  const [ratios, setRatios] = useA(() => { try { return JSON.parse(localStorage.getItem('fa.ratios')) || { nutne: 50, budouci: 20, radost: 30 }; } catch (e) { return { nutne: 50, budouci: 20, radost: 30 }; } });
  // always open on the current month; the picker lets you look back or ahead
  const [month, setMonth] = useA(faCurrentMonth);
  const [expenses, setExpenses] = useA(loadFaExpenses);
  const [addOpen, setAddOpen] = useA(false);
  useAE(() => { saveFaExpenses(expenses); }, [expenses]);
  const addExpense = (e) => { setExpenses(list => [...list, e]); setToast(e); };
  const deleteExpense = (ts) => setExpenses(list => list.filter(e => e.ts !== ts));
  const [toast, setToast] = useA(null);
  const [prefs, setPrefs] = useA(faMotionPrefs);
  useAE(() => {
    const update = () => setPrefs(faMotionPrefs());
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const conn = navigator.connection;
    if (mq && mq.addEventListener) mq.addEventListener('change', update);
    if (conn && conn.addEventListener) conn.addEventListener('change', update);
    return () => {
      if (mq && mq.removeEventListener) mq.removeEventListener('change', update);
      if (conn && conn.removeEventListener) conn.removeEventListener('change', update);
    };
  }, []);
  useAE(() => { try { localStorage.setItem('fa.theme', theme); } catch (e) {} }, [theme]);
  useAE(() => {
    saveFaLang(lang);
    try { document.documentElement.lang = lang; } catch (e) {}
  }, [lang]);
  useAE(() => { try { localStorage.setItem('fa.ratios', JSON.stringify(ratios)); } catch (e) {} }, [ratios]);
  useAE(() => {
    const check = () => {
      const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = window.navigator.standalone === true;
      const touchPhone = window.matchMedia && window.matchMedia('(max-width: 620px) and (pointer: coarse)').matches;
      setBare(standalone || iosStandalone || touchPhone);
      setFrameScale(faFrameScale());
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // entrance: resting DOM is visible; we briefly start hidden then release.
  // setTimeout (not rAF) so it fires even if the iframe is backgrounded.
  useAE(() => {
    setEntered(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    const id = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(id);
  }, [screen]);

  const go = (key) => { if (key !== screen) setScreen(key); };

  // ── onboarding / data-mode handlers ──
  const finishOnboarding = (p) => {
    faSeedFreshUser(p);
    if (p.theme) setTheme(p.theme);
    setRatios(p.ratios);
    setExpenses([]);
    setProfile(loadFaProfile());
    setScreen('prehled');
  };
  const resetAll = () => {
    faResetAll();
    setExpenses([]);
    setRatios({ nutne: 50, budouci: 20, radost: 30 });
    setProfile(null);
    setScreen('prehled');
  };
  const loadDemo = () => {
    faLoadDemo();
    setExpenses([]);
    setProfile(loadFaProfile());
  };

  const isWizard = theme === 'kouzelnický';
  const still = prefs.reduce || prefs.saveData;
  const motion = still ? 'off' : t.motion;
  // the forest video loads only after onboarding and never in the still scene;
  // the scene attribute follows what is shown (the video scene lightens the titles)
  const scene = t.scene === 'video' && profile && !still ? 'video' : 'les';
  // apply editable 50/30/20 ratios onto the shared data model before render
  APP.categories.forEach(c => { if (ratios[c.key] != null) { c.targetPct = ratios[c.key]; c.target = Math.round(APP.income * ratios[c.key] / 100); } });
  // real-data mode: rewrite APP from the user's stores (no-op for demo profile)
  faHydrate(ratios);
  // then layer user-added one-off expenses on top (recomputes derived stats)
  // only the selected month's one-off expenses count towards its numbers
  const monthExpenses = expenses.filter(e => faExpenseMonth(e) === month);
  applyFaExpenses(monthExpenses);
  faDerive();
  setFaTheme(isWizard ? 'wizard' : 'forest');
  setFaLang(lang);

  // apply theme tweaks to the root
  const rootAttrs = {
    'data-theme': isWizard ? 'wizard' : 'forest',
    'data-scene': isWizard ? 'video' : scene,
    'data-depth': t.depth, 'data-card': t.card, 'data-accent': t.accent,
  };

  const Screen = { prehled: Prehled, plan: Plan, cile: Cile, tipy: Tipy, reflexe: Reflexe, vice: Vice }[screen];

  const inner = (
    <div style={{ position: 'absolute', inset: 0 }}>
      {isWizard
        ? <WizardBackground motion={motion} />
        : <ForestBackground motion={motion} videoSrc={scene === 'video' ? FOREST_VIDEO : null} />}
      {!profile ? (
        <Onboarding onFinish={finishOnboarding} defaultRatios={ratios} initialTheme={theme} lang={lang} setLang={setLang} />
      ) : (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 1 }}
        {...(locked ? { inert: '', 'aria-hidden': 'true' } : {})}>
        {/* scrollable content */}
        <main ref={scrollRef} className="fa-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="fa-content">
            <div key={screen + '|' + month} className={'fa-stage' + (entered ? ' is-in' : '')}>
              <Screen go={go} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} ratios={ratios} setRatios={setRatios} month={month} setMonth={setMonth} expenses={monthExpenses} deleteExpense={deleteExpense} profile={profile} setProfile={setProfile} resetAll={resetAll} />
            </div>
          </div>
          {/* sync APP.month so static reads stay in step */}
          {(() => { APP.month = month; return null; })()}
        </main>
        {/* add expense: floating + button & sheet */}
        <AddFab onClick={() => setAddOpen(true)} />
        <AddSheet open={addOpen} onClose={() => setAddOpen(false)} onSave={addExpense} expenses={expenses} month={month} />
        <FaToast toast={toast} onUndo={deleteExpense} onHide={() => setToast(null)} />
        {/* bottom nav */}
        <BottomNav active={screen} go={go} lang={lang} />
      </div>
      )}
      {profile && locked && (
        <LockScreen security={loadFaSecurity()} userName={profile.name} onUnlock={() => setLocked(false)}
          onReset={() => { resetAll(); setLocked(false); }} />
      )}
    </div>
  );

  return (
    <div className="fa-root" data-bare={bare ? 'true' : 'false'} {...rootAttrs}>
      {bare
        ? <div className="fa-bare">{inner}</div>
        : (
          <div style={{ width: FRAME_W * frameScale, height: FRAME_H * frameScale }}>
            <div style={{ width: FRAME_W, transform: frameScale < 1 ? `scale(${frameScale})` : undefined, transformOrigin: '0 0' }}>
              <IOSDevice dark={isWizard}>{inner}</IOSDevice>
            </div>
          </div>
        )}

      <TweaksPanel>
        <TweakSection label={L('Téma')} />
        <TweakRadio label={L('Styl')} value={theme} options={['lesní', 'kouzelnický']} onChange={v => { setTheme(v); setTweak('theme', v); }} />
        <TweakSection label={L('Pozadí')} />
        {!isWizard && <TweakRadio label={L('Scéna')} value={t.scene} options={['video', 'les']} onChange={v => setTweak('scene', v)} />}
        <TweakRadio label={L('Pohyb')} value={t.motion} options={['off', 'barely', 'gentle', 'living']} onChange={v => setTweak('motion', v)} />
        <TweakSection label={L('Atmosféra')} />
        <TweakRadio label={L('Karty')} value={t.card} options={['soft', 'layered']} onChange={v => setTweak('card', v)} />
        {!isWizard && <TweakRadio label={L('Hloubka')} value={t.depth} options={['cream', 'moss']} onChange={v => setTweak('depth', v)} />}
        {!isWizard && <TweakRadio label={L('Akcent')} value={t.accent} options={['classic', 'blossom', 'amber']} onChange={v => setTweak('accent', v)} />}
        <TweakSection label={L('Data (náhled)')} />
        <TweakButton label={L('Načíst ukázková data')} onClick={loadDemo} />
        <TweakButton label={L('Smazat data → onboarding')} onClick={resetAll} />
      </TweaksPanel>
    </div>
  );
}

function BottomNav({ active, go }) {
  return (
    <nav className="fa-nav" aria-label={L('Hlavní navigace')}>
      <div className="fa-nav-inner">
        {NAV.map(n => {
          const on = active === n.key;
          return (
            <button key={n.key} className="fa-tab" data-on={on} aria-current={on ? 'page' : undefined} onClick={() => go(n.key)}>
              <span className="fa-tab-ico"><Icon name={n.icon} size={22} stroke={on ? 1.9 : 1.6} /></span>
              <span className="fa-tab-label">{L(n.label)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// If rendering ever fails (for example on damaged data), show a calm page that
// can still save the raw data to a file and start over, instead of a blank screen.
class FaErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null, armed: false, msg: '' }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { try { console.error('Vědomé utrácení could not render', error, info && info.componentStack); } catch (e) {} }
  render() {
    if (!this.state.error) return this.props.children;
    const save = () => {
      const ok = faDownload('vedome-utraceni-zaloha-' + faTodayIso() + '.json', faExportData(), 'application/json');
      this.setState({ msg: ok ? L('Záloha se stáhla. Ulož si ji na bezpečné místo.') : L('Zálohu se nepodařilo vytvořit.') });
    };
    const reset = () => {
      if (!this.state.armed) { this.setState({ armed: true }); return; }
      faResetAll();
      location.reload();
    };
    return (
      <div className="fa-crash" role="alert">
        <div className="fa-crash-card">
          <h1>{L('Něco se pokazilo')}</h1>
          <p>{L('Aplikace se nedokázala zobrazit, nejspíš kvůli poškozeným datům. Data jsou pořád v tomto prohlížeči. Nejdřív si je ulož do souboru, pak můžeš začít znovu.')}</p>
          <button className="fa-cta fa-cta-solid" onClick={save}>{L('Zálohovat data do souboru')}</button>
          <button className="fa-crash-reset" onClick={reset}>{this.state.armed ? L('Opravdu smazat? Nejde vrátit') : L('Smazat data a začít znovu')}</button>
          <button className="fa-textbtn" onClick={() => location.reload()}>{L('Zkusit znovu')}</button>
          {this.state.msg && <p role="status">{this.state.msg}</p>}
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<FaErrorBoundary><App /></FaErrorBoundary>);
