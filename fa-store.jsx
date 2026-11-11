// fa-store.jsx — persistent user-data layer ("real data" mode).
// While no profile exists, the app shows onboarding; once a profile is saved,
// faHydrate() rewrites the shared APP model from the user's stores each render.
// A profile with {demo:true} keeps the authored demo data (used for design
// preview via Tweaks). All keys live in this browser's localStorage, read and
// written through faStorage (fa-storage.jsx, which keeps a workshop apart);
// there is no server, account or sync by design.

// earlier versions stored the seeded income name translated ("Main income")
faRegisterDataNames(['Hlavní příjem']);

// fa.plan.income and fa.plan.items are the plan before monthly plans (version 1);
// they stay listed so old backups restore, and faMigratePlan() converts them.
// fa.plan.v1 is the copy of that old plan kept by the conversion.
const FA_STORE_KEYS = [
  'fa.profile', 'fa.plans', 'fa.plan.income', 'fa.plan.items', 'fa.expenses', 'fa.deposits',
  'fa.goals', 'fa.yearGoals.custom', 'fa.reflexe', 'fa.ratios', 'fa.month',
  'fa.security', 'fa.reminders', 'fa.plan.v1',
];

function faLoad(key, fallback) {
  try { const v = JSON.parse(faStorage.get(key)); return v == null ? fallback : v; }
  catch (e) { return fallback; }
}
function faSave(key, val) { try { faStorage.set(key, JSON.stringify(val)); } catch (e) {} }

// ── monthly plans: fa.plans = { 'YYYY-MM': { income: [item], items: { nutne, budouci, radost } } }
// A month gets its own entry when its plan is set or changed. A month without
// one follows the latest earlier entry, minus that entry's one-off items
// (recurring: false), so a plan carries over until it is changed; a month
// before the first entry follows the first entry the same way. Expenses and
// goal deposits never change the plan: they show how much of it is used.
const FA_CATS = ['nutne', 'budouci', 'radost'];
const faList = v => (Array.isArray(v) ? v : []);
const faCopyItems = list => faList(list).map(x => ({ ...x }));
const faRecurringOnly = list => faList(list).filter(x => x && x.recurring !== false).map(x => ({ ...x }));
function faEmptyPlan() { return { income: [], items: { nutne: [], budouci: [], radost: [] } }; }

function faLoadPlans() {
  const p = faLoad('fa.plans', {});
  return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
}
const faPlanMonths = plans => Object.keys(plans).filter(k => /^\d{4}-\d{2}$/.test(k)).sort();

// the plan that applies in a month: { income, items, from, own }
function faPlanFor(month, plans) {
  plans = plans || faLoadPlans();
  const keys = faPlanMonths(plans);
  if (!keys.length) return { ...faEmptyPlan(), from: null, own: false };
  const own = !!plans[month];
  const earlier = keys.filter(k => k <= month);
  const from = own ? month : earlier.length ? earlier[earlier.length - 1] : keys[0];
  const src = plans[from] || {};
  const take = own ? faCopyItems : faRecurringOnly;
  const items = src.items || {};
  return { income: take(src.income), items: { nutne: take(items.nutne), budouci: take(items.budouci), radost: take(items.radost) }, from, own };
}

// stores a changed plan as the month's own entry
function faSetPlanFor(month, plan) {
  const plans = faLoadPlans();
  const items = plan.items || {};
  plans[month] = { income: faCopyItems(plan.income), items: { nutne: faCopyItems(items.nutne), budouci: faCopyItems(items.budouci), radost: faCopyItems(items.radost) } };
  faSave('fa.plans', plans);
}

// ── the plan in one tap: the month's income split by the user's ratios ──
// One recurring item per part, kept whole until it is broken down in Plan.
// Rounding goes to "Need", so the three parts add up to the income exactly.
const FA_WHOLE_PART = 'Zatím vcelku';
faRegisterDataNames([FA_WHOLE_PART]);
const faRatioText = r => r.nutne + ' / ' + r.radost + ' / ' + r.budouci;
const faPlanIncome = plan => faList(plan.income).reduce((s, x) => s + (+x.amount || 0), 0);

// the income split by the ratios, in whole crowns; when the ratios add up to
// 100 %, rounding goes to "Need", so the parts add up to the income exactly
function faSplitIncome(income, ratios) {
  const r = ratios || { nutne: 50, budouci: 20, radost: 30 };
  const part = k => Math.round(income * (+r[k] || 0) / 100);
  const budouci = part('budouci'), radost = part('radost');
  const whole = (+r.nutne || 0) + (+r.budouci || 0) + (+r.radost || 0) === 100;
  return { nutne: whole ? income - budouci - radost : part('nutne'), budouci, radost };
}

function faDefaultPlanItems(income, ratios) {
  const parts = faSplitIncome(income, ratios);
  const item = amount => (amount > 0 ? [{ name: FA_WHOLE_PART, amount, recurring: true }] : []);
  return { nutne: item(parts.nutne), budouci: item(parts.budouci), radost: item(parts.radost) };
}

// offered while the month's plan has an income and no item yet (not in the demo)
function faCanUseDefaultPlan(month) {
  const profile = loadFaProfile();
  if (!profile || profile.demo) return false;
  const plan = faPlanFor(month);
  return faPlanIncome(plan) > 0 && FA_CATS.every(k => !plan.items[k].length);
}

// writes the split into the month's plan; returns what Undo puts back
function faApplyDefaultPlan(month, ratios) {
  let before = null;
  try { before = faStorage.get('fa.plans'); } catch (e) {}
  const plan = faPlanFor(month);
  faSetPlanFor(month, { income: plan.income, items: faDefaultPlanItems(faPlanIncome(plan), ratios) });
  return before;
}
function faRestorePlans(before) {
  try {
    if (before == null) faStorage.remove('fa.plans');
    else faStorage.set('fa.plans', before);
  } catch (e) {}
}

// ── goal deposits, dated, so they count towards "Future me" in their month ──
function loadFaDeposits() { return faList(faLoad('fa.deposits', [])); }
function faAddDeposit(goal, amount, day) {
  if (!(amount > 0)) return;
  faSave('fa.deposits', loadFaDeposits().concat([{ goal, amount, day, ts: Date.now() }]));
}
function faDepositsIn(month) { return loadFaDeposits().filter(d => d && String(d.day).slice(0, 7) === month); }

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
  try { faStorage.remove('fa.yearGoals.custom'); } catch (e) {}
}

// The plan used to be one list for every month (fa.plan.income, fa.plan.items).
// It becomes the plan of the current month, which carries over to the months
// after it and stands in for the months before it. A copy of the old plan is
// kept in fa.plan.v1 before anything is rewritten. Runs again after an old
// backup is restored.
function faMigratePlan() {
  const OLD = ['fa.plan.income', 'fa.plan.items'];
  const raw = {};
  OLD.forEach(k => { try { const v = faStorage.get(k); if (v != null) raw[k] = v; } catch (e) {} });
  if (!Object.keys(raw).length) return;
  faSave('fa.plan.v1', { saved: new Date().toISOString(), data: raw });
  const plans = faLoadPlans();
  if (!faPlanMonths(plans).length) {
    const income = faLoad('fa.plan.income', []);
    const items = faLoad('fa.plan.items', {}) || {};
    plans[faCurrentMonth()] = {
      income: faCopyItems(income),
      items: { nutne: faCopyItems(items.nutne), budouci: faCopyItems(items.budouci), radost: faCopyItems(items.radost) },
    };
    faSave('fa.plans', plans);
  }
  OLD.forEach(k => { try { faStorage.remove(k); } catch (e) {} });
}

// ── wipe everything (Více → „Smazat všechna data") ──────────────────────
function faResetAll() {
  FA_STORE_KEYS.forEach(k => { try { faStorage.remove(k); } catch (e) {} });
}

// ── seed stores right after onboarding finishes ─────────────────────────
function faSeedFreshUser(p) {
  // p: { name, income, ratios, goal|null, theme }
  saveFaProfile({ name: p.name, income: p.income, created: Date.now() });
  // the Czech key is stored, so the name follows the interface language
  faSave('fa.plans', { [faCurrentMonth()]: { income: [{ name: 'Hlavní příjem', amount: p.income, recurring: true }], items: { nutne: [], budouci: [], radost: [] } } });
  faSave('fa.expenses', []);
  faSave('fa.deposits', []);
  faSave('fa.reflexe', {});
  faSave('fa.ratios', p.ratios);
  saveFaGoals(p.goal ? [p.goal] : []);
}

// load the authored demo as a profile (design preview / Tweaks)
function faLoadDemo() {
  saveFaProfile({ demo: true, name: 'Anička' });
  ['fa.plans', 'fa.plan.income', 'fa.plan.items', 'fa.expenses', 'fa.deposits', 'fa.goals', 'fa.yearGoals.custom', 'fa.reflexe']
    .forEach(k => { try { faStorage.remove(k); } catch (e) {} });
}

const FA_SRC_ACCENTS = ['moss', 'honey', 'blush', 'sage'];

// ── hydrate APP from the user's stores for one month (call before applyFaExpenses) ──
function faHydrate(ratios, month) {
  const profile = loadFaProfile();
  if (!profile || profile.demo) return profile; // demo: keep authored data

  APP.user = profile.name || '';

  // the month's plan: income drives everything
  const plan = faPlanFor(month || APP.month);
  const incomeList = plan.income;
  const total = incomeList.reduce((s, x) => s + (+x.amount || 0), 0) || (+profile.income || 0);
  APP.income = total;
  APP.incomeSources = incomeList.map((x, i) => ({
    name: x.name, amount: +x.amount || 0, accent: FA_SRC_ACCENTS[i % FA_SRC_ACCENTS.length],
  }));

  // categories: targets from ratios, planned amounts from the plan items
  const items = plan.items;
  const pcts = {};
  APP.categories.forEach(c => { pcts[c.key] = ratios && ratios[c.key] != null ? ratios[c.key] : c.targetPct; });
  const targets = faSplitIncome(total, pcts);
  APP.categories.forEach(c => {
    c.targetPct = pcts[c.key];
    c.target = targets[c.key];
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
// Version 2 (monthly plans) adds fa.plans and fa.deposits; a version 1 backup still
// restores, and its fa.plan.income and fa.plan.items are converted on the next start.
const FA_BACKUP_KEYS = FA_STORE_KEYS.filter(k => k !== 'fa.security' && k !== 'fa.plan.v1').concat(['fa.theme', 'fa.lang']);

function faExportData() {
  const data = {};
  FA_BACKUP_KEYS.forEach(k => {
    try { const raw = faStorage.get(k); if (raw != null) data[k] = raw; } catch (e) {}
  });
  return JSON.stringify({ app: 'vedome-utraceni', version: 2, exported: new Date().toISOString(), data }, null, 2);
}

// What each restored key must look like for the app to render. A damaged or
// hand-edited backup is rejected as a whole, before anything is replaced.
const faIsObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const faIsNum = v => typeof v === 'number' && isFinite(v);
const faIsItem = x => faIsObj(x) && typeof x.name === 'string' && faIsNum(x.amount) && x.amount >= 0;
const FA_BACKUP_CHECKS = {
  'fa.profile': v => faIsObj(v) && (v.name == null || typeof v.name === 'string') && (v.income == null || faIsNum(v.income)),
  'fa.plan.income': v => Array.isArray(v) && v.every(faIsItem),
  'fa.plan.items': v => faIsObj(v) && ['nutne', 'budouci', 'radost'].every(k => v[k] == null || (Array.isArray(v[k]) && v[k].every(faIsItem))),
  'fa.plans': v => faIsObj(v) && Object.keys(v).every(m => /^\d{4}-\d{2}$/.test(m) && faIsObj(v[m])
    && (v[m].income == null || (Array.isArray(v[m].income) && v[m].income.every(faIsItem)))
    && (v[m].items == null || FA_BACKUP_CHECKS['fa.plan.items'](v[m].items))),
  'fa.deposits': v => Array.isArray(v) && v.every(d => faIsObj(d) && faIsNum(d.amount) && d.amount >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(d.day)),
  'fa.expenses': v => Array.isArray(v) && v.every(e => faIsObj(e) && typeof e.name === 'string' && faIsNum(e.amount) && e.amount >= 0
    && typeof e.cat === 'string' && faIsNum(e.ts) && (e.day == null || /^\d{4}-\d{2}-\d{2}$/.test(e.day))),
  'fa.goals': v => Array.isArray(v) && v.every(g => faIsObj(g) && typeof g.name === 'string' && faIsNum(g.target) && (g.saved == null || faIsNum(g.saved))),
  'fa.yearGoals.custom': v => Array.isArray(v),
  'fa.reflexe': faIsObj,
  'fa.ratios': v => faIsObj(v) && ['nutne', 'budouci', 'radost'].every(k => faIsNum(v[k]) && v[k] >= 0 && v[k] <= 100),
  'fa.month': v => typeof v === 'string',
  'fa.reminders': faIsObj,
};
// these two are stored as plain strings, not JSON
const FA_BACKUP_RAW_CHECKS = {
  'fa.theme': v => v === 'lesní' || v === 'kouzelnický',
  'fa.lang': v => FA_LANGS.some(l => l.code === v),
};
function faBackupValueOk(key, raw) {
  if (FA_BACKUP_RAW_CHECKS[key]) return FA_BACKUP_RAW_CHECKS[key](raw);
  let v;
  try { v = JSON.parse(raw); } catch (e) { return false; }
  return !FA_BACKUP_CHECKS[key] || FA_BACKUP_CHECKS[key](v);
}

function faImportData(text) {
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return { ok: false, error: 'format' }; }
  if (!obj || obj.app !== 'vedome-utraceni' || !obj.data || typeof obj.data !== 'object') return { ok: false, error: 'app' };
  const keys = Object.keys(obj.data).filter(k => FA_BACKUP_KEYS.includes(k) && typeof obj.data[k] === 'string');
  if (!keys.includes('fa.profile')) return { ok: false, error: 'profile' };
  const bad = keys.find(k => !faBackupValueOk(k, obj.data[k]));
  if (bad) return { ok: false, error: 'shape', key: bad };
  FA_BACKUP_KEYS.forEach(k => { try { faStorage.remove(k); } catch (e) {} });
  keys.forEach(k => { try { faStorage.set(k, obj.data[k]); } catch (e) {} });
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
  faResetAll, faSeedFreshUser, faLoadDemo, faHydrate, faDerive, faMigrateYearGoals, faMigratePlan,
  faLoadPlans, faPlanFor, faSetPlanFor, loadFaDeposits, faAddDeposit, faDepositsIn,
  faRatioText, faSplitIncome, faDefaultPlanItems, faCanUseDefaultPlan, faApplyDefaultPlan, faRestorePlans,
  FA_BACKUP_KEYS, faExportData, faImportData, faBackupValueOk,
});
