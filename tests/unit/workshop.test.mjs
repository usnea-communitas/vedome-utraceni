// The workshop mode keeps its own data (fa-storage.jsx, fa-workshop.jsx): a
// participant's own keys are never read or written while ?workshop=1 is open.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadApp, inApp, plain, root } from '../harness.mjs';

const OWN = {
  'fa.profile': JSON.stringify({ name: 'Jana', income: 30000 }),
  'fa.plans': JSON.stringify({ '2026-01': { income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }], items: { nutne: [], budouci: [], radost: [] } } }),
  'fa.lang': 'cs',
};
const entries = app => Object.fromEntries([...Array(app.localStorage.length).keys()].map(i => {
  const k = app.localStorage.key(i);
  return [k, app.localStorage.getItem(k)];
}));
const own = all => Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith('fa.workshop.')));

test('without a workshop address the app reads and writes its keys as they are', () => {
  const app = loadApp(OWN, { search: '?lang=cs' });
  assert.equal(app.FA_IN_WORKSHOP, false);
  assert.equal(app.faKey('fa.plans'), 'fa.plans');
  assert.equal(app.loadFaProfile().name, 'Jana');
  assert.equal(app.faStartWorkshop('ema'), false, 'a story never seeds the own data');
  assert.deepEqual(entries(app), OWN);
});

test('in a workshop every key carries the workshop prefix', () => {
  const app = loadApp(OWN, { search: '?workshop=1&lang=en' });
  assert.equal(app.FA_IN_WORKSHOP, true);
  assert.equal(app.faKey('fa.plans'), 'fa.workshop.plans');
  assert.equal(app.loadFaProfile(), null, 'the own profile is not read');
  app.faSave('fa.ratios', { nutne: 60, budouci: 10, radost: 30 });
  assert.equal(app.localStorage.getItem('fa.ratios'), null);
  assert.equal(app.localStorage.getItem('fa.workshop.ratios'), JSON.stringify({ nutne: 60, budouci: 10, radost: 30 }));
});

test('each story seeds the workshop: income, nothing planned yet, this month\'s spending', () => {
  for (const story of plain(inApp(loadApp(), 'FA_WORKSHOP_STORIES'))) {
    const app = loadApp(OWN, { search: '?workshop=1' });
    assert.equal(app.faStartWorkshop(story.id), true, story.id);
    const month = app.faCurrentMonth();
    const plan = plain(app.faPlanFor(month));
    const income = story.income.reduce((s, x) => s + x.amount, 0);
    assert.equal(plan.income.reduce((s, x) => s + x.amount, 0), income, story.id);
    assert.deepEqual(plan.items, { nutne: [], budouci: [], radost: [] }, story.id);
    const spent = plain(app.loadFaExpenses());
    assert.deepEqual(spent.map(e => [e.name, e.amount, e.cat]), story.spent.map(e => [e.name, e.amount, e.cat]), story.id);
    assert.ok(spent.every(e => e.day.startsWith(month + '-') && e.day <= app.faTodayIso()), story.id);
    assert.equal(new Set(spent.map(e => e.ts)).size, spent.length, 'each expense has its own ts');
    assert.equal(app.loadFaProfile().workshop, story.id);
    assert.deepEqual(plain(app.loadFaTasks()), []);
    assert.deepEqual(own(entries(app)), OWN, 'the own data is untouched');
  }
  assert.equal(loadApp({}, { search: '?workshop=1' }).faStartWorkshop('nobody'), false);
});

test('ending the workshop deletes its keys and only them', () => {
  const app = loadApp(OWN, { search: '?workshop=1' });
  app.faStartWorkshop('lucie');
  app.saveFaTasks(['split', 'goal']);
  assert.ok(app.faWorkshopKeys().length >= 8);
  app.faClearWorkshop();
  assert.deepEqual(entries(app), OWN);
});

test('every story, task and facilitator text is in the dictionary', () => {
  const app = loadApp();
  const S = inApp(app, 'S');
  const texts = [];
  for (const s of plain(inApp(app, 'FA_WORKSHOP_STORIES'))) {
    texts.push(s.who, s.title, s.situation, s.goal);
    for (const x of s.income.concat(s.spent, [s.surprise])) texts.push(x.name);
  }
  for (const t of plain(inApp(app, 'FA_WORKSHOP_TASKS'))) texts.push(t.title, t.body, t.action);
  for (const [, t] of plain(inApp(app, 'FA_WORKSHOP_TIMING'))) texts.push(t);
  for (const qs of Object.values(plain(inApp(app, 'FA_WORKSHOP_QUESTIONS')))) texts.push(...qs);
  assert.deepEqual(texts.filter(t => !S[t]), []);
  // the timing adds up to the 45 minutes the guide promises
  assert.equal(plain(inApp(app, 'FA_WORKSHOP_TIMING')).reduce((s, [m]) => s + m, 0), 45);
});

test('each QR code holds the workshop link in its language', () => {
  const app = loadApp();
  for (const { code } of plain(inApp(app, 'FA_LANGS'))) {
    const svg = readFileSync(join(root, 'assets', `workshop-qr-${code}.svg`), 'utf8');
    assert.equal(svg.match(/<desc>([^<]*)<\/desc>/)[1].replace(/&amp;/g, '&'), app.faWorkshopLink(code), code);
  }
});

test('only fa-storage.jsx touches localStorage', () => {
  const direct = [];
  for (const file of readdirSync(root).filter(f => f.endsWith('.jsx') && f !== 'fa-storage.jsx')) {
    readFileSync(join(root, file), 'utf8').split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '');
      if (/\blocalStorage\s*\./.test(code)) direct.push(`${file}:${i + 1}`);
    });
  }
  assert.deepEqual(direct, []);
});
