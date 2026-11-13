// Accessibility on every screen, in Chromium (Playwright) with axe (WCAG 2.1 A and AA):
// the onboarding, the six tabs and every sheet, in both themes, in English and
// Czech. Run: npm run test:e2e (first time: npx playwright install chromium)
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
const axePath = require.resolve('axe-core/axe.min.js');
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

// What cannot be fixed, with the reason; empty means every screen has to pass.
const EXCEPTIONS = [];

const DAY = 24 * 60 * 60 * 1000;
const thisMonth = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
// someone who uses the app: a plan, spending, a goal and a recent backup
const person = (lang, theme) => ({
  'fa.profile': JSON.stringify({ name: 'Ema', income: 30000, created: Date.now() - 40 * DAY }),
  'fa.plans': JSON.stringify({ [thisMonth()]: { income: [{ name: 'Hlavní příjem', amount: 30000, recurring: true }], items: { nutne: [{ name: 'Nájem', amount: 12000, recurring: true }], budouci: [{ name: 'Spoření', amount: 4000, recurring: true }], radost: [{ name: 'Kino', amount: 800, recurring: false }] } } }),
  'fa.expenses': JSON.stringify([{ name: 'Káva', amount: 95, cat: 'radost', ts: 1, day: thisMonth() + '-01' }, { name: 'Nákup', amount: 1240, cat: 'nutne', ts: 2, day: thisMonth() + '-02' }]),
  'fa.goals': JSON.stringify([{ id: 1, name: 'Nouzová rezerva', target: 48000, saved: 5000, kind: 'rezerva' }]),
  'fa.backup.last': new Date().toISOString(),
  'fa.lang': lang, 'fa.theme': theme,
});

async function phone(storage) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', bypassCSP: true, acceptDownloads: true });
  const problems = [];
  await context.route(url => !url.href.startsWith(base), r => { problems.push('external request: ' + r.request().url()); return r.abort(); });
  await context.addInitScript(s => {
    if (sessionStorage.getItem('fa.test.seeded')) return;
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    sessionStorage.setItem('fa.test.seeded', '1');
  }, storage);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  return { context, page, problems };
}

async function axe(page, where, found) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
  for (const v of result.violations)
    for (const n of v.nodes) {
      const line = `${where}: ${v.id} ${n.target.join(' ')}`;
      if (!EXCEPTIONS.some(e => line.includes(e.match))) found.push(line);
    }
}

const SHEETS = {
  en: { income: 'Monthly income', security: 'Security', reminders: 'Gentle reminders', home: 'Add to home screen', safety: 'How we protect your data', pwbackup: 'Back up with a password' },
  cs: { income: 'Měsíční příjem', security: 'Zabezpečení', reminders: 'Jemné připomínky', home: 'Na plochu telefonu', safety: 'Jak chráníme tvoje data', pwbackup: 'Zálohovat s heslem' },
};

for (const lang of ['en', 'cs']) {
  for (const theme of ['lesní', 'kouzelnický']) {
    test(`every screen and sheet passes axe (${lang}, ${theme})`, async () => {
      const found = [];
      // the onboarding, step by step
      {
        const { context, page, problems } = await phone({ 'fa.lang': lang, 'fa.theme': theme });
        await page.goto(base);
        await page.locator('.fa-onb-card').waitFor();
        for (let step = 0; step < 8 && await page.locator('.fa-onb-card').count(); step += 1) {
          await axe(page, `onboarding ${step}`, found);
          const number = page.locator('.fa-onb-card input[inputmode="numeric"], .fa-onb-card input[inputmode="decimal"], .fa-onb-card input[type="number"]');
          if (await number.count()) await number.first().fill('30000');
          // the goal step continues by skipping it
          const cta = page.locator('.fa-onb-card .fa-cta-solid');
          if (await cta.isDisabled()) await page.locator('.fa-onb-card button.fa-textbtn').last().click();
          else await cta.click();
          await page.waitForTimeout(150);
        }
        assert.deepEqual(problems, []);
        await context.close();
      }
      // the six tabs and every sheet
      const { context, page, problems } = await phone(person(lang, theme));
      await page.goto(base);
      await page.locator('.fa-fab').waitFor();
      const tabs = page.locator('.fa-nav .fa-tab');
      for (let i = 0; i < 6; i += 1) {
        await tabs.nth(i).click();
        await page.waitForTimeout(150);
        await axe(page, `tab ${i}`, found);
      }
      const closeSheet = async () => { await page.keyboard.press('Escape'); await page.locator('.fa-sheet').waitFor({ state: 'detached' }); };
      // adding an expense
      await page.locator('.fa-fab').click();
      await page.locator('.fa-sheet').waitFor();
      await axe(page, 'sheet: add expense', found);
      await closeSheet();
      // the sheets under More
      await tabs.nth(5).click();
      for (const [key, label] of Object.entries(SHEETS[lang])) {
        await page.getByText(label, { exact: true }).first().click();
        await page.locator('.fa-sheet').waitFor();
        await page.waitForTimeout(150);
        await axe(page, `sheet: ${key}`, found);
        await closeSheet();
      }
      // restoring a backup with a password
      const locked = await page.evaluate(() => faExportEncrypted('correct horse 7'));
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(locked) });
      await page.locator('.fa-sheet').waitFor();
      await axe(page, 'sheet: restore with a password', found);
      await closeSheet();
      assert.deepEqual(found, []);
      assert.deepEqual(problems, []);
      await context.close();
    });
  }
}
