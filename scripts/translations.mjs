// scripts/translations.mjs — a review kit for native speakers.
//
//   node scripts/translations.mjs export            writes docs/translations/<lang>.csv and .md
//   node scripts/translations.mjs import pl file.csv applies the reviewed column back to fa-i18n.jsx
//
// The dictionary in fa-i18n.jsx maps each Czech source text to { en, pl, uk, es }.
// The export lists, for one language, the Czech source, the English text for
// reference, the current translation, where the text is used, a question from
// the second reading where there is one, and an empty note column. The rows
// with a question come first (docs/translations/notes.json holds the questions
// and what the second reading changed). A reviewer edits only the translation
// and note columns; the import writes changed translations back into
// fa-i18n.jsx and leaves everything else as it was. Run `npm run compile` afterwards.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REVIEW_LANGS = ['pl', 'uk', 'es'];
const LANG_NAMES = { pl: 'Polish', uk: 'Ukrainian', es: 'Spanish' };

// ---------- reading the dictionary from the source ----------

// Finds every entry of `const S = { … };` with the source offsets of each value
// literal, so the import can replace exactly one string and nothing else.
export function readDictionary(source) {
  const start = source.indexOf('const S = {');
  const end = source.indexOf('\n};', start);
  if (start < 0 || end < 0) throw new Error('fa-i18n.jsx: dictionary `const S = { … };` not found');
  const tokens = [];
  for (let i = start + 'const S = '.length; i < end; ) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); continue; }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (source[j] !== c) { if (source[j] === '\\') j++; j++; }
      tokens.push({ type: 'str', from: i, to: j + 1, raw: source.slice(i, j + 1) });
      i = j + 1; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i; while (/[A-Za-z0-9_]/.test(source[j])) j++;
      tokens.push({ type: 'id', value: source.slice(i, j) }); i = j; continue;
    }
    if ('{}:,'.includes(c)) tokens.push({ type: c });
    i++;
  }
  const entries = [];
  let t = 1; // skip the opening brace of the object
  while (t < tokens.length) {
    const key = tokens[t];
    if (key.type !== 'str') { t++; continue; }
    if (tokens[t + 1]?.type !== ':' || tokens[t + 2]?.type !== '{') throw new Error(`fa-i18n.jsx: unexpected syntax after ${key.raw.slice(0, 40)}`);
    const entry = { key: decode(key.raw), keyRaw: key.raw, values: {} };
    t += 3;
    while (tokens[t] && tokens[t].type !== '}') {
      if (tokens[t].type === 'id' && tokens[t + 1]?.type === ':' && tokens[t + 2]?.type === 'str') {
        const v = tokens[t + 2];
        entry.values[tokens[t].value] = { text: decode(v.raw), from: v.from, to: v.to };
        t += 3;
      } else t++;
    }
    entries.push(entry);
    t++;
  }
  return entries;
}

// a quoted JavaScript string literal from the source → its text
function decode(raw) { return vm.runInNewContext(raw); }

// text → a single-quoted literal in the style of fa-i18n.jsx (no-break spaces stay visible)
export function encode(text) {
  return "'" + text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/ /g, '\\u00a0') + "'";
}

// ---------- CSV ----------

const csvCell = v => (/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
export function toCsv(rows) { return rows.map(r => r.map(v => csvCell(String(v ?? ''))).join(',')).join('\n') + '\n'; }

export function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(v => v !== ''));
}

// ---------- export ----------

// where a Czech source text is used: the first component file and line
function usages(entries) {
  const files = readdirSync(root).filter(f => /\.jsx$/.test(f) && f !== 'fa-i18n.jsx');
  const texts = files.map(f => [f, readFileSync(join(root, f), 'utf8').split('\n')]);
  const where = new Map();
  for (const e of entries) {
    for (const [f, lines] of texts) {
      const n = lines.findIndex(l => l.includes(e.keyRaw));
      if (n >= 0) { where.set(e.key, `${f}:${n + 1}`); break; }
    }
  }
  return where;
}

// ---------- the second reading (notes.json) ----------

// Czech keys in notes.json are written with ordinary spaces; the dictionary may
// hold no-break spaces.
const sameText = v => String(v).replace(/\u00a0/g, ' ');

export function readNotes(file = join(root, 'docs', 'translations', 'notes.json')) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; }
}

// the notes of one language, each tied to its dictionary entry; a note whose
// Czech text the app no longer has stops the export, so no question is lost
export function notesFor(entries, notes, lang) {
  const byText = new Map(entries.map(e => [sameText(e.key), e]));
  const own = notes[lang] ?? {};
  const tie = (list = []) => list.map(n => {
    const entry = byText.get(sameText(n.cs));
    if (!entry) throw new Error(`docs/translations/notes.json (${lang}): no text "${n.cs.slice(0, 60)}" in fa-i18n.jsx`);
    return { ...n, entry };
  });
  return { read: own.read ?? '', fixed: tie(own.fixed), check: tie(own.check) };
}

export function exportLanguage(entries, lang, where = new Map(), notes = {}) {
  const header = ['cs', 'en', lang, 'where', 'check', 'note'];
  const { check } = notesFor(entries, notes, lang);
  const asked = new Map(check.map(n => [n.entry, n.question]));
  const row = e => [e.key, e.values.en?.text ?? '', e.values[lang]?.text ?? '', where.get(e.key) ?? '', asked.get(e) ?? '', ''];
  return [header, ...check.map(n => row(n.entry)), ...entries.filter(e => !asked.has(e)).map(row)];
}

const longDate = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${y}`;
};

function markdown(rows, lang, entries, notes = {}) {
  const esc = v => String(v).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
  const name = LANG_NAMES[lang];
  const { read, fixed, check } = notesFor(entries, notes, lang);
  const order = new Map(entries.map((e, i) => [e.key, i]));
  const lines = [
    `# ${name} (${lang}) — translations to review`,
    '',
    `Generated by \`npm run translations:export\`. Edit \`${lang}.csv\` (the same rows), not this file; see [README.md](README.md) and the [glossary](GLOSSARY.md).`,
    '',
  ];
  if (check.length || fixed.length) {
    lines.push(
      '## Start here',
      '',
      `A second reading${read ? ` on ${longDate(read)}` : ''} compared every ${name} text with the Czech source and the [glossary](GLOSSARY.md). ${fixed.length ? 'It changed what was clearly wrong (see below)' : 'It found nothing clearly wrong'} and left ${check.length === 1 ? 'one place' : `${check.length} places`} for a native speaker to decide. They are also the first rows of \`${lang}.csv\`, with the question in the \`check\` column.`,
      '',
    );
    if (check.length) lines.push(
      `| # | Czech (source) | English | ${name} | What to check |`,
      '|---|---|---|---|---|',
      ...check.map((n, i) => `| ${i + 1} | ${esc(n.entry.key)} | ${esc(n.entry.values.en?.text ?? '')} | ${esc(n.entry.values[lang]?.text ?? '')} | ${esc(n.question)} |`),
      '',
    );
    if (fixed.length) lines.push(
      '### What the second reading changed',
      '',
      '| Czech (source) | Before | After | Why |',
      '|---|---|---|---|',
      ...fixed.map(n => `| ${esc(n.entry.key)} | ${esc(n.before)} | ${esc(n.after)} | ${esc(n.why)} |`),
      '',
    );
    lines.push('## All texts', '');
  }
  lines.push(
    `| # | Czech (source) | English | ${name} | Where |`,
    '|---|---|---|---|---|',
    // here in the order of the dictionary, as in the app
    ...rows.slice(1).sort((x, y) => order.get(x[0]) - order.get(y[0])).map((r, i) => `| ${i + 1} | ${esc(r[0])} | ${esc(r[1])} | ${esc(r[2])} | ${esc(r[3])} |`),
  );
  return lines.join('\n') + '\n';
}

// ---------- import ----------

// applies the reviewed column of a CSV to the source; returns the new source and what changed
export function importLanguage(source, lang, csvText) {
  if (!REVIEW_LANGS.includes(lang) && lang !== 'en') throw new Error(`unknown language: ${lang}`);
  const [header, ...rows] = parseCsv(csvText);
  const col = header.indexOf(lang);
  if (header[0] !== 'cs' || col < 0) throw new Error(`the CSV needs a "cs" column first and a "${lang}" column`);
  const entries = new Map(readDictionary(source).map(e => [e.key, e]));
  const edits = []; const unknown = [];
  for (const r of rows) {
    const entry = entries.get(r[0]);
    if (!entry) { unknown.push(r[0]); continue; }
    const value = entry.values[lang];
    const text = (r[col] ?? '').trim() === '' ? null : r[col];
    if (!value || text === null || text === value.text) continue;
    edits.push({ key: r[0], from: value.from, to: value.to, before: value.text, after: text });
  }
  let out = source;
  for (const e of [...edits].sort((a, b) => b.from - a.from)) out = out.slice(0, e.from) + encode(e.after) + out.slice(e.to);
  return { source: out, edits, unknown };
}

// ---------- command line ----------

const [command, lang, file] = process.argv.slice(2);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sourcePath = join(root, 'fa-i18n.jsx');
  const source = readFileSync(sourcePath, 'utf8');
  if (command === 'export') {
    const entries = readDictionary(source);
    const where = usages(entries);
    const notes = readNotes();
    const dir = join(root, 'docs', 'translations');
    mkdirSync(dir, { recursive: true });
    for (const l of REVIEW_LANGS) {
      const rows = exportLanguage(entries, l, where, notes);
      writeFileSync(join(dir, `${l}.csv`), toCsv(rows));
      writeFileSync(join(dir, `${l}.md`), markdown(rows, l, entries, notes));
    }
    console.log(`Exported ${entries.length} texts for ${REVIEW_LANGS.join(', ')} to docs/translations/.`);
  } else if (command === 'import' && lang && file) {
    const result = importLanguage(source, lang, readFileSync(file, 'utf8'));
    writeFileSync(sourcePath, result.source);
    for (const e of result.edits) console.log(`changed: ${e.key.slice(0, 60)}\n   ${e.before}\n → ${e.after}`);
    if (result.unknown.length) console.log(`skipped ${result.unknown.length} row(s) whose Czech source is no longer in the app`);
    console.log(`${result.edits.length} translation(s) updated in fa-i18n.jsx. Now run: npm run compile && npm test`);
  } else {
    console.log('usage: node scripts/translations.mjs export | import <pl|uk|es> <file.csv>');
    process.exit(1);
  }
}
