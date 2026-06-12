// fa-store.jsx — persistent user-data layer ("real data" mode).
// While no profile exists, the app shows onboarding; once a profile is saved,
// faHydrate() rewrites the shared APP model from the user's stores each render.
// A profile with {demo:true} keeps the authored demo data (used for design
// preview via Tweaks). All keys live in localStorage; in the real app these
// map 1:1 to Supabase tables (see FUNCTIONAL_FEATURES.md).

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
function loadFaReflexe() { return faLoad('fa.reflexe', {}); }
function saveFaReflexe(obj) { faSave('fa.reflexe', obj); }

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
  faSave('fa.yearGoals.custom', []);
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

// derived overview stats; call AFTER applyFaExpenses
function faDerive() {
  const allocated = APP.categories.reduce((s, c) => s + (+c.actual || 0), 0);
  APP.allocated = allocated;
  APP.remaining = Math.max(APP.income - allocated, 0);
  APP.plannedPct = APP.income > 0 ? Math.min(Math.round(allocated / APP.income * 100), 999) : 0;
}

Object.assign(window, {
  faLoad, faSave, loadFaGoals, saveFaGoals, loadFaReflexe, saveFaReflexe,
  faResetAll, faSeedFreshUser, faLoadDemo, faHydrate, faDerive,
});
