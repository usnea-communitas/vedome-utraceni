// Data that does not disappear, in Chromium (Playwright): the backup reminder on
// the Overview, two tabs of the app, a write the browser refuses, and damaged
// data that a backup brings back. Run: npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { launchBrowser } from '../harness.mjs';
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
  browser = await launchBrowser();
});
after(async () => { await browser?.close(); server?.close(); });

const DAY = 24 * 60 * 60 * 1000;
const thisMonth = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
// someone who finished the onboarding `ago` days ago
const person = (ago, lang, extra = {}) => ({
  'fa.profile': JSON.stringify({ name: 'Ema', income: 30000, created: Date.now() - ago * DAY }),
  'fa.plans': JSON.stringify({ [thisMonth()]: { income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }], items: { nutne: [{ name: 'Nájem', amount: 12000, recurring: true }], budouci: [], radost: [] } } }),
  'fa.expenses': '[]', 'fa.goals': '[]', 'fa.lang': lang, ...extra,
});

// a phone-sized page whose storage starts as `storage` (once, not on every reload)
async function phone(storage, { width = 360, context: shared, ...extra } = {}) {
  const context = shared || await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', acceptDownloads: true, ...extra });
  const problems = [];
  if (!shared) {
    await context.route(url => !url.href.startsWith(base), r => { problems.push('external request: ' + r.request().url()); return r.abort(); });
    if (storage) await context.addInitScript(s => {
      if (sessionStorage.getItem('fa.test.seeded')) return;
      for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
      sessionStorage.setItem('fa.test.seeded', '1');
    }, storage);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  return { context, page, problems };
}
const stored = (page, key) => page.evaluate(k => localStorage.getItem(k), key);
const sideways = page => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

const TEXT = {
  en: { never: 'No backup yet', days: n => `Last backup ${n} days ago`, save: 'Back up', hide: 'Hide the backup reminder', more: 4, remind: 'Remind me to back up', saved: 'The backup has downloaded' },
  cs: { never: 'Zatím nemáš zálohu', days: n => `Naposledy zálohováno před ${n} dny`, save: 'Zálohovat', hide: 'Skrýt připomínku zálohy', more: 4, remind: 'Připomínat zálohu', saved: 'Záloha se stáhla' },
};

for (const lang of ['en', 'cs']) {
  test(`the backup reminder comes two days in, a backup sends it away, and it can be hidden or turned off, 360 px (${lang})`, async () => {
    const T = TEXT[lang];
    const { context, page, problems } = await phone(person(3, lang));
    await page.goto(base);
    const card = page.locator('.fa-remind');
    await card.waitFor();
    assert.match(await card.innerText(), new RegExp(T.never));
    assert.equal(await sideways(page), 0);
    // a backup from the reminder downloads the file and the reminder leaves
    const [file] = await Promise.all([page.waitForEvent('download'), card.getByRole('button', { name: T.save }).click()]);
    assert.match(file.suggestedFilename(), /^vedome-utraceni-zaloha-\d{4}-\d{2}-\d{2}\.json$/);
    await card.waitFor({ state: 'detached' });
    assert.match(await page.locator('.fa-remind-msg').innerText(), new RegExp(T.saved));
    assert.ok(!isNaN(Date.parse(await stored(page, 'fa.backup.last'))));
    await page.reload();
    await page.locator('.fa-screen').first().waitFor();
    assert.equal(await card.count(), 0, 'no reminder right after a backup');

    // 40 days later it comes back; hiding it keeps it away
    await page.evaluate(d => localStorage.setItem('fa.backup.last', new Date(Date.now() - d).toISOString()), 40 * DAY);
    await page.reload();
    await card.waitFor();
    assert.match(await card.innerText(), new RegExp(T.days(40)));
    await card.getByRole('button', { name: T.hide }).click();
    await card.waitFor({ state: 'detached' });
    await page.reload();
    await page.locator('.fa-screen').first().waitFor();
    assert.equal(await card.count(), 0, 'hidden for 14 days');

    // turned off in More → Data, it stays away even when due
    await page.evaluate(() => localStorage.removeItem('fa.backup.reminder'));
    await page.locator('.fa-nav .fa-tab').nth(5).click();
    const sw = page.getByRole('switch', { name: T.remind });
    assert.equal(await sw.getAttribute('aria-checked'), 'true');
    await sw.click();
    assert.equal(await sw.getAttribute('aria-checked'), 'false');
    await page.locator('.fa-nav .fa-tab').nth(0).click();
    await page.locator('.fa-screen').first().waitFor();
    assert.equal(await card.count(), 0, 'turned off');
    assert.deepEqual(problems, []);
    await context.close();
  });
}

test('the reminder and the data page pass axe, in both themes', async () => {
  const axePath = require.resolve('axe-core/axe.min.js');
  for (const theme of ['lesní', 'kouzelnický']) {
    const { context, page, problems } = await phone(person(3, 'cs', { 'fa.theme': theme }), { width: 390, bypassCSP: true });
    await page.goto(base);
    await page.locator('.fa-remind').waitFor();
    await page.addScriptTag({ path: axePath });
    const run = () => page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }))
      .then(r => r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`));
    assert.deepEqual(await run(), [], theme + ': overview with the reminder');
    await page.locator('.fa-nav .fa-tab').nth(5).click();
    await page.getByRole('button', { name: /Jak chráníme tvoje data/ }).click();
    await page.locator('.fa-safe-facts').waitFor();
    assert.match(await page.locator('.fa-safe-facts').innerText(), /Smazání[\s\S]+Trvalé uložení[\s\S]+Safari/);
    assert.deepEqual(await run(), [], theme + ': how we protect your data');
    assert.deepEqual(problems, []);
    await context.close();
  }
});

test('two tabs of the app keep each other\'s changes', async () => {
  const { context, page: a, problems } = await phone(person(3, 'en'));
  await a.goto(base);
  await a.locator('.fa-fab').waitFor();
  const { page: b } = await phone(null, { context });
  await b.goto(base);
  await b.locator('.fa-fab').waitFor();
  const add = async (page, name, amount) => {
    await page.locator('.fa-fab').click();
    await page.locator('.fa-amount').fill(String(amount));
    await page.locator('.fa-sheet input.fa-field[type=text]').fill(name);
    await page.locator('.fa-catpick button').nth(1).click();
    await page.locator('.fa-sheet .fa-cta').click();
  };
  await add(a, 'Coffee', 80);
  // the other tab hears about it and shows it
  await b.waitForFunction(() => document.querySelector('.fa-screen').innerText.includes('Coffee'));
  await add(b, 'Cinema', 250);
  await a.waitForFunction(() => document.querySelector('.fa-screen').innerText.includes('Cinema'));
  const names = JSON.parse(await stored(a, 'fa.expenses')).map(e => e.name);
  assert.deepEqual(names, ['Coffee', 'Cinema'], 'neither tab wrote over the other');
  assert.deepEqual(problems, []);
  await context.close();
});

test('a write the browser refuses is said out loud, and a backup is offered', async () => {
  const { context, page, problems } = await phone(person(3, 'cs'), { width: 390 });
  await context.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (window.__refuse && k === 'fa.expenses') { const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; throw e; }
      return set.call(this, k, v);
    };
  });
  await page.goto(base);
  await page.locator('.fa-fab').waitFor();
  await page.evaluate(() => { window.__refuse = true; });
  await page.locator('.fa-fab').click();
  await page.locator('.fa-amount').fill('80');
  await page.locator('.fa-sheet input.fa-field[type=text]').fill('Káva');
  await page.locator('.fa-catpick button').nth(1).click();
  await page.locator('.fa-sheet .fa-cta').click();
  const alert = page.locator('.fa-alert[role=alert]');
  await alert.waitFor();
  assert.match(await alert.innerText(), /Poslední změnu se nepodařilo uložit/);
  const [file] = await Promise.all([page.waitForEvent('download'), alert.getByRole('button', { name: 'Zálohovat data do souboru' }).click()]);
  assert.match(file.suggestedFilename(), /^vedome-utraceni-zaloha-/);
  await alert.getByRole('button', { name: 'Zavřít' }).click();
  await alert.waitFor({ state: 'detached' });
  assert.equal(await sideways(page), 0);
  assert.deepEqual(problems, []);
  await context.close();
});

test('damaged data shows a calm page that brings a backup back, with or without a password', async () => {
  // a good backup, made the way the app makes it
  const good = await phone(person(3, 'en'));
  await good.page.goto(base);
  await good.page.locator('.fa-fab').waitFor();
  const plainBackup = await good.page.evaluate(() => faExportData());
  const lockedBackup = await good.page.evaluate(() => faExportEncrypted('correct horse 7'));
  await good.context.close();

  for (const [file, password] of [[plainBackup, null], [lockedBackup, 'correct horse 7']]) {
    const { context, page, problems } = await phone(person(3, 'en', { 'fa.goals': '[null]' }));
    await page.goto(base);
    const card = page.locator('.fa-crash-card');
    await card.waitFor();
    assert.equal(await card.getByRole('heading', { level: 1 }).innerText(), 'Something went wrong');
    await card.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(file) });
    if (password) {
      await card.getByLabel('Backup password').fill('wrong password 1');
      await card.getByRole('button', { name: 'Restore data' }).click();
      await card.getByText('Wrong password. Your data has not changed.').waitFor();
      assert.equal(await stored(page, 'fa.goals'), '[null]', 'a wrong password changes nothing');
      await card.getByLabel('Backup password').fill(password);
      await card.getByRole('button', { name: 'Restore data' }).click();
    }
    await page.waitForEvent('load');
    await page.locator('.fa-fab').waitFor();
    assert.equal(await page.locator('.fa-crash-card').count(), 0, 'the app is back');
    assert.equal(await stored(page, 'fa.goals'), '[]');
    // errors before the restore were the damaged data itself
    assert.ok(problems.every(p => /could not render|null|reading/.test(p)), problems.join('\n'));
    await context.close();
  }
});
