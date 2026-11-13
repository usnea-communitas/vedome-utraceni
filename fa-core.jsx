// fa-core.jsx — data model, formatting helpers, and nature-inspired icons
// for "Vědomé utrácení" (Conscious Spending) — forest-calm redesign.

// app version, shown in More; keep in step with package.json (a test checks it)
const FA_VERSION = '2.1.0';

// ── Number / currency formatting ────────────────────────────────────────
// Whole numbers grouped the way the interface language does it (16,000 ·
// 16 000 · 16.000); amounts are always shown in Kč. The language codes
// double as locales (getFaLocale).
const FA_NUMBER_FORMATS = {};
function fmt(n) {
  const v = Math.round(n);
  try {
    const loc = getFaLocale();
    const nf = FA_NUMBER_FORMATS[loc] || (FA_NUMBER_FORMATS[loc] = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }));
    return nf.format(v);
  } catch (e) {
    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
function kc(n) { return fmt(n) + ' Kč'; }

// ── Reading typed amounts ───────────────────────────────────────────────
// One rule for every interface language, because people type the habit of
// their own locale: spaces are ignored; a lone "," or "." followed by exactly
// three digits groups thousands ("1,000", "1.000"), otherwise it is the
// decimal mark ("12,50", "12.5"); with both marks the last one is decimal
// ("1.234,50", "1,234.50"). Returns NaN for anything that is not a number.
function faParseAmount(v) {
  let s = String(v == null ? '' : v).replace(/[\s  '’]/g, '').replace(/(kč|kc|czk)$/i, '');
  if (!/\d/.test(s) || /[^\d.,]/.test(s)) return NaN;
  const dot = s.lastIndexOf('.'), comma = s.lastIndexOf(',');
  if (dot >= 0 && comma >= 0) {
    const dec = dot > comma ? '.' : ',';
    s = s.split(dec === '.' ? ',' : '.').join('').replace(dec, '.');
  } else if (dot >= 0 || comma >= 0) {
    const parts = s.split(dot >= 0 ? '.' : ',');
    const thousands = parts.length > 2 || (parts[1].length === 3 && /^[1-9]\d{0,2}$/.test(parts[0]));
    s = thousands ? parts.join('') : parts[0] + '.' + parts[1];
  }
  return parseFloat(s);
}
// whole crowns (amounts are kept in whole Kč), or 0 when the text is not a positive amount
function faAmount(v) { const n = Math.round(faParseAmount(v)); return n > 0 ? n : 0; }

// ── Months: stored as 'YYYY-MM', labels are built on the fly ───────────
const FA_MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
function faPad2(n) { return String(n).padStart(2, '0'); }
function faMonthKey(d) { const x = d instanceof Date ? d : new Date(d); return x.getFullYear() + '-' + faPad2(x.getMonth() + 1); }
function faCurrentMonth() { return faMonthKey(new Date()); }
function faTodayIso() { const d = new Date(); return faMonthKey(d) + '-' + faPad2(d.getDate()); }
// 'YYYY-MM' stays; an older Czech label like 'Červen 2026' becomes '2026-06'; anything else → null
function faMonthFromLabel(v) {
  if (typeof v !== 'string') return null;
  if (/^\d{4}-\d{2}$/.test(v)) return v;
  const m = v.match(/^\s*(\S+)\s+(\d{4})\s*$/);
  if (!m) return null;
  const i = FA_MONTHS.indexOf(m[1]);
  return i >= 0 ? m[2] + '-' + faPad2(i + 1) : null;
}
function faParseMonth(v) { return faMonthFromLabel(v) || faCurrentMonth(); }
function faMonthParts(key) { const [y, m] = faParseMonth(key).split('-').map(Number); return { y, m }; }
// month and day labels follow the interface language (Intl), e.g. "October 2026" ·
// "Říjen 2026" · "Octubre de 2026" and "10/25" · "25. 10." · "25.10"
function faCap(s) { return s ? s.charAt(0).toLocaleUpperCase(getFaLocale()) + s.slice(1) : s; }
function faDateFormat(opts) {
  try { return new Intl.DateTimeFormat(getFaLocale(), opts); } catch (e) { return null; }
}
function faMonthName(m) { // m: 1–12
  const f = faDateFormat({ month: 'long' });
  return f ? faCap(f.format(new Date(2000, m - 1, 1))) : L(FA_MONTHS[m - 1]);
}
function faMonthLabel(key) {
  const p = faMonthParts(key);
  const f = faDateFormat({ month: 'long', year: 'numeric' });
  return f ? faCap(f.format(new Date(p.y, p.m - 1, 1))) : L(FA_MONTHS[p.m - 1]) + ' ' + p.y;
}
// the day an expense belongs to ('YYYY-MM-DD'); older records only have a timestamp
// a month inside a sentence: lower-case as running text needs it, except in English
function faMonthInText(key) {
  const label = faMonthLabel(key);
  return getFaLang() === 'en' ? label : label.charAt(0).toLocaleLowerCase(getFaLocale()) + label.slice(1);
}
function faExpenseDay(e) {
  if (e && e.day) return e.day;
  const d = new Date(e && e.ts ? e.ts : Date.now());
  return faMonthKey(d) + '-' + faPad2(d.getDate());
}
function faExpenseMonth(e) { return faExpenseDay(e).slice(0, 7); }
// a whole date in running text: "12. listopadu 2026", "November 12, 2026"
function faFullDate(iso) {
  const p = String(iso).split('-').map(Number);
  const f = faDateFormat({ day: 'numeric', month: 'long', year: 'numeric' });
  return f ? f.format(new Date(p[0], p[1] - 1, p[2])) : p[2] + '. ' + p[1] + '. ' + p[0];
}
function faDayLabel(iso) {
  const p = String(iso).split('-').map(Number);
  const f = faDateFormat({ day: 'numeric', month: 'numeric' });
  return f ? f.format(new Date(p[0], p[1] - 1, p[2])) : p[2] + '. ' + p[1] + '.';
}

// ── App data — mirrors the live structure exactly ──────────────────────
const APP = {
  user: 'Anička',
  month: faCurrentMonth(),
  // demo profile (Tweaks → sample data): a single person's realistic Czech monthly budget
  income: 42000,
  allocated: 39000,
  remaining: 3000,
  plannedPct: 93,
  incomeSources: [
    { name: 'Hlavní práce', amount: 33000, accent: 'moss' },
    { name: 'Coaching', amount: 5500, accent: 'honey' },
    { name: 'Podpora', amount: 2000, accent: 'blush' },
    { name: 'Drobné brigády', amount: 1500, accent: 'sage' },
  ],
  categories: [
    {
      key: 'nutne', name: 'Potřebné', icon: 'fir', accent: 'moss',
      targetPct: 50, target: 21000, actual: 24400, incomePct: 58, ofTarget: 116,
      status: 'Řešit', tone: 'over',
      sub: 'Nájem, energie, jídlo a vše, bez čeho to nejde.',
    },
    {
      key: 'radost', name: 'Radost', icon: 'blossom', accent: 'blush',
      targetPct: 30, target: 12600, actual: 8600, incomePct: 20, ofTarget: 68,
      status: 'OK', tone: 'ok',
      sub: 'Kavárny, výlety a drobnosti, co tě těší.',
    },
    {
      key: 'budouci', name: 'Budoucí já', icon: 'sprout', accent: 'honey',
      targetPct: 20, target: 8400, actual: 6000, incomePct: 14, ofTarget: 71,
      status: 'Řešit', tone: 'under',
      sub: 'Spoření a investice, které pěstuješ pro sebe.',
    },
  ],
  reserves: {
    total: 228100, goalTotal: 320000, remainingToGoal: 91900, investPct: 36,
    goals: [
      { name: 'Nouzová rezerva', saved: 96000, target: 120000, icon: 'shield', accent: 'moss' },
      { name: 'Investice · ETF', saved: 82400, target: 100000, icon: 'sprout', accent: 'honey' },
      { name: 'Dovolená · Toskánsko', saved: 25000, target: 60000, icon: 'sun', accent: 'blush' },
      { name: 'Nový notebook', saved: 24700, target: 40000, icon: 'leaf', accent: 'sage' },
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
      { q: 'Co mi tento měsíc udělalo radost, i když to stálo málo?', icon: 'blossom', accent: 'blush' },
      { q: 'Který výdaj se mi teď zdá zbytečný — a co by mi za ty peníze udělalo větší radost?', icon: 'leaf', accent: 'moss' },
      { q: 'Co dobrého se tento měsíc povedlo pro mé „budoucí já"?', icon: 'sprout', accent: 'honey' },
    ],
  },
  // every tip names where its fact comes from (FA_SOURCES below); a new or changed
  // fact needs a source and the day it was checked, and `npm run sources:check` opens them
  tipy: [
    { t: 'Pravidlo 24 hodin', d: 'U věcí nad 1\u00a0000 Kč počkej den. Za den poznáš, jestli je chceš, nebo potřebuješ.', icon: 'leaf', accent: 'moss',
      factTitle: 'Zajímavost', fact: 'Než něco koupí, zváží polovina Čechů, jestli si to může dovolit. V roce 2015 to byly tři čtvrtiny.',
      src: ['mfAttitudes2020'] },
    { t: 'Zaplať nejdřív budoucí já', d: 'Hned po výplatě odlož 20\u00a0% stranou, než se peníze „rozkutálí".', icon: 'sprout', accent: 'honey',
      factTitle: 'Na autopilota', fact: 'Trvalý příkaz si nastavuje 70\u00a0% domácností. Nastav ho na den výplaty a budoucí já dostane své jako první.',
      src: ['mfReserves2020'] },
    { t: 'Radost není luxus', d: 'Na drobné radosti pamatuj v plánu. Když na ně máš vyhrazeno, užiješ si je bez výčitek.', icon: 'blossom', accent: 'blush',
      factTitle: 'Zážitky > věci', fact: 'Radost z koupeného zážitku časem spíš roste, radost z nové věci rychle vyprchá.',
      src: ['cornell2010'] },
    { t: 'Pojmenuj své cíle', d: 'Dej spoření jméno a částku, třeba „Toskánsko, 30\u00a0000 Kč“. S jasným cílem víš, proč odkládáš.', icon: 'mountain', accent: 'sage',
      factTitle: 'Síla jména', fact: 'Finanční cíl si stanovuje 41\u00a0% Čechů. Z nich 69\u00a0% kvůli němu začalo spořit a 64\u00a0% si udělalo plán.',
      src: ['mfReserves2020'] },
  ],
};

// ── Where the tips come from ────────────────────────────────────────────
// A source has a name (as its publisher titles it), an address and the day we last
// read it and checked that it still says what the app says. Czech public sources
// come first; a finding that only exists abroad cites the institution that
// published it. scripts/check-sources.mjs opens every address once a month.
const FA_SOURCES = {
  mfAttitudes2020: {
    name: 'Ministerstvo financí ČR: Měření finanční gramotnosti 2020 – postoje k financím a chování',
    url: 'https://financnigramotnost.gov.cz/cs/pro-odborniky/mereni-urovne-financni-gramotnosti/2020/postoje-k-financim-a-chovani-3272',
    checked: '2026-11-12',
  },
  mfReserves2020: {
    name: 'Ministerstvo financí ČR: Měření finanční gramotnosti 2020 – domácí rozpočet a finanční rezervy',
    url: 'https://financnigramotnost.gov.cz/cs/pro-odborniky/mereni-urovne-financni-gramotnosti/2020/domaci-rozpocet-a-financni-rezervy-3227',
    checked: '2026-11-12',
  },
  mfBudget: {
    name: 'Ministerstvo financí ČR: Rozpočet (rodinné finance)',
    url: 'https://financnigramotnost.gov.cz/cs/rodinne-finance/rozpocet',
    checked: '2026-11-12',
  },
  cornell2010: {
    name: 'Cornell University: Glee from buying objects wanes, while joy of buying experiences keeps growing (2010)',
    url: 'https://news.cornell.edu/stories/2010/03/study-shows-experiences-are-better-possessions',
    checked: '2026-11-12',
  },
  damodaran: {
    name: 'A. Damodaran, NYU Stern: Historical Returns on Stocks, Bonds and Bills (1928–2025)',
    url: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html',
    checked: '2026-11-12',
  },
  cnbTarget: {
    name: 'Česká národní banka: Inflační cíl',
    url: 'https://www.cnb.cz/cs/menova-politika/inflacni-cil/',
    checked: '2026-11-12',
  },
  csu2022: {
    name: 'Český statistický úřad: Indexy spotřebitelských cen – inflace – prosinec 2022',
    url: 'https://csu.gov.cz/rychle-informace/indexy-spotrebitelskych-cen-inflace-prosinec-2022',
    checked: '2026-11-12',
  },
};
// the simulator's "in today's money": the Czech National Bank's inflation target
const FA_INFLATION = 0.02;
// the sources behind the parts of the Tips screen that are not tips
const FA_SECTION_SOURCES = {
  invest: ['damodaran'],
  inflation: ['cnbTarget', 'csu2022'],
  categories: ['mfBudget'],
};

// ── Accent color resolver (reads CSS vars so Tweaks can re-tint) ────────
const ACCENTS = {
  moss:  { v: '--moss',  soft: '--moss-soft'  },
  honey: { v: '--honey', soft: '--honey-soft' },
  blush: { v: '--blush', soft: '--blush-soft' },
  sage:  { v: '--sage',  soft: '--sage-soft'  },
  clay:  { v: '--clay',  soft: '--clay-soft'  },
};
function accentVar(name)  { return `var(${(ACCENTS[name] || ACCENTS.moss).v})`; }
function accentSoft(name) { return `var(${(ACCENTS[name] || ACCENTS.moss).soft})`; }
// accent colour for text: a darker mix, so honey or sage words stay readable on light cards
function accentText(name) { return `color-mix(in oklab, ${accentVar(name)}, #000 32%)`; }

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
    // ticked list — workshop tasks
    tasks: <g {...p}><path d="M10.5 6.5 h9.5 M10.5 12 h9.5 M10.5 17.5 h9.5"/><path d="M3.8 6.6 l1.5 1.5 L8 5.2 M3.8 12.1 l1.5 1.5 L8 10.7"/><circle cx="5.6" cy="17.5" r="1.3"/></g>,
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
    // table — expenses as a spreadsheet (CSV)
    table: <g {...p}><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9.6 h17 M3.5 14.3 h17 M9.5 9.6 V19"/></g>,
    // phone — the app on a phone's home screen
    phone: <g {...p}><rect x="6.5" y="2.8" width="11" height="18.4" rx="2.6"/><path d="M10.6 18.2 h2.8"/><path d="M9.6 9.6 l2.4-2.4 2.4 2.4 M12 7.2 v6"/></g>,
    // the phone's own buttons, drawn the way they look there: share (iOS), add to home screen (iOS), menu (iOS ⋯, Android ⋮)
    share: <g {...p}><path d="M8.6 9 H7.2 A1.7 1.7 0 0 0 5.5 10.7 V19 a1.7 1.7 0 0 0 1.7 1.7 h9.6 a1.7 1.7 0 0 0 1.7-1.7 v-8.3 A1.7 1.7 0 0 0 16.8 9 h-1.4"/><path d="M12 14.4 V3.4 M8.8 6.4 L12 3.2 15.2 6.4"/></g>,
    addsquare: <g {...p}><rect x="4" y="4" width="16" height="16" rx="3.6"/><path d="M12 8.4 v7.2 M8.4 12 h7.2"/></g>,
    dotsh: <g fill={color} stroke="none"><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></g>,
    dotsv: <g fill={color} stroke="none"><circle cx="12" cy="6" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18" r="1.7"/></g>,
    // a link that opens another site
    close: <g {...p}><path d="M7 7 L17 17 M17 7 L7 17"/></g>,
    extlink: <g {...p}><path d="M13.5 5.5 H18.5 V10.5 M18.5 5.5 L11 13"/><path d="M16.5 13.5 V17 a1.5 1.5 0 0 1-1.5 1.5 H7 A1.5 1.5 0 0 1 5.5 17 V9 A1.5 1.5 0 0 1 7 7.5 h3.5"/></g>,
  };
  const resolved = (FA_THEME === 'wizard' && WIZ_ICON[name]) ? WIZ_ICON[name] : name;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      {paths[resolved] || paths[name] || paths.leaf}
    </svg>
  );
}

Object.assign(window, {
  FA_VERSION, fmt, kc, faParseAmount, faAmount, APP, accentVar, accentSoft, accentText, Icon, ACCENTS, setFaTheme, faLabel,
  FA_MONTHS, faMonthKey, faCurrentMonth, faTodayIso, faMonthFromLabel, faParseMonth, faMonthParts,
  faMonthLabel, faMonthName, faMonthInText, faExpenseDay, faExpenseMonth, faDayLabel, faFullDate,
  FA_SOURCES, FA_SECTION_SOURCES, FA_INFLATION,
});
