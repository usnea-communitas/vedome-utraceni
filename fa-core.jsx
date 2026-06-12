// fa-core.jsx — data model, formatting helpers, and nature-inspired icons
// for "Vědomé utrácení" (Conscious Spending) — forest-calm redesign.

// ── Number / currency formatting (Czech: space thousands sep) ───────────
function fmt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
function kc(n) { return fmt(n) + ' Kč'; }

// ── App data — mirrors the live structure exactly ──────────────────────
const APP = {
  user: 'Anička',
  month: 'Červen 2026',
  income: 2600,
  allocated: 2420,
  remaining: 180,
  plannedPct: 93,
  incomeSources: [
    { name: 'Hlavní práce', amount: 1900, accent: 'moss' },
    { name: 'Coaching', amount: 430, accent: 'honey' },
    { name: 'Podpora', amount: 180, accent: 'blush' },
    { name: 'Drobné brigády', amount: 90, accent: 'sage' },
  ],
  categories: [
    {
      key: 'nutne', name: 'Potřebné', icon: 'fir', accent: 'moss',
      targetPct: 50, target: 1300, actual: 1510, incomePct: 58, ofTarget: 116,
      status: 'Řešit', tone: 'over', note: 'Překročeno o 210 Kč.',
      sub: 'Nájem, energie, jídlo a vše, bez čeho to nejde.',
    },
    {
      key: 'budouci', name: 'Budoucí já', icon: 'sprout', accent: 'honey',
      targetPct: 20, target: 520, actual: 380, incomePct: 15, ofTarget: 73,
      status: 'Řešit', tone: 'under', note: 'Pod cílem o 140 Kč.',
      sub: 'Spoření a investice, které pěstuješ pro sebe.',
    },
    {
      key: 'radost', name: 'Radost', icon: 'blossom', accent: 'blush',
      targetPct: 30, target: 780, actual: 530, incomePct: 20, ofTarget: 68,
      status: 'OK', tone: 'ok', note: 'V rámci cíle.',
      sub: 'Kavárny, výlety a drobnosti, co tě těší.',
    },
  ],
  reserves: {
    total: 114077, goalTotal: 160000, remainingToGoal: 45923, investPct: 24,
    goals: [
      { name: 'Nouzová rezerva', saved: 48000, target: 60000, icon: 'shield', accent: 'moss' },
      { name: 'Investice · ETF', saved: 41200, target: 50000, icon: 'sprout', accent: 'honey' },
      { name: 'Dovolená · Toskánsko', saved: 12500, target: 30000, icon: 'sun', accent: 'blush' },
      { name: 'Nový notebook', saved: 12377, target: 20000, icon: 'leaf', accent: 'sage' },
    ],
  },
  extra: {
    total: 26700,
    note: 'Vedlejší zdroje a jednorázové příjmy.',
    sources: [
      { name: 'spořák', amount: 26700 },
    ],
  },
  reflexe: {
    prompts: [
      { q: 'Co mi tento měsíc udělalo radost — a stálo to méně, než bych čekala?', icon: 'blossom', accent: 'blush' },
      { q: 'Který výdaj se mi teď zdá zbytečný — a co bych za ty peníze raději měla?', icon: 'leaf', accent: 'moss' },
      { q: 'Co dobrého jsem udělala pro své „budoucí já"?', icon: 'sprout', accent: 'honey' },
    ],
  },
  tipy: [
    { t: 'Pravidlo 24 hodin', d: 'U věcí nad 1 000 Kč počkej den. Touha často sama opadne.', icon: 'leaf', accent: 'moss',
      factTitle: 'Věděla jsi?', fact: 'Odložený nákup zruší skoro každý druhý člověk. Po dni „spaní“ už novou věc mozek tolik nechce.' },
    { t: 'Zaplať nejdřív budoucí já', d: 'Hned po výplatě odlož 20 % stranou, než se peníze „rozkutálí".', icon: 'sprout', accent: 'honey',
      factTitle: 'Malé číslo, velký les', fact: '500 Kč měsíčně při 6 % výnosu je za 30 let přes půl milionu. Složený úrok je tichá zahradnice.' },
    { t: 'Radost není luxus', d: 'Drobné potěšení plánuj naschvál — vina jen kazí požitek.', icon: 'blossom', accent: 'blush',
      factTitle: 'Zážitky > věci', fact: 'Výzkumy štěstí říkají: peníze za zážitky těší déle než za věci. Vzpomínka neztratí lesk.' },
    { t: 'Pojmenuj své cíle', d: 'Spoření s názvem („Toskánsko“) přežije pokušení líp než „rezerva“.', icon: 'mountain', accent: 'sage',
      factTitle: 'Síla jména', fact: 'Pojmenovaný cíl máš výrazně větší šanci dotáhnout — mozek ho pak brání jako svůj.' },
  ],
};

// ── Accent color resolver (reads CSS vars so Tweaks can re-tint) ────────
const ACCENTS = {
  moss:  { v: '--moss',  soft: '--moss-soft'  },
  honey: { v: '--honey', soft: '--honey-soft' },
  blush: { v: '--blush', soft: '--blush-soft' },
  sage:  { v: '--sage',  soft: '--sage-soft'  },
};
function accentVar(name)  { return `var(${(ACCENTS[name] || ACCENTS.moss).v})`; }
function accentSoft(name) { return `var(${(ACCENTS[name] || ACCENTS.moss).soft})`; }

// ── Theme-aware icons ──────────────────────────────────────────────────
// The app has two skins; in "wizard" the same icon names resolve to magical
// glyphs via WIZ_ICON. App sets this synchronously each render (top-down).
let FA_THEME = 'forest';
function setFaTheme(v) { FA_THEME = (v === 'wizard' || v === 'kouzelnický') ? 'wizard' : 'forest'; }
// pick a label per active theme
function faLabel(forest, wizard) { return FA_THEME === 'wizard' ? wizard : forest; }
const WIZ_ICON = {
  fir: 'castle', sprout: 'coins', blossom: 'potion',
  leaf: 'feather', sun: 'coins', shield: 'vault',
  mountain: 'star', book: 'spellbook', bulb: 'wand',
  home: 'castle', more: 'owl',
};

// ── Nature-inspired line icons (clean, geometric, not childish) ─────────
function Icon({ name, size = 24, stroke = 1.6, color = 'currentColor', style = {} }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    // fir / evergreen — "Nutné" (essentials, sturdy)
    fir: <g {...p}><path d="M12 3 L7 10 h3 L6 16 h5 v5 m1-18 L17 10 h-3 L18 16 h-5"/></g>,
    // seedling / sprout — "Budoucí já" (growth)
    sprout: <g {...p}><path d="M12 21 V11"/><path d="M12 13 C12 9 9 7 5 7 C5 11 8 13 12 13Z"/><path d="M12 11 C12 8 14.5 6 18 6 C18 9.5 15.5 11 12 11Z"/></g>,
    // blossom — "Radost" (joy)
    blossom: <g {...p}><circle cx="12" cy="12" r="2.4"/><path d="M12 9.6 C12 6 10 4 12 4 C14 4 12 6 12 9.6"/><path d="M14.4 12 C18 12 20 10 20 12 C20 14 18 12 14.4 12"/><path d="M12 14.4 C12 18 14 20 12 20 C10 20 12 18 12 14.4"/><path d="M9.6 12 C6 12 4 14 4 12 C4 10 6 12 9.6 12"/></g>,
    // single leaf
    leaf: <g {...p}><path d="M5 19 C5 11 11 5 19 5 C19 13 13 19 5 19Z"/><path d="M5 19 C9 15 13 11 17 7"/></g>,
    // sun — income / warmth
    sun: <g {...p}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></g>,
    // mountain — goals horizon
    mountain: <g {...p}><path d="M3 19 L9.5 8 L13 13 L16 9 L21 19 Z"/></g>,
    // shield — reserve / safety
    shield: <g {...p}><path d="M12 3 L19 6 V11 C19 16 16 19 12 21 C8 19 5 16 5 11 V6 Z"/><path d="M9.5 12l1.8 1.8L15 10"/></g>,
    // book — reflection
    book: <g {...p}><path d="M5 4 h9 a3 3 0 0 1 3 3 v13 H8 a3 3 0 0 1-3-3Z"/><path d="M17 7 h2 v13 H8"/><path d="M8 8h6M8 11h6"/></g>,
    // bulb — tips
    bulb: <g {...p}><path d="M9 17 h6 M10 20 h4"/><path d="M12 3 C8.7 3 6.5 5.4 6.5 8.2 C6.5 10.6 8 11.8 9 13.2 V14.5 h6 V13.2 C16 11.8 17.5 10.6 17.5 8.2 C17.5 5.4 15.3 3 12 3Z"/></g>,
    // home — overview
    home: <g {...p}><path d="M4 11 L12 4 L20 11"/><path d="M6 9.5 V20 h12 V9.5"/><path d="M10 20v-5h4v5"/></g>,
    // scales / plan
    plan: <g {...p}><path d="M12 4 v16 M6 20 h12"/><path d="M5 8 h14 M12 4 l-1 0 M5 8 L2.8 13 a3 3 0 0 0 4.4 0 Z M19 8 l2.2 5 a3 3 0 0 1-4.4 0 Z"/></g>,
    // more — three petals / dots
    more: <g {...p}><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></g>,
    // chevron
    chevron: <g {...p}><path d="M9 6l6 6-6 6"/></g>,
    // arrow up-right
    arrow: <g {...p}><path d="M7 17 L17 7 M9 7 h8 v8"/></g>,
    // plus
    plus: <g {...p}><path d="M12 6v12M6 12h12"/></g>,
    // bell / alert
    alert: <g {...p}><path d="M12 4 a5 5 0 0 1 5 5 c0 4 1.5 5 2 6 H5 c.5-1 2-2 2-6 a5 5 0 0 1 5-5Z"/><path d="M10.5 20 a2 2 0 0 0 3 0"/></g>,
    check: <g {...p}><path d="M5 12.5l4.5 4.5L19 7"/></g>,
    // repeat / recurring
    repeat: <g {...p}><path d="M4 9 a5 5 0 0 1 5-5 h7 M16 2 l3 2-3 2"/><path d="M20 15 a5 5 0 0 1-5 5 H8 M8 22 l-3-2 3-2"/></g>,
    // trash
    trash: <g {...p}><path d="M5 7 h14 M10 7 V5 a1 1 0 0 1 1-1 h2 a1 1 0 0 1 1 1 v2 M7 7 l1 12 a1 1 0 0 0 1 1 h6 a1 1 0 0 0 1-1 l1-12"/></g>,
    // ── wizard glyphs ──
    castle: <g {...p}><path d="M3 21 V11 h2 V9 h2 v2 h2 V9 h2 v2 h2 V9 h2 v2 h2 V9 h2 v2 h2 V21"/><path d="M10 21 v-4 a2 2 0 0 1 4 0 v4"/></g>,
    coins: <g {...p}><ellipse cx="12" cy="7.5" rx="6" ry="2.5"/><path d="M6 7.5 V12 c0 1.4 2.7 2.5 6 2.5 s6-1.1 6-2.5 V7.5"/><path d="M6 12 v4.5 C6 17.9 8.7 19 12 19 s6-1.1 6-2.5 V12"/></g>,
    potion: <g {...p}><path d="M9.5 3 h5"/><path d="M11 3 v5 L6.8 15.4 A3.2 3.2 0 0 0 9.6 20.2 h4.8 a3.2 3.2 0 0 0 2.8-4.8 L13 8 V3"/><path d="M8.2 14 h7.6"/><circle cx="11.5" cy="16.6" r="0.7"/><circle cx="14" cy="18" r="0.5"/></g>,
    feather: <g {...p}><path d="M20 4 C11 5 7 11 5 17 L4 20"/><path d="M19 5 C16 10 12 13 7.5 14.5"/><path d="M4 20 l3.2-1"/></g>,
    vault: <g {...p}><rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="12" cy="12" r="3.4"/><path d="M12 8.6 V7 M12 17 v-1.6 M8.6 12 H7 M17 12 h-1.6"/><circle cx="12" cy="12" r="0.6"/></g>,
    star: <g {...p}><path d="M12 3 C12.4 8.2 15.8 11.6 21 12 C15.8 12.4 12.4 15.8 12 21 C11.6 15.8 8.2 12.4 3 12 C8.2 11.6 11.6 8.2 12 3 Z"/></g>,
    spellbook: <g {...p}><path d="M5 5 a2 2 0 0 1 2-2 h11 a1 1 0 0 1 1 1 v14 a1 1 0 0 1-1 1 H7 a2 2 0 0 1-2-2 Z"/><path d="M5 17 a2 2 0 0 1 2-2 h12"/><path d="M12 6.4 l.85 1.9 2.05.28 -1.5 1.45 .36 2.03 -1.76-.96 -1.76.96 .36-2.03 -1.5-1.45 2.05-.28z"/></g>,
    owl: <g {...p}><path d="M5.5 10 a6.5 6.5 0 0 1 13 0 v2.5 a6.5 6.5 0 0 1-13 0 Z"/><circle cx="9.3" cy="10.5" r="1.5"/><circle cx="14.7" cy="10.5" r="1.5"/><path d="M12 12.4 l-1.1 1.6 h2.2 z"/><path d="M6 6.4 L8.6 8.4 M18 6.4 L15.4 8.4"/><path d="M9.5 17.6 l1.2 1.8 M14.5 17.6 l-1.2 1.8"/></g>,
    wand: <g {...p}><path d="M4 20 L16 8"/><path d="M18 5.4 h2 M19 4.4 v2"/><path d="M20.4 9.4 h1.4 M21.1 8.7 v1.4"/></g>,
    key: <g {...p}><circle cx="7.5" cy="8" r="3.5"/><path d="M10 10.5 L19 19.5 M16 16.5 l2-2 M18.5 19 l1.5-1.5"/></g>,
    // face-id frame (corners + face)
    faceid: <g {...p}><path d="M4 8 V6 a2 2 0 0 1 2-2 h2 M16 4 h2 a2 2 0 0 1 2 2 v2 M20 16 v2 a2 2 0 0 1-2 2 h-2 M8 20 H6 a2 2 0 0 1-2-2 v-2"/><path d="M9 9.5 v1.4 M15 9.5 v1.4"/><path d="M12 9.5 v3 a0.8 0.8 0 0 1-0.9 0.8"/><path d="M9 15.4 a4.4 4.4 0 0 0 6 0"/></g>,
  };
  const resolved = (FA_THEME === 'wizard' && WIZ_ICON[name]) ? WIZ_ICON[name] : name;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      {paths[resolved] || paths[name] || paths.leaf}
    </svg>
  );
}

Object.assign(window, { fmt, kc, APP, accentVar, accentSoft, Icon, ACCENTS, setFaTheme, faLabel });
