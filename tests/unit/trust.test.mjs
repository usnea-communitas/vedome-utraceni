// Backups with a password and the expenses table (fa-store.jsx): an encrypted
// backup goes there and back, a wrong password or a changed file changes
// nothing, and the table opens in a spreadsheet with Czech letters intact.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, plain } from '../harness.mjs';

const base = {
  'fa.profile': JSON.stringify({ name: 'Jana', income: 30000 }),
  'fa.plans': JSON.stringify({ '2026-10': { income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }], items: { nutne: [{ name: 'Nájem', amount: 12000, recurring: true }], budouci: [], radost: [] } } }),
  'fa.goals': JSON.stringify([{ id: 1, name: 'Kolo pro Žofii', target: 15000, saved: 500 }]),
  'fa.expenses': JSON.stringify([{ name: 'Káva', amount: 95, cat: 'radost', ts: 1, day: '2026-10-25' }]),
  'fa.ratios': JSON.stringify({ nutne: 50, budouci: 20, radost: 30 }),
  'fa.theme': 'lesní', 'fa.lang': 'cs',
};
const other = {
  'fa.profile': JSON.stringify({ name: 'Petr', income: 41000 }),
  'fa.goals': JSON.stringify([{ id: 7, name: 'Dovolená', target: 20000, saved: 0 }]),
  'fa.lang': 'en',
};
const snapshot = app => {
  const out = {};
  for (let i = 0; i < app.localStorage.length; i++) { const k = app.localStorage.key(i); out[k] = app.localStorage.getItem(k); }
  return out;
};

test('a backup with a password goes there and back, and only with that password', async () => {
  const app = loadApp({ ...base, 'fa.security': JSON.stringify({ mode: 'pin', hash: 'x' }) });
  const text = await app.faExportEncrypted('jarní louka 2026');
  const file = JSON.parse(text);
  assert.equal(file.app, 'vedome-utraceni');
  assert.equal(file.version, 2);
  assert.ok(!('data' in file));
  assert.deepEqual(Object.keys(file.encrypted).sort(), ['cipher', 'data', 'iv', 'kdf', 'rounds', 'salt']);
  assert.equal(file.encrypted.cipher, 'AES-256-GCM');
  assert.equal(file.encrypted.kdf, 'PBKDF2-SHA-256');
  assert.equal(file.encrypted.rounds, app.FA_BACKUP_ROUNDS);
  assert.ok(app.FA_BACKUP_ROUNDS >= 600000);
  for (const secret of ['Jana', 'Žofii', 'Káva', '30000', 'fa.goals']) assert.ok(!text.includes(secret), secret);
  assert.equal(app.faBackupKind(text), 'encrypted');
  assert.equal(app.faBackupKind(app.faExportData()), 'plain');
  assert.equal(app.faBackupKind('{"app":"jiná"}'), null);
  assert.equal(app.faBackupKind('nic'), null);

  // a second backup with the same password shares no salt, IV or ciphertext
  const again = JSON.parse(await app.faExportEncrypted('jarní louka 2026')).encrypted;
  for (const k of ['salt', 'iv', 'data']) assert.notEqual(again[k], file.encrypted[k], k);

  // a wrong password: nothing changes, byte for byte
  const target = loadApp(other);
  const before = snapshot(target);
  assert.deepEqual(plain(await target.faImportEncrypted(text, 'jarní louka 2025')), { ok: false, error: 'password' });
  assert.deepEqual(plain(await target.faImportEncrypted(text, '')), { ok: false, error: 'password' });
  assert.deepEqual(snapshot(target), before);

  // the right password restores exactly what a plain backup would, and never the PIN
  assert.equal((await target.faImportEncrypted(text, 'jarní louka 2026')).ok, true);
  const expected = JSON.parse(app.faExportData()).data;
  for (const [k, v] of Object.entries(expected)) assert.equal(target.localStorage.getItem(k), v, k);
  assert.equal(target.localStorage.getItem('fa.security'), null);
});

test('the password counts as typed, whichever way the keyboard composes its letters', async () => {
  const app = loadApp(base);
  const composed = 'Žluťoučký kůň'.normalize('NFC');
  const decomposed = composed.normalize('NFD');
  assert.notEqual(composed, decomposed);
  const text = await app.faExportEncrypted(composed);
  const target = loadApp(other);
  assert.equal((await target.faImportEncrypted(text, decomposed)).ok, true);
  assert.equal(target.localStorage.getItem('fa.goals'), base['fa.goals']);
});

test('a changed or broken file is refused before anything changes', async () => {
  const app = loadApp(base);
  const text = await app.faExportEncrypted('heslo k záloze');
  const file = JSON.parse(text);
  const edit = patch => JSON.stringify({ ...file, encrypted: { ...file.encrypted, ...patch } });
  // one changed byte of the ciphertext fails the AES-GCM check, like a wrong password
  const bytes = Buffer.from(file.encrypted.data, 'base64');
  bytes[5] ^= 1;
  const target = loadApp(other);
  const before = snapshot(target);
  assert.deepEqual(plain(await target.faImportEncrypted(edit({ data: bytes.toString('base64') }), 'heslo k záloze')), { ok: false, error: 'password' });
  // a file that would keep a phone busy for minutes, or names another cipher, is not even tried
  const formats = [
    edit({ rounds: 99999 }), edit({ rounds: 5000001 }), edit({ rounds: '600000' }),
    edit({ cipher: 'AES-128-CBC' }), edit({ kdf: 'scrypt' }),
    edit({ iv: Buffer.alloc(8).toString('base64') }), edit({ salt: Buffer.alloc(4).toString('base64') }),
    edit({ data: '***' }), JSON.stringify({ app: 'vedome-utraceni', version: 2 }), 'nic',
  ];
  for (const f of formats) assert.deepEqual(plain(await target.faImportEncrypted(f, 'heslo k záloze')), { ok: false, error: 'format' }, f.slice(0, 80));
  assert.deepEqual(snapshot(target), before);
});

test('a file that opens with the password still has to be a sound backup', async () => {
  const target = loadApp(other);
  const before = snapshot(target);
  // made with the same recipe as faExportEncrypted, around a backup with a broken goal list
  const inner = JSON.stringify({ app: 'vedome-utraceni', version: 2, data: { 'fa.profile': '{"name":"X"}', 'fa.goals': '{"name":"x"}' } });
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base64 = b => Buffer.from(b).toString('base64');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode('heslo'), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(inner)));
  const file = JSON.stringify({ app: 'vedome-utraceni', version: 2, encrypted: { cipher: 'AES-256-GCM', kdf: 'PBKDF2-SHA-256', rounds: 100000, salt: base64(salt), iv: base64(iv), data: base64(data) } });
  assert.deepEqual(plain(await target.faImportEncrypted(file, 'heslo')), { ok: false, error: 'shape', key: 'fa.goals' });
  assert.deepEqual(snapshot(target), before);
});

// a small reader for the table, as a spreadsheet reads it
function readCsv(text, sep) {
  const rows = [[]];
  let cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { rows.at(-1).push(cell); cell = ''; }
    else if (c === '\r' && text[i + 1] === '\n') { rows.at(-1).push(cell); cell = ''; rows.push([]); i++; }
    else cell += c;
  }
  if (cell || rows.at(-1).length) rows.at(-1).push(cell);
  if (!rows.at(-1).length) rows.pop();
  return rows;
}
const expenses = [
  { name: 'Kávička u Žofie', amount: 95, cat: 'radost', ts: 30, day: '2026-10-25' },
  { name: 'Nájem; zálohy "Ž"', amount: 12000.4, cat: 'nutne', ts: 10, day: '2026-10-01' },
  { name: '=HYPERLINK("http://x")', amount: 10, cat: 'budouci', ts: 20, day: '2026-10-01' },
  { name: 'Groceries', amount: 1840, cat: 'nutne', ts: 5, day: '2026-09-30' },
  { name: 'Řádek\nnavíc', amount: 1, cat: 'radost', ts: 40, day: '2026-10-25' },
];

test('expenses become a table that opens with Czech letters intact', () => {
  const app = loadApp(base);
  const csv = app.faExpensesCsv(expenses);
  assert.ok(csv.startsWith('﻿'), 'byte-order mark');
  assert.deepEqual([...Buffer.from(csv, 'utf8').subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.ok(csv.endsWith('\r\n'));
  assert.equal(app.faCsvSeparator(), ';');
  assert.deepEqual(readCsv(csv.slice(1), ';'), [
    ['Datum', 'Název', 'Kategorie', 'Částka (Kč)'],
    // oldest first, then in the order they were written; a default name in the interface language
    ['2026-09-30', 'Nákup potravin', 'Potřebné', '1840'],
    ['2026-10-01', 'Nájem; zálohy "Ž"', 'Potřebné', '12000'],
    // a name that starts like a formula stays text
    ['2026-10-01', '\'=HYPERLINK("http://x")', 'Budoucí já', '10'],
    ['2026-10-25', 'Kávička u Žofie', 'Radost', '95'],
    ['2026-10-25', 'Řádek\nnavíc', 'Radost', '1'],
  ]);
  assert.equal(app.faExpensesCsv([]), '﻿Datum;Název;Kategorie;Částka (Kč)\r\n');
});

test('in English the table uses commas and English headings', () => {
  const app = loadApp({ ...base, 'fa.lang': 'en' });
  const csv = app.faExpensesCsv(expenses.slice(0, 2));
  assert.equal(app.faCsvSeparator(), ',');
  assert.deepEqual(readCsv(csv.slice(1), ','), [
    ['Date', 'Name', 'Category', 'Amount (Kč)'],
    ['2026-10-01', 'Nájem; zálohy "Ž"', 'Need', '12000'],
    ['2026-10-25', 'Kávička u Žofie', 'Fun', '95'],
  ]);
});
