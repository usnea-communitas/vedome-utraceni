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
  "theme": "kouzelnický",
  "scene": "video",
  "motion": "gentle",
  "depth": "cream",
  "card": "layered",
  "accent": "classic"
}/*EDITMODE-END*/;

const FOREST_VIDEO = 'assets/forest-ambient.mp4';
const WIZARD_VIDEO = 'assets/castle-ambient.mp4';

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useA('prehled');
  const [lang, setLang] = useA('cs');
  const [entered, setEntered] = useA(false);
  const scrollRef = useAR(null);

  // On a real phone (or installed to home screen) drop the device bezel and
  // fill the viewport natively — avoids a double status bar and a clipped nav.
  const [bare, setBare] = useA(false);
  const [profile, setProfile] = useA(loadFaProfile);
  const [theme, setTheme] = useA(() => { try { return localStorage.getItem('fa.theme') || TWEAK_DEFAULTS.theme; } catch (e) { return TWEAK_DEFAULTS.theme; } });
  const [ratios, setRatios] = useA(() => { try { return JSON.parse(localStorage.getItem('fa.ratios')) || { nutne: 50, budouci: 20, radost: 30 }; } catch (e) { return { nutne: 50, budouci: 20, radost: 30 }; } });
  const [month, setMonth] = useA(() => { try { return localStorage.getItem('fa.month') || APP.month; } catch (e) { return APP.month; } });
  const [expenses, setExpenses] = useA(loadFaExpenses);
  const [addOpen, setAddOpen] = useA(false);
  useAE(() => { saveFaExpenses(expenses); }, [expenses]);
  const addExpense = (e) => { setExpenses(list => [...list, e]); setToast(e); };
  const deleteExpense = (ts) => setExpenses(list => list.filter(e => e.ts !== ts));
  const [toast, setToast] = useA(null);
  useAE(() => { try { localStorage.setItem('fa.month', month); } catch (e) {} }, [month]);
  useAE(() => { try { localStorage.setItem('fa.theme', theme); } catch (e) {} }, [theme]);
  useAE(() => { try { localStorage.setItem('fa.ratios', JSON.stringify(ratios)); } catch (e) {} }, [ratios]);
  useAE(() => {
    const check = () => {
      const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = window.navigator.standalone === true;
      const touchPhone = window.matchMedia && window.matchMedia('(max-width: 620px) and (pointer: coarse)').matches;
      setBare(standalone || iosStandalone || touchPhone);
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
  // apply editable 50/30/20 ratios onto the shared data model before render
  APP.categories.forEach(c => { if (ratios[c.key] != null) { c.targetPct = ratios[c.key]; c.target = Math.round(APP.income * ratios[c.key] / 100); } });
  // real-data mode: rewrite APP from the user's stores (no-op for demo profile)
  faHydrate(ratios);
  // then layer user-added one-off expenses on top (recomputes derived stats)
  applyFaExpenses(expenses);
  faDerive();
  setFaTheme(isWizard ? 'wizard' : 'forest');
  setFaLang(lang);

  // apply theme tweaks to the root
  const rootAttrs = {
    'data-theme': isWizard ? 'wizard' : 'forest',
    'data-scene': isWizard ? 'video' : t.scene,
    'data-depth': t.depth, 'data-card': t.card, 'data-accent': t.accent,
  };

  const Screen = { prehled: Prehled, plan: Plan, cile: Cile, tipy: Tipy, reflexe: Reflexe, vice: Vice }[screen];

  const inner = (
    <div style={{ position: 'absolute', inset: 0 }}>
      {isWizard
        ? <WizardBackground motion={t.motion} videoSrc={WIZARD_VIDEO} />
        : <ForestBackground motion={t.motion} videoSrc={t.scene === 'video' ? FOREST_VIDEO : null} />}
      {!profile ? (
        <Onboarding onFinish={finishOnboarding} defaultRatios={ratios} initialTheme={theme} />
      ) : (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        {/* scrollable content */}
        <div ref={scrollRef} className="fa-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="fa-content">
            <div key={screen} className={'fa-stage' + (entered ? ' is-in' : '')}>
              <Screen go={go} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} ratios={ratios} setRatios={setRatios} month={month} setMonth={setMonth} expenses={expenses} deleteExpense={deleteExpense} profile={profile} resetAll={resetAll} />
            </div>
          </div>
          {/* sync APP.month so static reads stay in step */}
          {(() => { APP.month = month; return null; })()}
        </div>
        {/* add expense: floating + button & sheet */}
        <AddFab onClick={() => setAddOpen(true)} />
        <AddSheet open={addOpen} onClose={() => setAddOpen(false)} onSave={addExpense} expenses={expenses} />
        <FaToast toast={toast} onUndo={deleteExpense} onHide={() => setToast(null)} />
        {/* bottom nav */}
        <BottomNav active={screen} go={go} lang={lang} />
      </div>
      )}
    </div>
  );

  return (
    <div className="fa-root" data-bare={bare ? 'true' : 'false'} {...rootAttrs}>
      {bare
        ? <div className="fa-bare">{inner}</div>
        : <IOSDevice dark={isWizard}>{inner}</IOSDevice>}

      <TweaksPanel>
        <TweakSection label="Téma" />
        <TweakRadio label="Styl" value={theme} options={['lesní', 'kouzelnický']} onChange={v => { setTheme(v); setTweak('theme', v); }} />
        <TweakSection label="Pozadí" />
        {!isWizard && <TweakRadio label="Scéna" value={t.scene} options={['video', 'les']} onChange={v => setTweak('scene', v)} />}
        <TweakRadio label="Pohyb" value={t.motion} options={['off', 'barely', 'gentle', 'living']} onChange={v => setTweak('motion', v)} />
        <TweakSection label="Atmosféra" />
        <TweakRadio label="Karty" value={t.card} options={['soft', 'layered']} onChange={v => setTweak('card', v)} />
        {!isWizard && <TweakRadio label="Hloubka" value={t.depth} options={['cream', 'moss']} onChange={v => setTweak('depth', v)} />}
        {!isWizard && <TweakRadio label="Akcent" value={t.accent} options={['classic', 'blossom', 'amber']} onChange={v => setTweak('accent', v)} />}
        <TweakSection label="Data (náhled)" />
        <TweakButton label="Načíst ukázková data" onClick={loadDemo} />
        <TweakButton label="Smazat data → onboarding" onClick={resetAll} />
      </TweaksPanel>
    </div>
  );
}

function BottomNav({ active, go }) {
  return (
    <div className="fa-nav">
      <div className="fa-nav-inner">
        {NAV.map(n => {
          const on = active === n.key;
          return (
            <button key={n.key} className="fa-tab" data-on={on} onClick={() => go(n.key)}>
              <span className="fa-tab-ico"><Icon name={n.icon} size={22} stroke={on ? 1.9 : 1.6} /></span>
              <span className="fa-tab-label">{L(n.label)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
