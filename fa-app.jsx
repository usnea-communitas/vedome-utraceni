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

  // entrance: resting DOM is visible; we briefly start hidden then release.
  // setTimeout (not rAF) so it fires even if the iframe is backgrounded.
  useAE(() => {
    setEntered(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    const id = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(id);
  }, [screen]);

  const go = (key) => { if (key !== screen) setScreen(key); };

  const isWizard = t.theme === 'kouzelnický';
  setFaTheme(isWizard ? 'wizard' : 'forest');
  setFaLang(lang);

  // apply theme tweaks to the root
  const rootAttrs = {
    'data-theme': isWizard ? 'wizard' : 'forest',
    'data-depth': t.depth, 'data-card': t.card, 'data-accent': t.accent,
  };

  const Screen = { prehled: Prehled, plan: Plan, cile: Cile, tipy: Tipy, reflexe: Reflexe, vice: Vice }[screen];

  return (
    <div className="fa-root" {...rootAttrs}>
      <IOSDevice dark={isWizard}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {isWizard
            ? <WizardBackground motion={t.motion} videoSrc={WIZARD_VIDEO} />
            : <ForestBackground motion={t.motion} videoSrc={t.scene === 'video' ? FOREST_VIDEO : null} />}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
            {/* scrollable content */}
            <div ref={scrollRef} className="fa-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <div style={{ padding: '54px 17px 132px' }}>
                <div key={screen} className={'fa-stage' + (entered ? ' is-in' : '')}>
                  <Screen go={go} lang={lang} setLang={setLang} />
                </div>
              </div>
            </div>
            {/* bottom nav */}
            <BottomNav active={screen} go={go} lang={lang} />
          </div>
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Téma" />
        <TweakRadio label="Styl" value={t.theme} options={['lesní', 'kouzelnický']} onChange={v => setTweak('theme', v)} />
        <TweakSection label="Pozadí" />
        {!isWizard && <TweakRadio label="Scéna" value={t.scene} options={['video', 'les']} onChange={v => setTweak('scene', v)} />}
        <TweakRadio label="Pohyb" value={t.motion} options={['off', 'barely', 'gentle', 'living']} onChange={v => setTweak('motion', v)} />
        <TweakSection label="Atmosféra" />
        <TweakRadio label="Karty" value={t.card} options={['soft', 'layered']} onChange={v => setTweak('card', v)} />
        {!isWizard && <TweakRadio label="Hloubka" value={t.depth} options={['cream', 'moss']} onChange={v => setTweak('depth', v)} />}
        {!isWizard && <TweakRadio label="Akcent" value={t.accent} options={['classic', 'blossom', 'amber']} onChange={v => setTweak('accent', v)} />}
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
