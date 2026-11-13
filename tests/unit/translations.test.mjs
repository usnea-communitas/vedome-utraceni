// The translation review kit: the export lists every text, and the import changes
// exactly the reviewed translations in fa-i18n.jsx and nothing else.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../harness.mjs';
import { readDictionary, exportLanguage, toCsv, parseCsv, importLanguage, encode, readNotes, notesFor, REVIEW_LANGS } from '../../scripts/translations.mjs';

const source = readFileSync(join(root, 'fa-i18n.jsx'), 'utf8');
const entries = readDictionary(source);

test('the dictionary is read whole, with every review language', () => {
  assert.ok(entries.length > 300, `${entries.length} entries`);
  for (const e of entries) for (const lang of ['en', 'pl', 'uk', 'es']) assert.equal(typeof e.values[lang]?.text, 'string', `${lang} for ${e.key.slice(0, 40)}`);
  const welcome = entries.find(e => e.key === 'Vítej ve Vědomém utrácení');
  assert.equal(welcome.values.en.text, 'Welcome to Mindful Spending', 'escapes are decoded');
});

test('CSV survives commas, quotes and line breaks', () => {
  const rows = [['cs', 'pl'], ['a, "b"', 'line\nbreak'], ['plain', '']];
  assert.deepEqual(parseCsv(toCsv(rows)), [['cs', 'pl'], ['a, "b"', 'line\nbreak'], ['plain', '']]);
});

test('importing a reviewed CSV changes exactly the edited translation', () => {
  const rows = exportLanguage(entries, 'pl', new Map(), readNotes());
  assert.deepEqual(rows[0], ['cs', 'en', 'pl', 'where', 'check', 'note']);
  const target = rows.findIndex(r => r[0] === 'verze {v}');
  rows[target][2] = "wersja {v} – it's \"new\"";
  rows[target][5] = 'a reviewer note is ignored';
  rows[1][4] = 'a question is ignored too';
  const result = importLanguage(source, 'pl', toCsv(rows));
  assert.equal(result.edits.length, 1);
  assert.deepEqual(result.unknown, []);
  const after = readDictionary(result.source);
  assert.equal(after.length, entries.length);
  for (const [i, e] of after.entries()) {
    for (const lang of ['en', 'pl', 'uk', 'es']) {
      const expected = e.key === 'verze {v}' && lang === 'pl' ? "wersja {v} – it's \"new\"" : entries[i].values[lang].text;
      assert.equal(e.values[lang].text, expected, `${lang} for ${e.key.slice(0, 40)}`);
    }
  }
  // only the one literal differs in the source text
  assert.equal(result.source.replace(encode("wersja {v} – it's \"new\""), "'wersja {v}'"), source);
});

test('an empty cell or an unknown row changes nothing', () => {
  const rows = exportLanguage(entries, 'es');
  rows[1][2] = '';
  rows.push(['a text the app no longer has', '', 'algo', '', '']);
  const result = importLanguage(source, 'es', toCsv(rows));
  assert.equal(result.edits.length, 0);
  assert.deepEqual(result.unknown, ['a text the app no longer has']);
  assert.equal(result.source, source);
});

// The second reading (S-19): every language has its record, each note names a
// text the app has, and the questions are the first rows a reviewer sees.
const notes = readNotes();

test('every review language has a second reading, tied to texts the app has', () => {
  for (const lang of REVIEW_LANGS) {
    const own = notesFor(entries, notes, lang); // throws on a note whose text is gone
    assert.match(own.read, /^\d{4}-\d{2}-\d{2}$/, `${lang}: the day of the reading`);
    assert.ok(own.check.length > 0, `${lang}: places for a native speaker`);
    for (const n of own.check) assert.ok(n.question.trim(), `${lang}: a question for ${n.cs.slice(0, 40)}`);
    for (const n of own.fixed) assert.ok(n.before && n.after && n.why, `${lang}: a change is recorded with its reason`);
  }
  assert.throws(() => notesFor(entries, { pl: { check: [{ cs: 'a text the app no longer has', question: '?' }] } }, 'pl'), /no text/);
});

test('the questions come first, and every text is listed once', () => {
  for (const lang of REVIEW_LANGS) {
    const rows = exportLanguage(entries, lang, new Map(), notes);
    const { check } = notesFor(entries, notes, lang);
    assert.deepEqual(rows.slice(1, 1 + check.length).map(r => r[4]), check.map(n => n.question), lang);
    assert.ok(rows.slice(1 + check.length).every(r => r[4] === ''), `${lang}: no question below the first rows`);
    assert.equal(new Set(rows.slice(1).map(r => r[0])).size, entries.length, `${lang}: each text once`);
  }
});
