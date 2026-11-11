// Backups, data upgrades (monthly plans, year goals), default names and undo
// (fa-store.jsx, fa-i18n.jsx, fa-add.jsx)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from '../harness.mjs';

const base = {
  'fa.profile': JSON.stringify({ name: 'Jana', income: 30000 }),
  'fa.plans': JSON.stringify({ '2026-10': { income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }], items: { nutne: [{ name: 'Nájem', amount: 12000, recurring: true }], budouci: [], radost: [] } } }),
  'fa.deposits': JSON.stringify([{ goal: 1, amount: 500, day: '2026-10-04', ts: 2 }]),
  'fa.goals': JSON.stringify([{ id: 1, name: 'Bike', target: 15000, saved: 500 }]),
  'fa.expenses': JSON.stringify([{ name: 'Káva', amount: 95, cat: 'radost', ts: 1, day: '2026-10-25' }]),
  'fa.ratios': JSON.stringify({ nutne: 50, budouci: 20, radost: 30 }),
  'fa.theme': 'lesní', 'fa.lang': 'cs',
};

test('a backup restores exactly and never contains the PIN', () => {
  const app = loadApp({ ...base, 'fa.security': JSON.stringify({ mode: 'pin', hash: 'x' }) });
  const backup = JSON.parse(app.faExportData());
  assert.equal(backup.app, 'vedome-utraceni');
  assert.ok(!('fa.security' in backup.data));
  const other = loadApp();
  assert.equal(other.faImportData(JSON.stringify(backup)).ok, true);
  for (const k of Object.keys(backup.data)) assert.equal(other.localStorage.getItem(k), backup.data[k], k);
});

test('damaged or edited backups are rejected before anything changes', () => {
  const app = loadApp(base);
  const good = JSON.parse(app.faExportData());
  const withData = patch => JSON.stringify({ ...good, data: { ...good.data, ...patch } });
  const cases = {
    'fa.goals': '{"name":"x"}',
    'fa.expenses': JSON.stringify([{ name: 'a', amount: '12', cat: 'nutne', ts: 1 }]),
    'fa.plan.income': JSON.stringify([{ amount: 100 }]),
    'fa.plans': JSON.stringify({ october: { income: [] } }),
    'fa.deposits': JSON.stringify([{ goal: 1, amount: 5, day: '4. 10.' }]),
    'fa.ratios': JSON.stringify({ nutne: 50, budouci: 20 }),
    'fa.theme': 'dark',
    'fa.lang': 'de',
  };
  for (const [key, value] of Object.entries(cases)) {
    assert.deepEqual(plain(app.faImportData(withData({ [key]: value }))), { ok: false, error: 'shape', key }, key);
  }
  assert.equal(app.faImportData('not json').error, 'format');
  assert.equal(app.faImportData('{"app":"other","data":{}}').error, 'app');
  assert.equal(app.localStorage.getItem('fa.goals'), base['fa.goals']);
});

test('a new backup carries the monthly plans and the deposits', () => {
  const backup = JSON.parse(loadApp(base).faExportData());
  assert.equal(backup.version, 2);
  assert.equal(backup.data['fa.plans'], base['fa.plans']);
  assert.equal(backup.data['fa.deposits'], base['fa.deposits']);
});

test('the old single plan becomes this month\'s plan, with a copy kept, once', () => {
  const income = JSON.stringify([{ name: 'Hlavní příjem', amount: 30000, recurring: true }]);
  const items = JSON.stringify({ nutne: [{ name: 'Nájem', amount: 12000, recurring: true }], budouci: [], radost: [{ name: 'Výlet', amount: 3000, recurring: false }] });
  const app = loadApp({ 'fa.profile': base['fa.profile'], 'fa.plan.income': income, 'fa.plan.items': items });
  app.faMigratePlan();
  const now = app.faCurrentMonth();
  const plans = JSON.parse(app.localStorage.getItem('fa.plans'));
  assert.deepEqual(plans, { [now]: { income: JSON.parse(income), items: JSON.parse(items) } });
  assert.equal(app.localStorage.getItem('fa.plan.income'), null);
  assert.equal(app.localStorage.getItem('fa.plan.items'), null);
  assert.deepEqual(JSON.parse(app.localStorage.getItem('fa.plan.v1')).data, { 'fa.plan.income': income, 'fa.plan.items': items });
  // nothing is lost: the one-off item stays in this month, other months keep the rest
  assert.deepEqual(plain(app.faPlanFor(now).items.radost.map(x => x.name)), ['Výlet']);
  assert.deepEqual(plain(app.faPlanFor('2000-01').items.radost), []);
  assert.deepEqual(plain(app.faPlanFor('2000-01').items.nutne.map(x => x.amount)), [12000]);
  app.faMigratePlan();
  assert.deepEqual(JSON.parse(app.localStorage.getItem('fa.plans')), plans);
  // the copy is not part of a backup, and deleting everything removes it
  assert.ok(!('fa.plan.v1' in JSON.parse(app.faExportData()).data));
  app.faResetAll();
  for (const k of ['fa.plans', 'fa.deposits', 'fa.plan.v1']) assert.equal(app.localStorage.getItem(k), null, k);
});

test('a backup from before monthly plans restores and is converted on the next start', () => {
  const old = { app: 'vedome-utraceni', version: 1, exported: '2026-10-01T10:00:00.000Z', data: {
    'fa.profile': JSON.stringify({ name: 'Jana', income: 30000 }),
    'fa.plan.income': JSON.stringify([{ name: 'Hlavní příjem', amount: 30000, recurring: true }]),
    'fa.plan.items': JSON.stringify({ nutne: [{ name: 'Nájem', amount: 12000, recurring: true }], budouci: [], radost: [] }),
    'fa.expenses': JSON.stringify([{ name: 'Káva', amount: 95, cat: 'radost', ts: 1, day: '2026-09-25' }]),
  } };
  const app = loadApp(base);
  assert.equal(app.faImportData(JSON.stringify(old)).ok, true);
  assert.equal(app.localStorage.getItem('fa.plans'), null); // the backup replaces everything
  app.faMigratePlan();
  const plan = app.faPlanFor(app.faCurrentMonth());
  assert.equal(plan.own, true);
  assert.deepEqual(plain(plan.items.nutne), [{ name: 'Nájem', amount: 12000, recurring: true }]);
  assert.equal(app.localStorage.getItem('fa.expenses'), old.data['fa.expenses']);
});

test('old Overview year goals become real goals, once', () => {
  const app = loadApp({ ...base, 'fa.yearGoals.custom': JSON.stringify([{ name: 'Course', target: 8000, saved: 0, custom: true }, { name: '', target: 5 }]) });
  app.faMigrateYearGoals();
  const goals = JSON.parse(app.localStorage.getItem('fa.goals'));
  assert.deepEqual(goals.map(g => [g.name, g.target, g.saved, g.kind]), [['Bike', 15000, 500, undefined], ['Course', 8000, 0, 'custom']]);
  assert.equal(app.localStorage.getItem('fa.yearGoals.custom'), null);
  app.faMigrateYearGoals();
  assert.equal(JSON.parse(app.localStorage.getItem('fa.goals')).length, 2);
});

test('default names follow the interface language, typed names stay as typed', () => {
  const app = loadApp();
  app.setFaLang('cs');
  assert.equal(app.faDataLabel('Main income'), 'Hlavní příjem'); // stored in English by earlier versions
  assert.equal(app.faDataLabel('Emergency fund'), 'Nouzová rezerva');
  assert.equal(app.faDataLabel('Coffee with Petra'), 'Coffee with Petra');
  app.setFaLang('en');
  assert.equal(app.faDataLabel('Hlavní příjem'), 'Main income');
  assert.equal(app.faDataLabel('Główny dochód'), 'Main income');
});

test('a fresh profile stores the income name by its key', () => {
  const app = loadApp();
  app.setFaLang('en');
  app.faSeedFreshUser({ name: 'Jana', income: 30000, ratios: { nutne: 50, budouci: 20, radost: 30 }, goal: null });
  const plans = JSON.parse(app.localStorage.getItem('fa.plans'));
  assert.deepEqual(Object.keys(plans), [app.faCurrentMonth()]);
  assert.equal(plans[app.faCurrentMonth()].income[0].name, 'Hlavní příjem');
});

test('Undo puts a deleted expense back exactly where it was, and only once', () => {
  const app = loadApp();
  const list = [
    { name: 'Káva', amount: 95, cat: 'radost', ts: 1, day: '2026-10-01' },
    { name: 'Nájem', amount: 12000, cat: 'nutne', ts: 2, day: '2026-10-02', note: 'kept as is' },
    { name: 'Kino', amount: 250, cat: 'radost', ts: 3, day: '2026-10-03' },
  ];
  const { list: after, undo } = app.faRemoveExpense(list, 2);
  assert.deepEqual(plain(after.map(e => e.ts)), [1, 3]);
  assert.deepEqual(plain(undo), { kind: 'deleted', expense: list[1], index: 1 });
  const back = app.faUndoExpense(after, undo);
  assert.deepEqual(plain(back), list);
  assert.equal(back[1], list[1]);                     // the same expense, not a copy
  assert.equal(app.faUndoExpense(back, undo), back);  // a second Undo changes nothing
  // an expense added in the meantime stays; the restored one takes its old place
  const later = [...after, { name: 'Bus', amount: 30, cat: 'nutne', ts: 4, day: '2026-10-04' }];
  assert.deepEqual(plain(app.faUndoExpense(later, undo).map(e => e.ts)), [1, 2, 3, 4]);
  // fewer expenses than before: it goes to the end
  assert.deepEqual(plain(app.faUndoExpense([], undo).map(e => e.ts)), [2]);
  assert.deepEqual(plain(app.faRemoveExpense(list, 99)), { list, undo: null });
});

test('Undo after adding an expense removes just that one', () => {
  const app = loadApp();
  const added = { name: 'Káva', amount: 95, cat: 'radost', ts: 7, day: '2026-10-07' };
  const list = [{ name: 'Nájem', amount: 12000, cat: 'nutne', ts: 2, day: '2026-10-02' }, added];
  assert.deepEqual(plain(app.faUndoExpense(list, { kind: 'added', expense: added })), [list[0]]);
});

test('the split adds up to the income, and the rounding goes to "Need"', () => {
  const app = loadApp();
  const r = { nutne: 50, budouci: 20, radost: 30 };
  assert.deepEqual(plain(app.faSplitIncome(32000, r)), { nutne: 16000, budouci: 6400, radost: 9600 });
  // 32 333 × 50 % = 16 166.5, but the three parts must still make 32 333
  assert.deepEqual(plain(app.faSplitIncome(32333, r)), { nutne: 16166, budouci: 6467, radost: 9700 });
  assert.deepEqual(plain(app.faSplitIncome(0, r)), { nutne: 0, budouci: 0, radost: 0 });
  // ratios that do not add up to 100 % are taken as they are
  assert.deepEqual(plain(app.faSplitIncome(10000, { nutne: 50, budouci: 20, radost: 20 })), { nutne: 5000, budouci: 2000, radost: 2000 });
});

test('the plan in one tap: one recurring item per part, Undo puts the plans back exactly', () => {
  const month = '2026-11';
  const plans = JSON.stringify({ [month]: { income: [{ name: 'Hlavní příjem', amount: 32333, recurring: true }], items: { nutne: [], budouci: [], radost: [] } } });
  const app = loadApp({ 'fa.profile': base['fa.profile'], 'fa.plans': plans });
  app.setFaLang('en');
  assert.equal(app.faCanUseDefaultPlan(month), true);
  const before = app.faApplyDefaultPlan(month, { nutne: 50, budouci: 20, radost: 30 });
  assert.equal(before, plans);
  const plan = app.faPlanFor(month);
  assert.deepEqual(plain(plan.items), {
    nutne: [{ name: 'Zatím vcelku', amount: 16166, recurring: true }],
    budouci: [{ name: 'Zatím vcelku', amount: 6467, recurring: true }],
    radost: [{ name: 'Zatím vcelku', amount: 9700, recurring: true }],
  });
  assert.deepEqual(plain(plan.income), [{ name: 'Hlavní příjem', amount: 32333, recurring: true }]);
  assert.equal(app.faDataLabel('Zatím vcelku'), 'Not split yet');
  // it carries over like any recurring plan, and is offered no more
  assert.equal(app.faPlanFor('2026-12').items.radost[0].amount, 9700);
  assert.equal(app.faCanUseDefaultPlan(month), false);
  app.faRestorePlans(before);
  assert.equal(app.localStorage.getItem('fa.plans'), plans);
  assert.equal(app.faCanUseDefaultPlan(month), true);
});

test('a month that follows an earlier plan gets its own, and Undo takes only that back', () => {
  const plans = JSON.stringify({ '2026-10': { income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }], items: { nutne: [], budouci: [], radost: [{ name: 'Výlet', amount: 3000, recurring: false }] } } });
  const app = loadApp({ 'fa.profile': base['fa.profile'], 'fa.plans': plans });
  // November follows October without its one-off trip: still nothing planned
  assert.equal(app.faCanUseDefaultPlan('2026-11'), true);
  const before = app.faApplyDefaultPlan('2026-11', { nutne: 50, budouci: 30, radost: 20 });
  assert.deepEqual(Object.keys(JSON.parse(app.localStorage.getItem('fa.plans'))), ['2026-10', '2026-11']);
  assert.equal(app.faPlanFor('2026-11').items.budouci[0].amount, 9000);
  assert.equal(app.faPlanFor('2026-10').items.radost[0].name, 'Výlet');
  app.faRestorePlans(before);
  assert.equal(app.localStorage.getItem('fa.plans'), plans);
});

test('the plan in one tap is not offered without an income, with a plan, or in the demo', () => {
  const month = '2026-11';
  const plan = items => JSON.stringify({ [month]: { income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }], items } });
  const empty = { nutne: [], budouci: [], radost: [] };
  assert.equal(loadApp({ 'fa.profile': base['fa.profile'], 'fa.plans': plan({ ...empty, budouci: [{ name: 'ETF', amount: 1, recurring: true }] }) }).faCanUseDefaultPlan(month), false);
  assert.equal(loadApp({ 'fa.profile': base['fa.profile'], 'fa.plans': JSON.stringify({ [month]: { income: [], items: empty } }) }).faCanUseDefaultPlan(month), false);
  assert.equal(loadApp({ 'fa.profile': JSON.stringify({ demo: true }), 'fa.plans': plan(empty) }).faCanUseDefaultPlan(month), false);
  assert.equal(loadApp({ 'fa.plans': plan(empty) }).faCanUseDefaultPlan(month), false);
  assert.equal(loadApp({ 'fa.profile': base['fa.profile'], 'fa.plans': plan(empty) }).faCanUseDefaultPlan(month), true);
});
