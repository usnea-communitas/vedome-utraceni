// The numbers people see: monthly plans, the plan split, what the month used of it,
// goals, compounding, reflection
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from '../harness.mjs';

const RATIOS = { nutne: 50, budouci: 20, radost: 30 };
const M = '2026-10';
const PLAN = {
  income: [{ name: 'Hlavní příjem', amount: 30000 }, { name: 'Tutoring', amount: 2000 }],
  items: {
    nutne: [{ name: 'Nájem', amount: 12000 }, { name: 'Energie', amount: 3500 }],
    budouci: [{ name: 'Spoření', amount: 4000 }],
    radost: [{ name: 'Kavárna', amount: 1500 }],
  },
};
const store = (extra = {}, plans = { [M]: PLAN }) => ({
  'fa.profile': JSON.stringify({ name: 'Jana', income: 32000 }),
  'fa.plans': JSON.stringify(plans),
  'fa.goals': JSON.stringify([
    { id: 1, name: 'Nouzová rezerva', target: 48000, saved: 5000, kind: 'rezerva' },
    { id: 2, name: 'ETF', target: 20000, saved: 3000, kind: 'invest' },
  ]),
  ...extra,
});
// what App does on every render, in the same order, for the month shown
function derive(app, expenses = [], month = M) {
  app.faHydrate(RATIOS, month);
  app.applyFaExpenses(expenses.filter(e => app.faExpenseMonth(e) === month), app.faDepositsIn(month));
  app.faDerive();
  return app.APP;
}
const cat = (A, key) => A.categories.find(c => c.key === key);
const used = A => plain(A.categories.map(c => [c.key, c.planned, c.spent, c.left]));

test('the plan splits the income into the 50/30/20 targets', () => {
  const A = derive(loadApp(store()));
  assert.equal(A.income, 32000);
  assert.deepEqual(plain(A.categories.map(c => [c.key, c.target])), [['nutne', 16000], ['radost', 9600], ['budouci', 6400]]);
  assert.equal(A.allocated, 21000);
  assert.equal(A.remaining, 11000);
  assert.equal(A.plannedPct, 66); // 21 000 / 32 000 = 65.6 %
});

test('an expense uses up its category plan and never raises it', () => {
  const A = derive(loadApp(store()), [{ name: 'Káva', amount: 450, cat: 'radost', ts: 1, day: '2026-10-25' }]);
  assert.deepEqual(used(A), [['nutne', 15500, 0, 15500], ['radost', 1500, 450, 1050], ['budouci', 4000, 0, 4000]]);
  assert.equal(cat(A, 'radost').ofTarget, 16); // the plan, 1 500 of 9 600
  assert.equal(A.allocated, 21000);
  assert.equal(A.remaining, 11000);
  assert.equal(A.plannedPct, 66);
  assert.equal(A.plannedTotal, 21000);
  assert.equal(A.spentTotal, 450);
});

test('spending past the plan shows how far past it went', () => {
  const A = derive(loadApp(store()), [{ name: 'Výlet', amount: 2000, cat: 'radost', ts: 1, day: '2026-10-03' }]);
  assert.equal(cat(A, 'radost').left, -500);
  assert.equal(cat(A, 'radost').planned, 1500);
});

test('statuses compare the plan with the 50/30/20 targets', () => {
  const app = loadApp(store({}, { [M]: { ...PLAN, items: { ...PLAN.items, nutne: [...PLAN.items.nutne, { name: 'Lékárna', amount: 1000 }] } } }));
  const A = derive(app, [{ name: 'Káva', amount: 5000, cat: 'radost', ts: 2, day: '2026-10-02' }]);
  assert.equal(cat(A, 'nutne').tone, 'over'); // 16 500 planned of 16 000
  assert.equal(cat(A, 'budouci').tone, 'under'); // 4 000 of 6 400
  assert.equal(cat(A, 'radost').tone, 'ok'); // spending does not change the plan's status
  app.setFaLang('cs');
  assert.equal(app.faCatNote(cat(A, 'nutne')), 'Překročeno o 500 Kč.');
  assert.equal(app.faCatNote(cat(A, 'budouci')), 'Pod cílem o 2 400 Kč.');
});

test('a plan carries over to later months without its one-off items', () => {
  const app = loadApp(store({}, { '2026-10': {
    income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }, { name: 'Bonus', amount: 5000, recurring: false }],
    items: { nutne: [{ name: 'Nájem', amount: 12000, recurring: true }], budouci: [], radost: [{ name: 'Výlet', amount: 3000, recurring: false }, { name: 'Kavárna', amount: 1500 }] },
  } }));
  const names = p => plain([p.income.map(x => x.name), p.items.nutne.map(x => x.name), p.items.radost.map(x => x.name), p.from, p.own]);
  assert.deepEqual(names(app.faPlanFor('2026-10')), [['Hlavní příjem', 'Bonus'], ['Nájem'], ['Výlet', 'Kavárna'], '2026-10', true]);
  assert.deepEqual(names(app.faPlanFor('2026-11')), [['Hlavní příjem'], ['Nájem'], ['Kavárna'], '2026-10', false]);
  assert.deepEqual(names(app.faPlanFor('2027-03')), [['Hlavní příjem'], ['Nájem'], ['Kavárna'], '2026-10', false]);
  // a month before the first plan follows the first plan the same way
  assert.deepEqual(names(app.faPlanFor('2026-09')), [['Hlavní příjem'], ['Nájem'], ['Kavárna'], '2026-10', false]);
  assert.equal(derive(app, [], '2026-10').income, 35000);
  assert.equal(derive(app, [], '2026-11').income, 30000);
  assert.equal(app.APP.allocated, 13500);
});

test('a change to one month applies from that month on, not before', () => {
  const app = loadApp(store());
  const dec = app.faPlanFor('2026-12');
  app.faSetPlanFor('2026-12', { ...dec, items: { ...dec.items, nutne: [{ name: 'Nájem', amount: 13000 }, { name: 'Energie', amount: 3500 }] } });
  const rent = m => app.faPlanFor(m).items.nutne[0].amount;
  assert.deepEqual(['2026-10', '2026-11', '2026-12', '2027-01'].map(rent), [12000, 12000, 13000, 13000]);
  assert.deepEqual(Object.keys(JSON.parse(app.localStorage.getItem('fa.plans'))), ['2026-10', '2026-12']);
});

test('expenses and goal deposits count only in their own month', () => {
  const app = loadApp(store());
  app.faAddDeposit(1, 1000, '2026-10-05');
  app.faAddDeposit(2, 0, '2026-10-06'); // nothing deposited, nothing recorded
  const expenses = [
    { name: 'Káva', amount: 450, cat: 'radost', ts: 1, day: '2026-10-25' },
    { name: 'Lékárna', amount: 300, cat: 'nutne', ts: 2, day: '2026-11-02' },
  ];
  assert.deepEqual(used(derive(app, expenses, '2026-10')), [['nutne', 15500, 0, 15500], ['radost', 1500, 450, 1050], ['budouci', 4000, 1000, 3000]]);
  assert.deepEqual(used(derive(app, expenses, '2026-11')), [['nutne', 15500, 300, 15200], ['radost', 1500, 0, 1500], ['budouci', 4000, 0, 4000]]);
  assert.equal(app.loadFaDeposits().length, 1);
});

test('goals add up to the reserve totals', () => {
  const A = derive(loadApp(store()));
  assert.deepEqual(plain({ total: A.reserves.total, goalTotal: A.reserves.goalTotal, remaining: A.reserves.remainingToGoal, investPct: A.reserves.investPct }),
    { total: 8000, goalTotal: 68000, remaining: 60000, investPct: 38 });
});

test('compound interest: 500 Kč a month for 20 years at 8 %', () => {
  const app = loadApp();
  const pts = app.faInvestProjection(500, 20, 0.08);
  const last = pts[pts.length - 1];
  assert.equal(pts.length, 21);
  assert.equal(Math.round(last.fv), 294510);
  assert.equal(last.contributed, 120000);
  // the tip "500 Kč a month at 6 % is over half a million in 30 years"
  assert.ok(app.faInvestProjection(500, 30, 0.06)[30].fv > 500000);
  assert.equal(app.faInvestProjection(500, 2, 0)[2].fv, 12000);
});

test('emergency reserve suggestion: three months of essentials', () => {
  const app = loadApp();
  assert.equal(app.faReserveSuggestion(32000, 50), 48000);
  assert.equal(app.faReserveSuggestion(30000, 45), 41000); // 40 500 rounds to thousands
  assert.equal(app.faReserveSuggestion(500, 50), 1000);
});

test('reflection score bands', () => {
  const app = loadApp();
  assert.equal(app.reflexBand(4, 12).key, 'tense');
  assert.equal(app.reflexBand(8, 12).key, 'balance');
  assert.equal(app.reflexBand(9, 12).key, 'joy');
});
