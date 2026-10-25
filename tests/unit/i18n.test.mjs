// Dictionary completeness: every entry in every language, matching placeholders,
// no duplicate keys, and every string the code asks for exists (fa-i18n.jsx)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { transformSync } from 'esbuild';
import { loadApp, inApp, root, plain } from '../harness.mjs';

const app = loadApp();
const S = inApp(app, 'S');
const LANGS = plain(inApp(app, 'FA_LANGS.map(l => l.code)')).filter(l => l !== 'cs');
const placeholders = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

test('the five interface languages are offered and English is the default', () => {
  assert.deepEqual(plain(inApp(app, 'FA_LANGS.map(l => l.code)')), ['cs', 'en', 'pl', 'uk', 'es']);
  assert.equal(inApp(app, 'FA_LANG_DEFAULT'), 'en');
});

test('every dictionary entry is translated into every language', () => {
  const missing = [];
  for (const [key, entry] of Object.entries(S)) {
    for (const lang of LANGS) if (typeof entry[lang] !== 'string' || !entry[lang].trim()) missing.push(`${lang}: ${key}`);
  }
  assert.deepEqual(missing, []);
});

test('translations keep the placeholders of the Czech key', () => {
  const wrong = [];
  for (const [key, entry] of Object.entries(S)) {
    for (const lang of LANGS) if (placeholders(entry[lang]) !== placeholders(key)) wrong.push(`${lang}: ${key}`);
  }
  assert.deepEqual(wrong, []);
});

test('the dictionary has no duplicate keys', () => {
  const { warnings } = transformSync(readFileSync(join(root, 'fa-i18n.jsx'), 'utf8'), { loader: 'jsx', logLevel: 'silent', sourcefile: 'fa-i18n.jsx' });
  assert.deepEqual(warnings.filter(w => /Duplicate key/.test(w.text)).map(w => `${w.location.line}: ${w.text}`), []);
});

test('every literal L() / Lf() string in the sources has an entry', () => {
  const norm = s => s.replace(/\u00a0/g, ' ').replace(/[\u201e\u201c\u201d]/g, '"');
  const known = new Set(Object.keys(S).map(norm));
  const missing = [];
  for (const file of readdirSync(root).filter(f => f.endsWith('.jsx'))) {
    const text = readFileSync(join(root, file), 'utf8');
    for (const m of text.matchAll(/\bLf?\(\s*'((?:\\.|[^'\\])*)'/g)) {
      const key = m[1].replace(/\\'/g, "'").replace(/\\u00a0/gi, '\u00a0');
      if (!known.has(norm(key))) missing.push(`${file}: ${key}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('registered default names exist in the dictionary', () => {
  const names = plain(inApp(app, '[...FA_DATA_NAMES]'));
  assert.ok(names.length >= 10);
  assert.deepEqual(names.filter(k => !S[k]), []);
});

test('the version in the app matches package.json', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(app.FA_VERSION, pkg.version);
});
