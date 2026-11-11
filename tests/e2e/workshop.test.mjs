// The workshop mode in Chromium (Playwright): a whole workshop in English and
// Czech, the participant's own data before and after it, offline use and an
// axe check. Run: npm run test:e2e (first time: npx playwright install chromium)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { root } from '../harness.mjs';

const require = createRequire(import.meta.url);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
let server, base, browser;

before(async () => {
  server = http.createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    try {
      const body = await readFile(join(root, path || 'index.html'));
      res.writeHead(200, { 'Content-Type': TYPES[extname(path || 'index.html')] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

// a phone-sized page; any request outside the test server is a problem
async function phone(width = 390, extra = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', ...extra });
  const problems = [];
  await context.route(url => !url.href.startsWith(base), r => { problems.push('external request: ' + r.request().url()); return r.abort(); });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  return { context, page, problems };
}
const tab = (page, i) => page.locator('.fa-nav .fa-tab').nth(i).click();
// everything in this browser's storage, as stored
const storage = page => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
const without = (all, prefix) => Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith(prefix)));

// the participant's own data: a plan, an expense, a goal, Polish, the wizard theme and a
// PIN; stored once, so that a later change by the app would show
function seedOwnData() {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  const m = new Date();
  const month = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0');
  localStorage.setItem('fa.profile', JSON.stringify({ name: 'Jana', income: 30000 }));
  localStorage.setItem('fa.plans', JSON.stringify({ [month]: { income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }], items: { nutne: [{ name: 'Nájem', amount: 12000, recurring: true }], budouci: [], radost: [] } } }));
  localStorage.setItem('fa.expenses', JSON.stringify([{ name: 'Káva', amount: 95, cat: 'radost', ts: 1, day: month + '-01' }]));
  localStorage.setItem('fa.goals', JSON.stringify([{ id: 1, name: 'Nouzová rezerva', target: 48000, saved: 5000, kind: 'rezerva' }]));
  localStorage.setItem('fa.lang', 'pl');
  localStorage.setItem('fa.theme', 'kouzelnický');
  localStorage.setItem('fa.security', JSON.stringify({ mode: 'pin', hash: 'not-a-real-hash' }));
}

const TEXT = {
  en: {
    welcome: 'Mindful Spending workshop', start: 'Start with this story', story: 'Ema, 19',
    progress: n => `${n} of 5 done`, overview: 'Open Overview', offer: 'Put 50 / 30 / 20 into the plan',
    goals: 'Open Goals', addGoal: 'Add goal', custom: 'Custom goal', goalName: 'Goal name', target: 'Target amount', add: 'Add',
    expense: 'Add expense', reflection: 'Open Reflection', end: 'End and delete', confirm: 'Really delete the workshop?',
  },
  cs: {
    welcome: 'Workshop Vědomého utrácení', start: 'Začít s příběhem', story: 'Ema, 19 let',
    progress: n => `Hotovo ${n} z 5`, overview: 'Otevřít Přehled', offer: 'Zapsat 50 / 30 / 20 do plánu',
    goals: 'Otevřít Cíle', addGoal: 'Přidat cíl', custom: 'Vlastní cíl', goalName: 'Název cíle', target: 'Cílová částka', add: 'Přidat',
    expense: 'Přidat výdaj', reflection: 'Otevřít Reflexi', end: 'Ukončit a smazat', confirm: 'Opravdu smazat workshop?',
  },
};

for (const lang of ['en', 'cs']) {
  test(`a whole workshop runs on its own data and leaves the participant's untouched (${lang})`, async () => {
    const T = TEXT[lang];
    const { context, page, problems } = await phone();
    await page.addInitScript(seedOwnData);
    // the participant's own app, locked by their PIN
    await page.goto(base);
    await page.locator('.fa-lock').waitFor();
    const own = await storage(page);

    // the workshop link: its own welcome, in the language of the link, no lock
    await page.goto(base + `?workshop=1&lang=${lang}`);
    assert.equal(await page.locator('h1').innerText(), T.welcome);
    assert.equal(await page.locator('.fa-lock').count(), 0);
    await page.getByRole('button', { name: new RegExp('^' + T.story) }).click();
    await page.getByRole('button', { name: T.start }).click();
    const progress = page.locator('.fa-ws-tasks-head span');
    assert.equal(await progress.innerText(), T.progress(0));
    const task = i => page.locator('.fa-ws-task').nth(i);
    const tick = i => task(i).locator('input[type="checkbox"]').check();

    // 1. split the income in one tap on the Overview
    await task(0).getByRole('button', { name: T.overview }).click();
    await page.getByRole('button', { name: T.offer }).click();
    await tab(page, 0);
    await tick(0);
    // 2. find the leak: talked over, then ticked
    await tick(1);
    // 3. a goal
    await task(2).getByRole('button', { name: T.goals }).click();
    await page.getByRole('button', { name: T.addGoal }).click();
    await page.getByRole('button', { name: T.custom }).click();
    await page.getByPlaceholder(T.goalName).fill('Driving licence');
    await page.getByPlaceholder(T.target).fill('15000');
    await page.getByRole('button', { name: T.add, exact: true }).click();
    await tab(page, 0);
    await tick(2);
    // 4. the story's unexpected expense comes filled in
    await task(3).getByRole('button', { name: T.expense }).click();
    const sheet = page.locator('.fa-sheet');
    assert.equal(await sheet.locator('input[inputmode="decimal"]').first().inputValue(), '2490');
    await sheet.locator('.fa-cta-solid').click();
    await tab(page, 0);
    await tick(3);
    // 5. looking back in Reflection
    await task(4).getByRole('button', { name: T.reflection }).click();
    await page.locator('.fa-quiz-opt').first().click();
    await tab(page, 0);
    await tick(4);
    assert.equal(await progress.innerText(), T.progress(5));

    // all of it lives under fa.workshop.*, and a reload keeps it
    const during = await storage(page);
    assert.deepEqual(without(during, 'fa.workshop.'), own, 'the own data did not change during the workshop');
    const plans = JSON.parse(during['fa.workshop.plans']);
    assert.equal(Object.values(plans)[0].items.nutne[0].amount, 5800);
    assert.equal(JSON.parse(during['fa.workshop.goals'])[0].target, 15000);
    assert.equal(JSON.parse(during['fa.workshop.expenses']).length, 5);
    assert.equal(JSON.parse(during['fa.workshop.tasks']).length, 5);
    await page.reload();
    assert.equal(await page.locator('.fa-ws-tasks-head span').innerText(), T.progress(5));

    // the end deletes the workshop and opens the participant's own app, locked as before
    await page.getByRole('button', { name: T.end }).click();
    await Promise.all([page.waitForURL(base), page.getByRole('button', { name: T.confirm }).click()]);
    await page.locator('.fa-lock').waitFor();
    assert.deepEqual(await storage(page), own, 'the own data is exactly as before');
    assert.deepEqual(problems, []);
    await context.close();
  });
}

test('a workshop opened on a device without data starts the same way and ends on the welcome screen', async () => {
  const { context, page, problems } = await phone(360);
  await page.goto(base + '?workshop=1&lang=en');
  await page.getByRole('button', { name: /^Tomáš/ }).click();
  await page.getByRole('button', { name: TEXT.en.start }).click();
  assert.match(await page.locator('.fa-screen h2').first().innerText(), /^Tomáš/);
  await tab(page, 5);
  await page.getByRole('button', { name: TEXT.en.end }).click();
  await Promise.all([page.waitForURL(base), page.getByRole('button', { name: TEXT.en.confirm }).click()]);
  // the own app starts as on any first visit: English by default, onboarding
  assert.equal(await page.locator('h1').innerText(), 'Welcome to Mindful Spending');
  assert.deepEqual(Object.keys(await storage(page)).filter(k => k.startsWith('fa.workshop.')), []);
  assert.deepEqual(problems, []);
  await context.close();
});

test('after the first load the workshop opens without a connection', async () => {
  const { context, page } = await phone();
  await page.goto(base + '?workshop=1&lang=cs');
  // the app registers its service worker on https only; this test server is http
  await page.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.getByRole('button', { name: /^Lucie/ }).click();
  await page.getByRole('button', { name: TEXT.cs.start }).click();
  await page.locator('.fa-ws-task input').first().check();

  await context.setOffline(true);
  await page.reload();
  assert.match(await page.locator('.fa-screen h2').first().innerText(), /^Lucie/);
  assert.equal(await page.locator('.fa-ws-tasks-head span').innerText(), TEXT.cs.progress(1));
  await context.close();
});

// headings: one h1 per screen, no skipped level (as in smoke.test.mjs)
const outline = page => page.evaluate(() => [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
  .filter(h => h.getClientRects().length && !h.closest('[aria-hidden="true"], [inert]'))
  .map(h => +h.tagName[1]));
const assertOutline = (levels, where) => {
  assert.equal(levels.filter(l => l === 1).length, 1, `${where}: one h1 (${levels})`);
  levels.forEach((l, i) => assert.ok(i === 0 ? l === 1 : l <= levels[i - 1] + 1, `${where}: no skipped level (${levels})`));
};
// axe (WCAG 2.1 A and AA) finds nothing on the page as it stands
const axePath = require.resolve('axe-core/axe.min.js');
async function axeViolations(page) {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
  return result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);
}

test('the workshop screens have a clean outline and pass axe, in both themes', async () => {
  // the page's Content-Security-Policy allows no injected script, axe is one
  const { context, page, problems } = await phone(390, { bypassCSP: true });
  await page.goto(base + '?workshop=1&lang=cs');
  const check = async where => {
    assertOutline(await outline(page), where);
    assert.deepEqual(await axeViolations(page), [], where);
  };
  await check('welcome');
  await page.getByRole('button', { name: 'Pro lektora' }).click();
  await check('guide before a story');
  await page.getByRole('button', { name: 'Zpět' }).click();
  await page.getByRole('button', { name: /^Ema/ }).click();
  await check('welcome with a story');
  await page.getByRole('button', { name: TEXT.cs.start }).click();
  await page.locator('.fa-ws-task input').first().check();
  await check('workshop');
  await page.getByRole('button', { name: /^Pro lektora/ }).click();
  await check('guide');
  await tab(page, 5);
  await check('more');
  await page.getByRole('button', { name: 'Kouzelnický' }).click();
  await tab(page, 0);
  await check('workshop, wizard theme');
  assert.deepEqual(problems, []);
  await context.close();
});
