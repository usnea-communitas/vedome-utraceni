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
// in a workshop (?workshop=1) its tasks lead the navigation, in place of Tips
const NAV_WORKSHOP = [{ key: 'workshop', label: 'Workshop', icon: 'tasks' }].concat(NAV.filter(n => n.key !== 'tipy'));

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
// a real phone, or the app installed to the home screen: no device frame
function faIsBare() {
  const mq = q => !!(window.matchMedia && window.matchMedia(q).matches);
  return mq('(display-mode: standalone)') || window.navigator.standalone === true || mq('(max-width: 620px) and (pointer: coarse)');
}
function faFrameScale() {
  const s = Math.min(1, (window.innerHeight - 56) / FRAME_H, (window.innerWidth - 56) / FRAME_W);
  return Math.max(0.5, Math.floor(s * 1000) / 1000);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // a workshop opens on its tasks; the demo, on the Overview of its story
  const [screen, setScreen] = useA(FA_IN_WORKSHOP && !FA_DEMO ? 'workshop' : 'prehled');
  // English by default; a chosen language is kept in localStorage ('fa.lang') and restored on load
  const [lang, setLang] = useA(loadFaLang);
  const [entered, setEntered] = useA(false);
  const scrollRef = useAR(null);

  // On a real phone (or installed to home screen) drop the device bezel and
  // fill the viewport natively — avoids a double status bar and a clipped nav.
  // decided before the first render, so a phone never draws the frame first
  // and then the app again without it (that moved the page and the largest paint)
  const [bare, setBare] = useA(faIsBare);
  const [frameScale, setFrameScale] = useA(faFrameScale);
  const [profile, setProfile] = useA(() => {
    faMigrateYearGoals(); faMigratePlan();
    // the demo starts its story at once (only into the workshop's own data)
    if (FA_DEMO && !loadFaProfile()) faStartWorkshop(FA_WORKSHOP_STORIES[0].id);
    return loadFaProfile();
  });
  const [locked, setLocked] = useA(() => !!(loadFaProfile() && loadFaSecurity()));
  const [theme, setTheme] = useA(() => { try { return faStorage.get('fa.theme') || TWEAK_DEFAULTS.theme; } catch (e) { return TWEAK_DEFAULTS.theme; } });
  const [ratios, setRatios] = useA(() => { try { return JSON.parse(faStorage.get('fa.ratios')) || { nutne: 50, budouci: 20, radost: 30 }; } catch (e) { return { nutne: 50, budouci: 20, radost: 30 }; } });
  // always open on the current month; the picker lets you look back or ahead
  const [month, setMonth] = useA(faCurrentMonth);
  const [expenses, setExpenses] = useA(loadFaExpenses);
  const [addOpen, setAddOpen] = useA(false);
  // an expense the add sheet offers filled in (a workshop task), else null
  const [addPreset, setAddPreset] = useA(null);
  const openAdd = (preset) => { setAddPreset(preset || null); setAddOpen(true); };
  useAE(() => { saveFaExpenses(expenses); }, [expenses]);
  const addExpense = (e) => { setExpenses(list => [...list, e]); setToast({ kind: 'added', expense: e }); };
  // deleting offers Undo, which puts the exact expense back in its place
  const deleteExpense = (ts, fromKeyboard) => {
    const { list, undo } = faRemoveExpense(expenses, ts);
    if (!undo) return;
    setExpenses(list);
    setToast({ ...undo, focus: !!fromKeyboard });
  };
  const [toast, setToast] = useA(null);
  // the plan in one tap (Overview and Plan offer it while the month's plan is
  // empty); a change in version re-reads the stored plan
  const [planVersion, setPlanVersion] = useA(0);
  const applyDefaultPlan = (fromKeyboard) => {
    const before = faApplyDefaultPlan(month, ratios);
    setPlanVersion(v => v + 1);
    setToast({ kind: 'plan', month, ratios: { ...ratios }, before, at: Date.now(), focus: !!fromKeyboard });
  };
  const undoToast = (t) => {
    if (t.kind === 'plan') { faRestorePlans(t.before); setPlanVersion(v => v + 1); return; }
    setExpenses(list => faUndoExpense(list, t));
  };
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
  // Another tab or window of the app changed the data: show it here too, so a
  // change made here never writes over it (this tab keeps its expenses in memory).
  useAE(() => {
    const onStorage = (ev) => {
      if (ev.storageArea && ev.storageArea !== window.localStorage) return;
      if (ev.key != null && !ev.key.startsWith('fa.')) return;
      setExpenses(loadFaExpenses());
      setProfile(loadFaProfile());
      try { const r = JSON.parse(faStorage.get('fa.ratios')); if (r) setRatios(r); } catch (e) {}
      setPlanVersion(v => v + 1);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  // once there is something to lose, ask the browser to keep it (silently, where it does not prompt)
  useAE(() => { if (profile && !profile.demo) faKeepQuietly(); }, [profile, expenses.length > 0]);
  // the browser refused to store a change: say so instead of losing it silently
  const [storageErr, setStorageErr] = useA(false);
  useAE(() => {
    const onErr = () => setStorageErr(true);
    window.addEventListener('fa-storage-error', onErr);
    return () => window.removeEventListener('fa-storage-error', onErr);
  }, []);
  useAE(() => { try { faStorage.set('fa.theme', theme); } catch (e) {} }, [theme]);
  useAE(() => {
    saveFaLang(lang);
    try { document.documentElement.lang = lang; } catch (e) {}
  }, [lang]);
  // a split is stored once it is chosen or changed; opening the app (even locked by the
  // PIN) writes nothing, so the defaults never land in storage on their own
  const ratiosLoaded = useAR(true);
  useAE(() => {
    const first = ratiosLoaded.current;
    ratiosLoaded.current = false;
    try {
      const stored = faStorage.get('fa.ratios');
      if (first && stored == null) return;
      const value = JSON.stringify(ratios);
      if (stored !== value) faStorage.set('fa.ratios', value);
    } catch (e) {}
  }, [ratios]);
  useAE(() => {
    const check = () => {
      setBare(faIsBare());
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
    setToast(null);
    setRatios({ nutne: 50, budouci: 20, radost: 30 });
    setProfile(null);
    setScreen('prehled');
  };
  // workshop: a story seeds the workshop's own data; the end deletes it and
  // opens the app without ?workshop, on the participant's own data
  const startWorkshop = (id) => {
    if (!faStartWorkshop(id)) return;
    setRatios(faLoad('fa.ratios', { nutne: 50, budouci: 20, radost: 30 }));
    setExpenses(loadFaExpenses());
    setToast(null);
    setProfile(loadFaProfile());
    setScreen('workshop');
  };
  const endWorkshop = () => {
    faClearWorkshop();
    location.replace(location.pathname);
  };
  const loadDemo = () => {
    faLoadDemo();
    setExpenses([]);
    setToast(null);
    setProfile(loadFaProfile());
  };

  const isWizard = theme === 'kouzelnický';
  const still = prefs.reduce || prefs.saveData;
  const motion = still ? 'off' : t.motion;
  // the forest video loads only after onboarding and never in the still scene;
  // the scene attribute follows what is shown (the video scene lightens the titles)
  const scene = t.scene === 'video' && profile && !still ? 'video' : 'les';
  // apply editable 50/30/20 ratios onto the shared data model before render
  const targets = faSplitIncome(APP.income, ratios);
  APP.categories.forEach(c => { if (ratios[c.key] != null) { c.targetPct = ratios[c.key]; c.target = targets[c.key]; } });
  // real-data mode: rewrite APP from the user's stores for the month shown (no-op for demo profile)
  faHydrate(ratios, month);
  // then the month's expenses and goal deposits: they use up the plan, they never raise it
  const monthExpenses = expenses.filter(e => faExpenseMonth(e) === month);
  applyFaExpenses(monthExpenses, faDepositsIn(month));
  faDerive();
  setFaTheme(isWizard ? 'wizard' : 'forest');
  setFaLang(lang);

  // apply theme tweaks to the root
  const rootAttrs = {
    'data-theme': isWizard ? 'wizard' : 'forest',
    'data-scene': isWizard ? 'video' : scene,
    'data-depth': t.depth, 'data-card': t.card, 'data-accent': t.accent,
  };

  const Screen = { prehled: Prehled, plan: Plan, cile: Cile, tipy: Tipy, reflexe: Reflexe, vice: Vice, workshop: Workshop, lektor: WorkshopGuideScreen }[screen] || Prehled;

  const inner = (
    <div style={{ position: 'absolute', inset: 0 }}>
      {isWizard
        ? <WizardBackground motion={motion} />
        : <ForestBackground motion={motion} videoSrc={scene === 'video' ? FOREST_VIDEO : null} />}
      {!profile && FA_IN_WORKSHOP ? (
        <WorkshopWelcome lang={lang} setLang={setLang} onStart={startWorkshop} />
      ) : !profile ? (
        <Onboarding onFinish={finishOnboarding} defaultRatios={ratios} initialTheme={theme} lang={lang} setLang={setLang} />
      ) : (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 1 }}
        {...(locked ? { inert: '', 'aria-hidden': 'true' } : {})}>
        {storageErr && <StorageAlert onClose={() => setStorageErr(false)} />}
        {FA_DEMO && <DemoBar onEnd={endWorkshop} />}
        {/* scrollable content */}
        <main ref={scrollRef} className="fa-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="fa-content">
            <div key={screen + '|' + month + '|' + planVersion} className={'fa-stage' + (entered ? ' is-in' : '')}>
              <Screen go={go} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} ratios={ratios} setRatios={setRatios} month={month} setMonth={setMonth} expenses={monthExpenses} deleteExpense={deleteExpense} profile={profile} setProfile={setProfile} resetAll={resetAll} onDefaultPlan={applyDefaultPlan} onAdd={openAdd} endWorkshop={endWorkshop} />
            </div>
          </div>
          {/* sync APP.month so static reads stay in step */}
          {(() => { APP.month = month; return null; })()}
        </main>
        {/* add expense: floating + button & sheet */}
        <AddFab onClick={() => openAdd(null)} />
        <AddSheet open={addOpen} onClose={() => setAddOpen(false)} onSave={addExpense} expenses={expenses} month={month} preset={addPreset} />
        <FaToast toast={toast} onUndo={undoToast} onHide={() => setToast(null)} />
        {/* bottom nav */}
        <BottomNav items={FA_IN_WORKSHOP ? NAV_WORKSHOP : NAV} active={screen} go={go} lang={lang} />
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

function BottomNav({ items, active, go }) {
  return (
    <nav className="fa-nav" aria-label={L('Hlavní navigace')}>
      <div className="fa-nav-inner">
        {items.map(n => {
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

// shown when the browser refused to store a change (storage full or blocked)
function StorageAlert({ onClose }) {
  const [msg, setMsg] = useA('');
  return (
    <div className="fa-alert" role="alert">
      <Icon name="alert" size={18} stroke={2} />
      <div className="fa-alert-body">
        <p>{L('Poslední změnu se nepodařilo uložit: prohlížeč odmítl zápis. Bývá to plným úložištěm nebo zákazem ukládání dat webů v nastavení. Dokud to trvá, změny se neuloží.')}</p>
        <div className="fa-alert-actions">
          <button type="button" className="fa-ghostbtn" onClick={() => setMsg(faSaveBackup() ? L('Záloha se stáhla. Ulož si ji na bezpečné místo.') : L('Zálohu se nepodařilo vytvořit.'))}>{L('Zálohovat data do souboru')}</button>
          <button type="button" className="fa-textbtn" onClick={onClose}>{L('Zavřít')}</button>
        </div>
        {msg && <p role="status">{msg}</p>}
      </div>
    </div>
  );
}

// If rendering ever fails (for example on damaged data), show a calm page that
// can still save the raw data to a file, restore a backup or start over,
// instead of a blank screen.
class FaErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null, armed: false, msg: '', locked: '', pw: '' }; this.file = React.createRef(); }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { try { console.error('Vědomé utrácení could not render', error, info && info.componentStack); } catch (e) {} }
  render() {
    if (!this.state.error) return this.props.children;
    const save = () => {
      const ok = faSaveBackup();
      this.setState({ msg: ok ? L('Záloha se stáhla. Ulož si ji na bezpečné místo.') : L('Zálohu se nepodařilo vytvořit.') });
    };
    // a backup replaces the damaged data; one with a password asks for it here
    const restored = (res) => {
      if (res.ok) { this.setState({ msg: L('Data obnovena. Načítám…'), locked: '', pw: '' }); setTimeout(() => location.reload(), 700); return; }
      this.setState({ msg: res.error === 'password' ? L('Heslo nesedí. Data zůstala beze změny.')
        : res.error === 'shape' ? L('Záloha je poškozená nebo upravená. Data zůstala beze změny.')
        : L('Tenhle soubor nevypadá jako záloha Vědomého utrácení.') });
    };
    const pick = (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        if (faBackupKind(text) === 'encrypted') { this.setState({ locked: text, pw: '', msg: '' }); return; }
        restored(faImportData(text));
      };
      reader.onerror = () => this.setState({ msg: L('Soubor se nepodařilo přečíst.') });
      reader.readAsText(f);
    };
    const unlock = async (e) => {
      e.preventDefault();
      restored(await faImportEncrypted(this.state.locked, this.state.pw));
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
          <button className="fa-crash-restore" onClick={() => this.file.current && this.file.current.click()}>{L('Obnovit ze zálohy')}</button>
          <input ref={this.file} type="file" accept="application/json,.json" hidden onChange={pick} />
          {this.state.locked && (
            <form className="fa-crash-pw" onSubmit={unlock}>
              <label htmlFor="fa-crash-pw">{L('Heslo k záloze')}</label>
              <input id="fa-crash-pw" type="password" autoComplete="current-password" value={this.state.pw} onChange={e => this.setState({ pw: e.target.value })} />
              <button type="submit" className="fa-ghostbtn">{L('Obnovit data')}</button>
            </form>
          )}
          <button className="fa-crash-reset" onClick={reset}>{this.state.armed ? L('Opravdu smazat? Nejde vrátit') : L('Smazat data a začít znovu')}</button>
          <button className="fa-textbtn" onClick={() => location.reload()}>{L('Zkusit znovu')}</button>
          {this.state.msg && <p role="status">{this.state.msg}</p>}
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<FaErrorBoundary><App /></FaErrorBoundary>);
