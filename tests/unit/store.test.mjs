// Backups, data upgrades and default names (fa-store.jsx, fa-i18n.jsx)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from '../harness.mjs';

const base = {
  'fa.profile': JSON.stringify({ name: 'Jana', income: 30000 }),
  'fa.plan.income': JSON.stringify([{ name: 'Hlavní příjem', amount: 30000 }]),
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
  assert.equal(JSON.parse(app.localStorage.getItem('fa.plan.income'))[0].name, 'Hlavní příjem');
});
