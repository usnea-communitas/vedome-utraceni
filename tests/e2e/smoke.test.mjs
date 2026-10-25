// Smoke test in Chromium (Playwright): onboarding → plan → expense → goals, in
// English and Czech, against the committed static files. Run: npm run test:e2e
// (first time on a machine: npx playwright install chromium)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { root } from '../harness.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.mp4': 'video/mp4' };
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

// a phone-sized page with no network outside the test server (fonts answered empty)
async function phone(width = 390) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const problems = [];
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  return { context, page, problems };
}
const money = (lang, n) => new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }).format(n) + ' Kč';

const TEXT = {
  en: { welcome: 'Welcome to conscious spending', add: 'Add', deposit: 'Deposit' },
  cs: { welcome: 'Vítej ve vědomém utrácení', add: 'Přidat', deposit: 'Vložit' },
};

for (const lang of ['en', 'cs']) {
  test(`onboarding → plan → expense → goals (${lang})`, async () => {
    const { context, page, problems } = await phone();
    await page.goto(base);
    // English by default; Czech is chosen on the welcome screen
    assert.equal(await page.locator('.fa-onb-h').innerText(), TEXT.en.welcome);
    if (lang === 'cs') await page.locator('.fa-onb-lang button[lang="cs"]').click();
    assert.equal(await page.locator('.fa-onb-h').innerText(), TEXT[lang].welcome);

    const next = page.locator('.fa-onb .fa-cta');
    await next.click();                                         // welcome
    await page.locator('.fa-onb-input').fill('Jana'); await next.click();
    assert.equal(await next.isDisabled(), true);                // no income yet
    await page.locator('.fa-onb-input').fill('32 000'); await next.click();
    await next.click();                                         // 50 / 30 / 20
    await page.locator('.fa-onb-goal').first().click();         // emergency fund: 3 × 16 000
    assert.equal(await page.locator('.fa-onb-money input').inputValue(), '48000');
    await next.click(); await next.click();                     // theme → finish

    // plan: two essentials, savings and joy
    await page.locator('.fa-nav .fa-tab').nth(1).click();
    const addItem = async (cat, name, amount) => {
      const card = page.locator('.fa-card', { has: page.locator('.fa-cat-head') }).nth(cat);
      if (!(await card.locator('input.fa-input').count())) await card.locator('.fa-cat-head').click();
      await card.locator('input.fa-input').nth(0).fill(name);
      await card.locator('input.fa-input').nth(1).fill(amount);
      await card.getByRole('button', { name: TEXT[lang].add, exact: true }).click();
    };
    await addItem(0, 'Rent', '12 000');
    await addItem(0, 'Energy', '3,500');
    await addItem(2, 'Savings', '4000');
    await addItem(1, 'Café', '1500');
    assert.match(await page.locator('.fa-screen .fa-card').first().innerText(), /66 %/); // 21 000 of 32 000

    // a one-off expense in the "joy" category
    await page.locator('.fa-nav .fa-tab').nth(0).click();
    await page.locator('.fa-fab').click();
    await page.locator('.fa-amount').fill('450');
    await page.locator('.fa-sheet input.fa-field[type=text]').fill('Coffee');
    await page.locator('.fa-catpick button').nth(1).click();
    await page.locator('.fa-sheet .fa-cta').click();
    const overview = await page.locator('.fa-screen').innerText();
    for (const n of [21450, 10550, 1950]) assert.ok(overview.includes(money(lang, n)), `${money(lang, n)} on the overview`);

    // a deposit into the goal
    await page.locator('.fa-nav .fa-tab').nth(2).click();
    await page.locator('.fa-goal-head').first().click();
    await page.locator('.fa-card input.fa-onb-input').fill('5 000');
    await page.getByRole('button', { name: TEXT[lang].deposit }).click();
    const goal = await page.locator('.fa-goal-head').first().innerText();
    assert.ok(goal.includes(money(lang, 5000)) && /10 %|10 %/.test(goal), goal);

    assert.deepEqual(problems, []);
    await context.close();
  });
}

test('skipping the first goal adds no goal, even after highlighting one', async () => {
  const { context, page, problems } = await phone();
  await page.goto(base);
  const next = page.locator('.fa-onb .fa-cta');
  await next.click(); await next.click();                     // welcome, name (optional)
  await page.locator('.fa-onb-input').fill('30000'); await next.click();
  await next.click();                                         // 50 / 30 / 20
  await page.locator('.fa-onb-goal').first().click();         // highlights the emergency fund with an amount
  await page.locator('.fa-onb .fa-textbtn').click();          // Skip — I'll add it later
  await next.click();                                         // theme → finish
  await page.locator('.fa-nav .fa-tab').nth(2).click();
  assert.equal(await page.locator('.fa-goal-head').count(), 0);
  assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem('fa.goals') || '[]')), []);
  assert.deepEqual(problems, []);
  await context.close();
});

const pinHash = pin => createHash('sha256').update('vedome-utraceni:' + pin).digest('hex');

test('the PIN works from a physical keyboard as well as the keypad', async () => {
  const { context, page, problems } = await phone();
  await page.addInitScript(hash => {
    if (sessionStorage.getItem('seeded')) return;
    localStorage.setItem('fa.profile', JSON.stringify({ name: 'Jana', income: 32000 }));
    localStorage.setItem('fa.plan.income', JSON.stringify([{ name: 'Hlavní příjem', amount: 32000 }]));
    localStorage.setItem('fa.security', JSON.stringify({ mode: 'pin', hash }));
    sessionStorage.setItem('seeded', '1');
  }, pinHash('2580'));
  await page.goto(base);
  await page.locator('.fa-lock').waitFor();
  const dots = page.locator('.fa-pin-dot[data-on="true"]');
  await page.keyboard.type('25'); assert.equal(await dots.count(), 2);
  await page.keyboard.press('Backspace'); assert.equal(await dots.count(), 1);
  await page.locator('.fa-pin-key', { hasText: '9' }).click();  // the keypad still works…
  await page.keyboard.press('Enter');                             // …and Enter does not press the focused key again
  assert.equal(await dots.count(), 2);
  await page.keyboard.type('99');                                 // 2-9-9-9 is wrong
  await page.locator('.fa-lock [role="alert"]').waitFor();
  await page.waitForFunction(() => !document.querySelector('.fa-pin-dot[data-on="true"]'));
  await page.keyboard.type('2580');
  await page.locator('.fa-lock').waitFor({ state: 'detached' });

  // a new PIN, typed twice on the keyboard, opens the app after a reload
  await page.locator('.fa-nav .fa-tab').nth(5).click();
  await page.getByRole('button', { name: /^Security/ }).click();
  await page.locator('.fa-sec-row').nth(1).click();
  await page.keyboard.type('1357');
  await page.waitForFunction(() => !document.querySelector('.fa-pin-dot[data-on="true"]')); // "Repeat PIN"
  await page.keyboard.type('1357');
  await page.locator('.fa-sheet').waitFor({ state: 'detached' });
  assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('fa.security'))).hash, pinHash('1357'));
  await page.reload();
  await page.locator('.fa-lock').waitFor();
  await page.keyboard.type('1357');
  await page.locator('.fa-lock').waitFor({ state: 'detached' });
  assert.deepEqual(problems, []);
  await context.close();
});

// headings a screen reader lists: one h1 per screen, and no level is skipped (h1 → h2 → h3)
const outline = page => page.evaluate(() => [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
  .filter(h => h.getClientRects().length && !h.closest('[aria-hidden="true"], [inert]'))
  .map(h => +h.tagName[1]));
const assertOutline = (levels, where) => {
  assert.equal(levels.filter(l => l === 1).length, 1, `${where}: one h1 (${levels})`);
  levels.forEach((l, i) => assert.ok(i === 0 ? l === 1 : l <= levels[i - 1] + 1, `${where}: no skipped level (${levels})`));
};

test('every screen has one h1 and no skipped heading levels', async () => {
  const { context, page, problems } = await phone();
  await page.goto(base);
  assertOutline(await outline(page), 'welcome');
  await page.evaluate(() => {
    localStorage.setItem('fa.profile', JSON.stringify({ name: 'Jana', income: 32000 }));
    localStorage.setItem('fa.plan.income', JSON.stringify([{ name: 'Hlavní příjem', amount: 32000 }]));
    localStorage.setItem('fa.goals', JSON.stringify([{ id: 1, name: 'Nouzová rezerva', target: 48000, saved: 5000, kind: 'rezerva' }]));
    localStorage.setItem('fa.expenses', JSON.stringify([{ name: 'Káva', amount: 95, cat: 'radost', ts: 1, day: new Date().toISOString().slice(0, 10) }]));
  });
  await page.reload();
  for (const [i, name] of ['overview', 'plan', 'goals', 'tips', 'reflection', 'more'].entries()) {
    await page.locator('.fa-nav .fa-tab').nth(i).click();
    assertOutline(await outline(page), name);
  }
  assert.deepEqual(problems, []);
  await context.close();
});

test('the overview legend stays inside its card from 360 to 430 px', async () => {
  for (const width of [360, 375, 390, 414, 430]) {
    const { context, page } = await phone(width);
    await page.addInitScript(() => {
      localStorage.setItem('fa.profile', JSON.stringify({ name: 'Jana', income: 420000 }));
      localStorage.setItem('fa.plan.income', JSON.stringify([{ name: 'Hlavní příjem', amount: 420000 }]));
      localStorage.setItem('fa.plan.items', JSON.stringify({ nutne: [{ name: 'Nájem', amount: 260400 }], budouci: [{ name: 'Spoření', amount: 50400 }], radost: [{ name: 'Kavárna', amount: 48800 }] }));
      localStorage.setItem('fa.lang', 'uk');
    });
    await page.goto(base);
    const clipped = await page.evaluate(() => {
      const card = document.querySelector('.fa-screen .fa-card').getBoundingClientRect();
      return [...document.querySelectorAll('.fa-screen .fa-card *')]
        .filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > card.right + 0.5 || r.left < card.left - 0.5); })
        .map(el => el.textContent.trim().slice(0, 30));
    });
    assert.deepEqual(clipped, [], `${width} px`);
    await context.close();
  }
});
