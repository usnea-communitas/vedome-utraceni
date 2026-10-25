// The numbers people see: plan split, expenses, goals, compounding, reflection
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from '../harness.mjs';

const RATIOS = { nutne: 50, budouci: 20, radost: 30 };
const store = (extra = {}) => ({
  'fa.profile': JSON.stringify({ name: 'Jana', income: 32000 }),
  'fa.plan.income': JSON.stringify([{ name: 'Hlavní příjem', amount: 30000 }, { name: 'Tutoring', amount: 2000 }]),
  'fa.plan.items': JSON.stringify({
    nutne: [{ name: 'Nájem', amount: 12000 }, { name: 'Energie', amount: 3500 }],
    budouci: [{ name: 'Spoření', amount: 4000 }],
    radost: [{ name: 'Kavárna', amount: 1500 }],
  }),
  'fa.goals': JSON.stringify([
    { id: 1, name: 'Nouzová rezerva', target: 48000, saved: 5000, kind: 'rezerva' },
    { id: 2, name: 'ETF', target: 20000, saved: 3000, kind: 'invest' },
  ]),
  ...extra,
});
// what App does on every render, in the same order
function derive(app, expenses = []) {
  app.faHydrate(RATIOS);
  app.applyFaExpenses(expenses);
  app.faDerive();
  return app.APP;
}
const cat = (A, key) => A.categories.find(c => c.key === key);

test('the plan splits the income into the 50/30/20 targets', () => {
  const A = derive(loadApp(store()));
  assert.equal(A.income, 32000);
  assert.deepEqual(plain(A.categories.map(c => [c.key, c.target])), [['nutne', 16000], ['radost', 9600], ['budouci', 6400]]);
  assert.equal(A.allocated, 21000);
  assert.equal(A.remaining, 11000);
  assert.equal(A.plannedPct, 66); // 21 000 / 32 000 = 65.6 %
});

test('a one-off expense counts towards its category and the month', () => {
  const A = derive(loadApp(store()), [{ name: 'Káva', amount: 450, cat: 'radost', ts: 1, day: '2026-10-25' }]);
  assert.equal(cat(A, 'radost').actual, 1950);
  assert.equal(cat(A, 'radost').ofTarget, 20);
  assert.equal(cat(A, 'nutne').ofTarget, 97);
  assert.equal(cat(A, 'budouci').ofTarget, 63);
  assert.equal(A.allocated, 21450);
  assert.equal(A.remaining, 10550);
  assert.equal(A.plannedTotal, 21000);
  assert.equal(A.spentTotal, 450);
  assert.equal(A.plannedPct, 67);
});

test('statuses: over plan, under the savings target, within target', () => {
  const app = loadApp(store());
  const A = derive(app, [{ name: 'Lékárna', amount: 1000, cat: 'nutne', ts: 2, day: '2026-10-02' }]);
  assert.equal(cat(A, 'nutne').tone, 'over'); // 16 500 of 16 000
  assert.equal(cat(A, 'budouci').tone, 'under'); // 4 000 of 6 400
  assert.equal(cat(A, 'radost').tone, 'ok');
  app.setFaLang('cs');
  assert.equal(app.faCatNote(cat(A, 'nutne')), 'Překročeno o 500 Kč.');
  assert.equal(app.faCatNote(cat(A, 'budouci')), 'Pod cílem o 2 400 Kč.');
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
