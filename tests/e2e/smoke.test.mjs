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

// a phone-sized page; any request outside the test server is a problem (fonts are stored with the app)
async function phone(width = 390) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const problems = [];
  await context.route(url => !url.href.startsWith(base), r => { problems.push('external request: ' + r.request().url()); return r.abort(); });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  return { context, page, problems };
}
// today in the browser's own calendar (the app counts this month's expenses)
const today = () => { const d = new Date(); return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map(n => String(n).padStart(2, '0')).join('-'); };
const money = (lang, n) => new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }).format(n) + ' Kč';

const TEXT = {
  en: { welcome: 'Welcome to Mindful\u00a0Spending', add: 'Add', deposit: 'Deposit', del: 'Delete', deleted: 'Deleted', undo: 'Undo' },
  cs: { welcome: 'Vítej ve Vědomém utrácení', add: 'Přidat', deposit: 'Vložit', del: 'Smazat', deleted: 'Smazáno', undo: 'Vrátit zpět' },
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
    // the expense uses up the joy plan; it does not raise the plan
    const overview = await page.locator('.fa-screen').innerText();
    for (const n of [21000, 11000, 1050]) assert.ok(overview.includes(money(lang, n)), `${money(lang, n)} on the overview`);

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

test('a ?lang= link opens the app in that language and leaves the switcher in charge', async () => {
  const { context, page, problems } = await phone();
  await page.goto(base + '?lang=cs');
  assert.equal(await page.locator('.fa-onb-h').innerText(), TEXT.cs.welcome);
  assert.equal(new URL(page.url()).search, '', 'the parameter leaves the address');
  assert.equal(await page.evaluate(() => localStorage.getItem('fa.lang')), 'cs', 'and is remembered');
  await page.reload();
  assert.equal(await page.locator('.fa-onb-h').innerText(), TEXT.cs.welcome);
  await page.locator('.fa-onb-lang button[lang="en"]').click();
  await page.reload();
  assert.equal(await page.locator('.fa-onb-h').innerText(), TEXT.en.welcome, 'a later choice wins');
  await page.goto(base + '?lang=xx');
  assert.equal(await page.locator('.fa-onb-h').innerText(), TEXT.en.welcome, 'an unknown language changes nothing');
  assert.deepEqual(problems, []);
  await context.close();
});

// ── plan × actual: a plan carries over month to month, one-off items and expenses stay in their month ──
const MONTHS = {
  en: { spent: (a, b) => `spent ${a} of ${b}`, left: v => `${v} left`, saved: (a, b) => `put aside ${a} of ${b}`, more: v => `${v} more`,
    own: 'The plan carries over to the next months until you change it.', carried: 'Plan carried over from', rent: 'Rent', cafe: 'Café', trip: 'Trip', coffee: 'Coffee', repeats: 'Repeats monthly – Trip' },
  cs: { spent: (a, b) => `utraceno ${a} z ${b}`, left: v => `zbývá ${v}`, saved: (a, b) => `odloženo ${a} z ${b}`, more: v => `o ${v} víc`,
    own: 'Plán se přenáší do dalších měsíců, dokud ho nezměníš.', carried: 'Plán převzatý z měsíce', rent: 'Nájem', cafe: 'Kavárna', trip: 'Výlet', coffee: 'Káva', repeats: 'Opakuje se měsíčně – Výlet' },
};
const nextMonth = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1); return [d.getFullYear(), d.getMonth() + 1]; };

async function onboard(page, lang) {
  await page.goto(base);
  if (lang === 'cs') await page.locator('.fa-onb-lang button[lang="cs"]').click();
  const next = page.locator('.fa-onb .fa-cta');
  await next.click();                                         // welcome
  await page.locator('.fa-onb-input').fill('Jana'); await next.click();
  await page.locator('.fa-onb-input').fill('32 000'); await next.click();
  await next.click();                                         // 50 / 30 / 20
  await page.locator('.fa-onb-goal').first().click();         // emergency fund
  await next.click(); await next.click();                     // theme → finish
}
async function pickMonth(page, [year, month]) {
  await page.locator('.fa-pill-btn').click();
  for (let i = 0; i < 3 && Number(await page.locator('.fa-month-year span').innerText()) !== year; i++) {
    await page.locator('.fa-month-year button').nth(Number(await page.locator('.fa-month-year span').innerText()) < year ? 1 : 0).click();
  }
  await page.locator('.fa-month-pop > button').nth(month - 1).click();
}
const tab = (page, i) => page.locator('.fa-nav .fa-tab').nth(i).click();
const planActual = page => page.locator('.fa-plan-actual').innerText();
const storedMonths = page => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('fa.plans'))).sort());

for (const lang of ['en', 'cs']) {
  test(`two months in a row: the plan carries over, one-off items and expenses stay (${lang})`, async () => {
    const T = MONTHS[lang];
    const { context, page, problems } = await phone();
    await onboard(page, lang);

    // month 1: rent recurs, the trip is a one-off
    await tab(page, 1);
    assert.match(await page.locator('.fa-plan-note').innerText(), new RegExp(T.own));
    const addItem = async (cat, name, amount) => {
      const card = page.locator('.fa-card', { has: page.locator('.fa-cat-head') }).nth(cat);
      if (!(await card.locator('input.fa-input').count())) await card.locator('.fa-cat-head').click();
      await card.locator('input.fa-input').nth(0).fill(name);
      await card.locator('input.fa-input').nth(1).fill(amount);
      await card.getByRole('button', { name: TEXT[lang].add, exact: true }).click();
    };
    await addItem(0, T.rent, '12000');
    await addItem(1, T.cafe, '1500');
    await addItem(1, T.trip, '3000');
    await page.getByRole('button', { name: T.repeats }).click();
    assert.equal(await page.getByRole('button', { name: T.repeats }).getAttribute('aria-pressed'), 'false');

    // an expense in month 1 uses up the joy plan
    await tab(page, 0);
    await page.locator('.fa-fab').click();
    await page.locator('.fa-amount').fill('450');
    await page.locator('.fa-sheet input.fa-field[type=text]').fill(T.coffee);
    await page.locator('.fa-catpick button').nth(1).click();
    await page.locator('.fa-sheet .fa-cta').click();
    const m1 = await planActual(page);
    for (const t of [T.spent(money(lang, 0), money(lang, 12000)), T.spent(money(lang, 450), money(lang, 4500)), T.left(money(lang, 4050))]) assert.ok(m1.includes(t), `${t} in month 1: ${m1}`);
    await tab(page, 4);
    assert.equal(await planActual(page), m1, 'the Reflection shows the Overview numbers');

    // month 2: rent and café carry over; the trip and the expense stay in month 1
    await tab(page, 0);
    await pickMonth(page, nextMonth());
    const m2 = await planActual(page);
    for (const t of [T.spent(money(lang, 0), money(lang, 12000)), T.spent(money(lang, 0), money(lang, 1500))]) assert.ok(m2.includes(t), `${t} in month 2: ${m2}`);
    assert.ok(!m2.includes(money(lang, 4500)), m2);
    await tab(page, 4);
    assert.equal(await planActual(page), m2, 'the Reflection shows the Overview numbers');

    // looking at month 2 stores nothing; changing its rent gives it its own plan
    await tab(page, 1);
    assert.match(await page.locator('.fa-plan-note').innerText(), new RegExp(T.carried));
    assert.equal((await storedMonths(page)).length, 1);
    const rentCard = page.locator('.fa-card', { has: page.locator('.fa-cat-head') }).nth(0);
    await rentCard.locator('.fa-cat-head').click();
    const rent = rentCard.locator('.fa-item-amt input').first();
    await rent.click(); await rent.fill('13000'); await rent.press('Enter');
    assert.equal((await storedMonths(page)).length, 2);
    await tab(page, 0);
    assert.ok((await planActual(page)).includes(T.spent(money(lang, 0), money(lang, 13000))));

    // a goal deposit counts as put aside in its month
    await tab(page, 2);
    await page.locator('.fa-goal-head').first().click();
    await page.locator('.fa-card input.fa-onb-input').fill('500');
    await page.getByRole('button', { name: TEXT[lang].deposit }).click();
    await tab(page, 0);
    assert.ok((await planActual(page)).includes(T.saved(money(lang, 500), money(lang, 0))));

    // month 1 keeps its own plan
    await pickMonth(page, [new Date().getFullYear(), new Date().getMonth() + 1]);
    const back = await planActual(page);
    assert.ok(back.includes(T.spent(money(lang, 0), money(lang, 12000))) && back.includes(T.spent(money(lang, 450), money(lang, 4500))), back);

    assert.deepEqual(problems, []);
    await context.close();
  });
}

// ── the first minute: from opening the app to a plan in at most eight actions ──
const FIRST = {
  en: { url: '', offer: 'Put 50 / 30 / 20 into the plan', toast: 'In the plan: 50 / 30 / 20', item: 'Not split yet', none: 'no plan yet', onPlan: 'on plan' },
  cs: { url: '?lang=cs', offer: 'Zapsat 50 / 30 / 20 do plánu', toast: 'V plánu: 50 / 30 / 20', item: 'Zatím vcelku', none: 'zatím bez plánu', onPlan: 'v plánu' },
};
// elements of the screen that reach past its right edge
const overflowing = page => page.evaluate(() => {
  const w = document.documentElement.clientWidth;
  return [...document.querySelectorAll('.fa-screen *, .fa-toast')].filter(e => e.getBoundingClientRect().right > w + 0.5).map(e => e.className || e.tagName);
});

for (const lang of ['en', 'cs']) {
  test(`a first plan in at most eight actions, 360 px wide (${lang})`, async () => {
    const T = FIRST[lang];
    const { context, page, problems } = await phone(360);
    let actions = 0;
    const act = async step => { actions += 1; await step(); };
    // English opens by default; a Czech link (as a workshop would share it) opens in Czech
    await page.goto(base + T.url);
    const next = page.locator('.fa-onb .fa-cta');
    await act(() => next.click());                                        // welcome
    await act(() => next.click());                                        // no name
    await act(() => page.locator('.fa-onb-input').fill('32 333'));
    await act(() => next.click());
    await act(() => next.click());                                        // 50 / 30 / 20
    await act(() => page.locator('.fa-onb .fa-textbtn').click());         // a goal later
    await act(() => next.click());                                        // theme → finish

    // the empty plan says what to do next, and offers the split in one tap
    const card = page.locator('.fa-screen .fa-card').first();
    assert.ok((await card.innerText()).includes(T.none));
    assert.deepEqual(await overflowing(page), []);
    await act(() => page.getByRole('button', { name: T.offer }).click());
    assert.ok(actions <= 8, `${actions} actions`);

    // a full plan: each part holds its share, the three add up to the income
    assert.ok((await card.innerText()).includes(T.onPlan));
    assert.equal(await page.locator('.fa-toast span').innerText(), T.toast);
    const overview = await page.locator('.fa-screen').innerText();
    for (const n of [16166, 9700, 6467]) assert.ok(overview.includes(`${money(lang, n)} ${lang === 'cs' ? 'z' : 'of'} ${money(lang, n)}`), `${money(lang, n)} planned`);
    assert.deepEqual(await overflowing(page), []);

    // Undo leaves the plan empty again and brings the offer back
    await page.locator('.fa-toast button').click();
    assert.ok((await card.innerText()).includes(T.none));
    assert.equal(await page.getByRole('button', { name: T.offer }).count(), 1);

    // the Plan screen offers the same; each part is one item, to split later
    await tab(page, 1);
    await page.getByRole('button', { name: T.offer }).click();
    assert.equal(await page.getByRole('button', { name: T.offer }).count(), 0);
    const need = page.locator('.fa-card', { has: page.locator('.fa-cat-head') }).nth(0);
    await need.locator('.fa-cat-head').click();
    assert.equal(await need.locator('.fa-item').count(), 1);
    assert.equal(await need.locator('.fa-item span span').first().innerText(), T.item);
    assert.deepEqual(await overflowing(page), []);
    const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('fa.plans')));
    const items = Object.values(stored)[0].items;
    assert.deepEqual(['nutne', 'radost', 'budouci'].map(k => items[k].map(x => [x.amount, x.recurring])), [[[16166, true]], [[9700, true]], [[6467, true]]]);

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

for (const lang of ['en', 'cs']) {
  test(`Undo brings back a deleted expense, by mouse and by keyboard (${lang})`, async () => {
    const { context, page, problems } = await phone();
    const t = TEXT[lang];
    const expenses = [['Bakery', 85, 'radost'], ['Bike repair', 640, 'nutne'], ['Jazz night', 350, 'radost']]
      .map(([name, amount, cat], i) => ({ name, amount, cat, ts: 1000 + i, day: today() }));
    await page.addInitScript(([list, lang]) => {
      if (sessionStorage.getItem('seeded')) return;
      localStorage.setItem('fa.profile', JSON.stringify({ name: 'Jana', income: 32000 }));
      localStorage.setItem('fa.plan.income', JSON.stringify([{ name: 'Hlavní příjem', amount: 32000 }]));
      localStorage.setItem('fa.expenses', JSON.stringify(list));
      localStorage.setItem('fa.lang', lang);
      sessionStorage.setItem('seeded', '1');
    }, [expenses, lang]);
    await page.goto(base);
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('fa.expenses')));
    const toast = page.locator('[role="status"] .fa-toast');   // inside a polite live region
    const del = name => page.getByRole('button', { name: `${t.del} – ${name}` });
    const focused = page => page.evaluate(() => document.activeElement.getAttribute('aria-label') || document.activeElement.textContent);

    // by mouse: the message names the expense, Undo restores it exactly
    await del('Bike repair').click();
    assert.ok((await toast.innerText()).includes(`${t.deleted}: Bike repair · −${money(lang, 640)}`), await toast.innerText());
    assert.deepEqual((await stored()).map(e => e.name), ['Bakery', 'Jazz night']);
    await toast.getByRole('button', { name: t.undo }).click();
    assert.deepEqual(await stored(), expenses);
    assert.equal(await toast.count(), 0);

    // by keyboard: Enter deletes and lands on Undo, Enter there restores and returns to the row
    await del('Jazz night').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(undo => document.activeElement.textContent === undo, t.undo);
    assert.deepEqual((await stored()).map(e => e.name), ['Bakery', 'Bike repair']);
    await page.keyboard.press('Enter');
    await page.waitForFunction(label => document.activeElement.getAttribute('aria-label') === label, `${t.del} – Jazz night`);
    assert.deepEqual(await stored(), expenses);
    assert.equal(await focused(page), `${t.del} – Jazz night`);
    assert.deepEqual(problems, []);
    await context.close();
  });
}

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
  await page.evaluate(day => {
    localStorage.setItem('fa.profile', JSON.stringify({ name: 'Jana', income: 32000 }));
    localStorage.setItem('fa.plan.income', JSON.stringify([{ name: 'Hlavní příjem', amount: 32000 }]));
    localStorage.setItem('fa.goals', JSON.stringify([{ id: 1, name: 'Nouzová rezerva', target: 48000, saved: 5000, kind: 'rezerva' }]));
    localStorage.setItem('fa.expenses', JSON.stringify([{ name: 'Káva', amount: 95, cat: 'radost', ts: 1, day }]));
  }, today());
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

// The welcome screen is drawn before the costly part of the backdrop (its blurred light
// and grain join once the page has loaded), and its heading has a font of its own, so
// the whole serif family arrives with the first step that shows more of it.
test('the welcome screen comes first: blurred backdrop after the load, the serif family with the income step', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const fonts = [];
  page.on('request', r => { if (r.url().includes('/fonts/')) fonts.push(r.url().split('/fonts/')[1]); });
  await page.goto(base);
  await page.locator('.fa-onb-h').waitFor();
  assert.equal(await page.locator('.fa-ambient-in').count(), 0);
  await page.waitForFunction(() => document.querySelectorAll('.fa-ambient-in').length >= 3, null, { timeout: 5000 });
  assert.deepEqual(fonts.filter(f => f.startsWith('newsreader')), ['newsreader-heading-latin.woff2']);

  const next = page.locator('.fa-onb .fa-cta');
  await next.click();                                           // welcome → name
  await next.click();                                           // name → income
  await page.locator('.fa-onb-money').waitFor();
  await page.waitForFunction(() => document.fonts.check('18px Newsreader', '0'));
  assert.ok(fonts.includes('newsreader-normal-latin-v2.woff2'), fonts.join(', '));
  await context.close();
});
