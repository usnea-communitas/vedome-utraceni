// Data that does not disappear (fa-store.jsx, fa-storage.jsx): when the app
// reminds of a backup, how it asks the browser to keep the data, and that a
// refused write is reported instead of lost without a word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from '../harness.mjs';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-13T10:00:00Z');
const month = '2026-11';

// a person who finished the onboarding `ago` days before NOW
const person = (ago, extra = {}) => ({
  'fa.profile': JSON.stringify({ name: 'Ema', income: 30000, created: NOW - ago * DAY }),
  'fa.plans': JSON.stringify({ [month]: { income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }], items: { nutne: [], budouci: [], radost: [] } } }),
  'fa.expenses': '[]',
  ...extra,
});

test('the backup reminder: two days after the first data, then 30 days after each backup', () => {
  const { faBackupDue } = loadApp();
  const due = o => plain(faBackupDue({ hasData: true, since: NOW - 10 * DAY, last: null, hiddenAt: null, off: false, now: NOW, ...o }));
  assert.equal(due({ hasData: false }), null, 'nothing to keep');
  assert.equal(due({ off: true }), null, 'turned off');
  assert.equal(due({ since: NOW - 1 * DAY }), null, 'a day after the onboarding');
  assert.deepEqual(due({ since: NOW - 2 * DAY }), { never: true });
  assert.equal(due({ since: null }), null, 'no idea since when: wait');
  assert.equal(due({ last: NOW - 29 * DAY }), null);
  assert.deepEqual(due({ last: NOW - 30 * DAY }), { days: 30 });
  assert.deepEqual(due({ last: NOW - 45.5 * DAY }), { days: 45 });
  assert.equal(due({ hiddenAt: NOW - 13 * DAY }), null, 'hidden for 14 days');
  assert.deepEqual(due({ hiddenAt: NOW - 14 * DAY }), { never: true });
});

test('the reminder reads the stored data; a workshop and the demo never show it', () => {
  assert.deepEqual(plain(loadApp(person(3)).faBackupReminderNow(NOW)), { never: true });
  assert.equal(loadApp(person(1)).faBackupReminderNow(NOW), null);
  const old = new Date(NOW - 40 * DAY).toISOString();
  assert.deepEqual(plain(loadApp(person(90, { 'fa.backup.last': old })).faBackupReminderNow(NOW)), { days: 40 });
  assert.equal(loadApp(person(90, { 'fa.backup.reminder': JSON.stringify({ off: true }) })).faBackupReminderNow(NOW), null);
  assert.equal(loadApp(person(90), { search: '?workshop=1' }).faBackupReminderNow(NOW), null);
  assert.equal(loadApp({ 'fa.profile': JSON.stringify({ demo: true, name: 'Anička' }) }).faBackupReminderNow(NOW), null);
  assert.equal(loadApp({}).faBackupReminderNow(NOW), null, 'before the onboarding');
  // a profile from before `created` counts from the first expense
  const app = loadApp({ 'fa.profile': JSON.stringify({ name: 'Ema' }), 'fa.expenses': JSON.stringify([{ name: 'Káva', amount: 80, cat: 'radost', ts: NOW - 5 * DAY }]) });
  assert.deepEqual(plain(app.faBackupReminderNow(NOW)), { never: true });
});

test('a restored backup counts as a backup from its own date, and the date is not part of backups', () => {
  const app = loadApp(person(90));
  assert.ok(!app.FA_BACKUP_KEYS.includes('fa.backup.last'));
  assert.ok(app.FA_BACKUP_KEYS.includes('fa.backup.reminder'));
  const file = JSON.parse(app.faExportData());
  file.exported = '2026-10-01T08:00:00.000Z';
  const other = loadApp({});
  assert.equal(other.faImportData(JSON.stringify(file)).ok, true);
  assert.equal(other.localStorage.getItem('fa.backup.last'), '2026-10-01T08:00:00.000Z');
  // and a refused backup leaves the date alone
  assert.equal(other.faImportData('{"app":"vedome-utraceni","data":{}}').ok, false);
  assert.equal(other.localStorage.getItem('fa.backup.last'), '2026-10-01T08:00:00.000Z');
});

test('a write the browser refuses is reported, not lost without a word', () => {
  const app = loadApp(person(3));
  const events = [];
  app.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } };
  app.dispatchEvent = e => { events.push(e); return true; };
  assert.equal(app.faStorage.set('fa.month', '"2026-11"'), true);
  assert.equal(events.length, 0);
  app.localStorage.setItem = () => { const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; throw e; };
  assert.equal(app.faStorage.set('fa.expenses', '[1]'), false);
  assert.deepEqual(events.map(e => [e.type, e.detail.key, e.detail.name]), [['fa-storage-error', 'fa.expenses', 'QuotaExceededError']]);
});

test('the app asks the browser to keep the data only where no prompt appears, and only with data', async () => {
  const run = async (ua, storage, opts) => {
    const app = loadApp(storage, opts);
    const calls = [];
    app.navigator = {
      userAgent: ua,
      storage: { persisted: async () => { calls.push('persisted'); return false; }, persist: async () => { calls.push('persist'); return true; } },
    };
    return { kept: await app.faKeepQuietly(), calls, asks: app.faPersistAsks() };
  };
  const chrome = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';
  const safari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  const firefox = 'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0';
  const firefoxIos = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15';
  assert.deepEqual(plain(await run(chrome, person(3))), { kept: true, calls: ['persisted', 'persist'], asks: false });
  assert.deepEqual(plain(await run(safari, person(3))), { kept: true, calls: ['persisted', 'persist'], asks: false });
  assert.deepEqual(plain(await run(firefoxIos, person(3))), { kept: true, calls: ['persisted', 'persist'], asks: false }, 'Firefox on iOS is WebKit');
  assert.deepEqual(plain(await run(firefox, person(3))), { kept: null, calls: [], asks: true }, 'Firefox would show a prompt');
  assert.deepEqual(plain(await run(chrome, {})), { kept: null, calls: [], asks: false }, 'nothing to keep yet');
  assert.deepEqual(plain(await run(chrome, person(3), { search: '?workshop=1' })), { kept: null, calls: [], asks: false }, 'a workshop on a shared device');
});
