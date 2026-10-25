// fa-store.jsx — persistent user-data layer ("real data" mode).
// While no profile exists, the app shows onboarding; once a profile is saved,
// faHydrate() rewrites the shared APP model from the user's stores each render.
// A profile with {demo:true} keeps the authored demo data (used for design
// preview via Tweaks). All keys live in this browser's localStorage; there is
// no server, account or sync by design.

const FA_STORE_KEYS = [
  'fa.profile', 'fa.plan.income', 'fa.plan.items', 'fa.expenses',
  'fa.goals', 'fa.yearGoals.custom', 'fa.reflexe', 'fa.ratios', 'fa.month',
  'fa.security', 'fa.reminders',
];

function faLoad(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch (e) { return fallback; }
}
function faSave(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

// ── goals store (Cíle) ──────────────────────────────────────────────────
function loadFaGoals() { return faLoad('fa.goals', []); }
function saveFaGoals(list) { faSave('fa.goals', list); }

// ── reflexe store: { [month]: { mood, answers:{} } } ────────────────────
function loadFaReflexe() {
  // older versions keyed months by their Czech label ('Červen 2026'); normalise to 'YYYY-MM'
  const raw = faLoad('fa.reflexe', {});
  const out = {};
  Object.keys(raw).forEach(k => { out[faMonthFromLabel(k) || k] = raw[k]; });
  return out;
}
function saveFaReflexe(obj) { faSave('fa.reflexe', obj); }

// ── one-time data upgrades, run before the first render ─────────────────
// Overview "year goals" used to live in their own store ('fa.yearGoals.custom')
// with no way to deposit into them. They become ordinary goals in 'fa.goals'.
function faMigrateYearGoals() {
  const old = faLoad('fa.yearGoals.custom', null);
  if (old == null) return;
  const valid = Array.isArray(old) ? old.filter(g => g && typeof g.name === 'string' && g.name.trim() && +g.target > 0) : [];
  if (valid.length) {
    const goals = loadFaGoals();
    const base = Date.now();
    saveFaGoals((Array.isArray(goals) ? goals : []).concat(valid.map((g, i) => ({
      id: base + i, name: g.name.trim(), target: Math.round(+g.target), saved: Math.max(0, Math.round(+g.saved || 0)),
      icon: g.icon || 'mountain', accent: g.accent || 'sage', kind: 'custom',
    }))));
  }
  try { localStorage.removeItem('fa.yearGoals.custom'); } catch (e) {}
}

// ── wipe everything (Více → „Smazat všechna data") ──────────────────────
function faResetAll() {
  FA_STORE_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
}

// ── seed stores right after onboarding finishes ─────────────────────────
function faSeedFreshUser(p) {
  // p: { name, income, ratios, goal|null, theme }
  saveFaProfile({ name: p.name, income: p.income, created: Date.now() });
  faSave('fa.plan.income', [{ name: L('Hlavní příjem'), amount: p.income, recurring: true }]);
  faSave('fa.plan.items', { nutne: [], budouci: [], radost: [] });
  faSave('fa.expenses', []);
  faSave('fa.reflexe', {});
  faSave('fa.ratios', p.ratios);
  saveFaGoals(p.goal ? [p.goal] : []);
}

// load the authored demo as a profile (design preview / Tweaks)
function faLoadDemo() {
  saveFaProfile({ demo: true, name: 'Anička' });
  ['fa.plan.income', 'fa.plan.items', 'fa.expenses', 'fa.goals', 'fa.yearGoals.custom', 'fa.reflexe']
    .forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
}

const FA_SRC_ACCENTS = ['moss', 'honey', 'blush', 'sage'];

// ── hydrate APP from the user's stores (call before applyFaExpenses) ────
function faHydrate(ratios) {
  const profile = loadFaProfile();
  if (!profile || profile.demo) return profile; // demo: keep authored data

  APP.user = profile.name || '';

  // income (drives everything)
  const incomeList = faLoad('fa.plan.income', []);
  const total = incomeList.reduce((s, x) => s + (+x.amount || 0), 0) || (+profile.income || 0);
  APP.income = total;
  APP.incomeSources = incomeList.map((x, i) => ({
    name: x.name, amount: +x.amount || 0, accent: FA_SRC_ACCENTS[i % FA_SRC_ACCENTS.length],
  }));

  // categories: targets from ratios, base actuals from plan items
  const items = faLoad('fa.plan.items', { nutne: [], budouci: [], radost: [] });
  APP.categories.forEach(c => {
    const pct = ratios && ratios[c.key] != null ? ratios[c.key] : c.targetPct;
    c.targetPct = pct;
    c.target = Math.round(total * pct / 100);
  });
  APP._baseActuals = APP.categories.map(c =>
    (items[c.key] || []).reduce((s, x) => s + (+x.amount || 0), 0));

  // goals / reserves
  const goals = loadFaGoals();
  APP.reserves.goals = goals;
  const saved = goals.reduce((s, g) => s + (+g.saved || 0), 0);
  const target = goals.reduce((s, g) => s + (+g.target || 0), 0);
  APP.reserves.total = saved;
  APP.reserves.goalTotal = target;
  APP.reserves.remainingToGoal = Math.max(target - saved, 0);
  const invested = goals.reduce((s, g) => s + (g.kind === 'invest' ? (+g.saved || 0) : 0), 0);
  APP.reserves.investPct = saved > 0 ? Math.round(invested / saved * 100) : 0;

  // extra incomes — not part of fresh accounts yet
  APP.extra = { total: 0, note: '', sources: [] };

  return profile;
}

// ── backup: export / import all user data as a JSON file ────────────────
// fa.security is left out on purpose — restoring a backup must never lock anyone out.
// Values are kept as the raw localStorage strings so every key round-trips exactly.
const FA_BACKUP_KEYS = FA_STORE_KEYS.filter(k => k !== 'fa.security').concat(['fa.theme', 'fa.lang']);

function faExportData() {
  const data = {};
  FA_BACKUP_KEYS.forEach(k => {
    try { const raw = localStorage.getItem(k); if (raw != null) data[k] = raw; } catch (e) {}
  });
  return JSON.stringify({ app: 'vedome-utraceni', version: 1, exported: new Date().toISOString(), data }, null, 2);
}

function faImportData(text) {
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return { ok: false, error: 'format' }; }
  if (!obj || obj.app !== 'vedome-utraceni' || !obj.data || typeof obj.data !== 'object') return { ok: false, error: 'app' };
  const keys = Object.keys(obj.data).filter(k => FA_BACKUP_KEYS.includes(k) && typeof obj.data[k] === 'string');
  if (!keys.includes('fa.profile')) return { ok: false, error: 'profile' };
  try { JSON.parse(obj.data['fa.profile']); } catch (e) { return { ok: false, error: 'profile' }; }
  FA_BACKUP_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
  keys.forEach(k => { try { localStorage.setItem(k, obj.data[k]); } catch (e) {} });
  return { ok: true, count: keys.length };
}

// derived overview stats; call AFTER applyFaExpenses
function faDerive() {
  const allocated = APP.categories.reduce((s, c) => s + (+c.actual || 0), 0);
  APP.allocated = allocated;
  APP.remaining = Math.max(APP.income - allocated, 0);
  APP.plannedPct = APP.income > 0 ? Math.min(Math.round(allocated / APP.income * 100), 999) : 0;
}

Object.assign(window, {
  faLoad, faSave, loadFaGoals, saveFaGoals, loadFaReflexe, saveFaReflexe,
  faResetAll, faSeedFreshUser, faLoadDemo, faHydrate, faDerive, faMigrateYearGoals,
  FA_BACKUP_KEYS, faExportData, faImportData,
});
