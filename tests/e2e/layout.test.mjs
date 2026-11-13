// Every language at every width (S-18): the lock screen, the onboarding, the six
// tabs and every sheet, in the five languages, at 320, 360, 390 and 430 px and in
// the phone frame on a laptop, in both themes. A text that runs past its box,
// is cut off by it or leaves the screen is a failure.
// Run: npm run test:layout (first time: npx playwright install chromium)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { launchBrowser, loadApp, inApp, plain, root } from '../harness.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
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

// LAYOUT_LANGS=uk,pl and LAYOUT_WIDTHS=320,laptop narrow the run
const pick = (all, env) => (env ? all.filter(v => env.split(',').includes(String(v.key ?? v))) : all);
const LANGS = pick(['cs', 'en', 'pl', 'uk', 'es'], process.env.LAYOUT_LANGS);
const WIDTHS = pick([
  { key: 320, viewport: { width: 320, height: 640 }, phone: true },
  { key: 360, viewport: { width: 360, height: 740 }, phone: true },
  { key: 390, viewport: { width: 390, height: 844 }, phone: true },
  { key: 430, viewport: { width: 430, height: 932 }, phone: true },
  { key: 'laptop', viewport: { width: 1280, height: 800 }, phone: false },
], process.env.LAYOUT_WIDTHS);
const THEMES = ['lesní', 'kouzelnický'];

// what the person typed (names of spending, goals and the profile) may end in an
// ellipsis in a one-line list; the app's own words may not
const THEIR_WORDS = ['Maximiliána', 'Velký nákup na celý týden', 'Dovolená u moře s rodinou', 'Káva s kamarádkou', 'Měsíční jízdenka', 'Nájem a zálohy na energie', 'Jídlo a drogerie', 'Spoření na nouzovou rezervu', 'Pravidelná investice do ETF', 'Kino a koncerty', 'Doučování angličtiny'];

// labels of the More rows in each language, from the app's own dictionary
const S = plain(inApp(loadApp(), 'S'));
const say = (cs, lang) => (lang === 'cs' ? cs : S[cs][lang]);
const SHEETS = ['Měsíční příjem', 'Zabezpečení', 'Jemné připomínky', 'Na plochu telefonu', 'Jak chráníme tvoje data', 'Zálohovat s heslem'];

const DAY = 24 * 60 * 60 * 1000;
const thisMonth = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
// someone who uses the app, with longer names than most: a plan, spending, goals,
// a reflection, a backup and a PIN
const person = (lang, theme) => ({
  'fa.profile': JSON.stringify({ name: 'Maximiliána', income: 38500, created: Date.now() - 40 * DAY }),
  'fa.plans': JSON.stringify({ [thisMonth()]: {
    income: [{ name: 'Hlavní příjem', amount: 32000, recurring: true }, { name: 'Doučování angličtiny', amount: 6500, recurring: true }],
    items: {
      nutne: [{ name: 'Nájem a zálohy na energie', amount: 14500, recurring: true }, { name: 'Jídlo a drogerie', amount: 4800, recurring: true }],
      budouci: [{ name: 'Spoření na nouzovou rezervu', amount: 5000, recurring: true }, { name: 'Pravidelná investice do ETF', amount: 2700, recurring: true }],
      radost: [{ name: 'Kino a koncerty', amount: 1500, recurring: false }],
    },
  } }),
  'fa.expenses': JSON.stringify([
    { name: 'Káva s kamarádkou', amount: 95, cat: 'radost', ts: 1, day: thisMonth() + '-01' },
    { name: 'Velký nákup na celý týden', amount: 2240, cat: 'nutne', ts: 2, day: thisMonth() + '-02' },
    { name: 'Měsíční jízdenka', amount: 550, cat: 'nutne', ts: 3, day: thisMonth() + '-03' },
  ]),
  'fa.goals': JSON.stringify([
    { id: 1, name: 'Nouzová rezerva', target: 115500, saved: 23100, kind: 'rezerva' },
    { id: 2, name: 'Dovolená u moře s rodinou', target: 48000, saved: 12000, kind: 'zazitek' },
  ]),
  'fa.backup.last': new Date(Date.now() - 34 * DAY).toISOString(),
  'fa.security': JSON.stringify({ mode: 'pin', pin: '1357' }),
  'fa.lang': lang, 'fa.theme': theme,
});

// Text that runs past its box (or the button it is on), is cut off by it or
// leaves the screen. Text in a box that scrolls on purpose, hidden text for screen readers and decorative
// text the page hides from them do not count.
function overflowing() {
  const found = [];
  const seen = new Set();
  const visible = el => {
    for (let a = el; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      if (a.classList.contains('fa-sr') || a.getAttribute('aria-hidden') === 'true') return false;
    }
    return true;
  };
  const say = (el, why, px) => {
    const key = why + '|' + (el.textContent || '').trim().slice(0, 60);
    if (seen.has(key)) return;
    seen.add(key);
    // where it is: the element and its parent, by tag and class
    const tag = e => e ? e.tagName.toLowerCase() + [...e.classList].slice(0, 2).map(c => '.' + c).join('') : '';
    found.push({ text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70), why, px: Math.round(px), path: tag(el.parentElement) + ' > ' + tag(el) });
  };
  const screen = { left: 0, right: document.documentElement.clientWidth };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent.trim()) continue;
    const el = node.parentElement;
    if (!el || el.closest('script, style, title, option, svg') || !visible(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter(r => r.width > 0.5 && r.height > 0.5);
    if (!rects.length) continue;
    const style = getComputedStyle(el);
    // cut off by its own box (an ellipsis, or a box that hides what does not fit)
    if ((style.overflowX !== 'visible' || style.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) say(el, 'cut off', el.scrollWidth - el.clientWidth);
    // past the nearest box that clips it; a box that scrolls is meant to
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      const clipsX = s.overflowX === 'hidden' || s.overflowX === 'clip';
      const clipsY = s.overflowY === 'hidden' || s.overflowY === 'clip';
      if (s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') break;
      if (!clipsX && !clipsY) continue;
      const b = a.getBoundingClientRect();
      const past = Math.max(0, ...rects.map(r => Math.max(clipsX ? r.right - b.right : 0, clipsX ? b.left - r.left : 0, clipsY ? r.bottom - b.bottom : 0, clipsY ? b.top - r.top : 0)));
      if (past > 1.5) say(el, 'past its box', past);
      break;
    }
    // wider than the control it sits in (a button, a link, a tab), even where nothing clips it
    const control = el.closest('button, a, [role="button"], [role="tab"], label, select, summary');
    if (control) {
      const b = control.getBoundingClientRect();
      const past = Math.max(0, ...rects.map(r => Math.max(r.right - b.right, b.left - r.left)));
      if (past > 1.5) say(el, 'past its box', past);
    }
    // off the screen
    const off = Math.max(0, ...rects.map(r => Math.max(r.right - screen.right, screen.left - r.left)));
    if (off > 1.5) say(el, 'off the screen', off);
  }
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) found.push({ text: '(the page)', why: 'scrolls sideways', px: document.documentElement.scrollWidth - document.documentElement.clientWidth });
  return found;
}

async function open(width, storage) {
  const context = await browser.newContext({ viewport: width.viewport, isMobile: width.phone, hasTouch: width.phone, reducedMotion: 'reduce' });
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
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  return { context, page, problems };
}

// each text once per width, language and theme: the first screen it shows on
// (a screen stays behind the sheets opened from it)
async function look(page, at, where, found, reported) {
  await page.evaluate(() => document.fonts.ready);
  for (const item of await page.evaluate(overflowing)) {
    if (item.why === 'cut off' && THEIR_WORDS.some(w => item.text.startsWith(w))) continue;
    const key = `${at}|${item.text}|${item.why}`;
    if (reported.has(key)) continue;
    reported.add(key);
    found.push(`${at} ${where}: “${item.text}” ${item.why} (${item.px} px, ${item.path})`);
  }
}

for (const lang of LANGS) {
  for (const theme of THEMES) {
    test(`every screen fits at every width (${lang}, ${theme})`, async () => {
      const found = [];
      const reported = new Set();
      // the widths side by side, each in its own pages
      await Promise.all(WIDTHS.map(async width => {
        const at = `${width.key} ${lang} ${theme}`;
        // the onboarding, step by step
        {
          const { context, page, problems } = await open(width, { 'fa.lang': lang, 'fa.theme': theme });
          await page.locator('.fa-onb-card').waitFor();
          for (let step = 0; step < 8 && await page.locator('.fa-onb-card').count(); step += 1) {
            await look(page, at, `onboarding ${step}`, found, reported);
            const number = page.locator('.fa-onb-card input[inputmode="numeric"], .fa-onb-card input[inputmode="decimal"], .fa-onb-card input[type="number"]');
            if (await number.count()) await number.first().fill('38500');
            const cta = page.locator('.fa-onb-card .fa-cta-solid');
            if (await cta.isDisabled()) await page.locator('.fa-onb-card button.fa-textbtn').last().click();
            else await cta.click();
            await page.waitForTimeout(120);
          }
          assert.deepEqual(problems, [], at);
          await context.close();
        }
        // the lock screen, the six tabs and every sheet
        const { context, page, problems } = await open(width, person(lang, theme));
        await page.locator('.fa-pin-dots').first().waitFor();
        await look(page, at, `lock screen`, found, reported);
        await page.keyboard.type('1357');
        await page.locator('.fa-fab').waitFor();
        const tabs = page.locator('.fa-nav .fa-tab');
        for (let i = 0; i < 6; i += 1) {
          await tabs.nth(i).click();
          await page.waitForTimeout(120);
          await look(page, at, `tab ${i}`, found, reported);
        }
        const closeSheet = async () => { await page.keyboard.press('Escape'); await page.locator('.fa-sheet').waitFor({ state: 'detached' }); };
        await page.locator('.fa-fab').click();
        await page.locator('.fa-sheet').waitFor();
        await page.waitForTimeout(120);
        await look(page, at, `sheet: add expense`, found, reported);
        await closeSheet();
        await tabs.nth(5).click();
        for (const label of SHEETS) {
          await page.getByText(say(label, lang), { exact: true }).first().click();
          await page.locator('.fa-sheet').waitFor();
          await page.waitForTimeout(120);
          await look(page, at, `sheet: ${label}`, found, reported);
          await closeSheet();
        }
        const locked = await page.evaluate(() => faExportEncrypted('correct horse 7'));
        await page.locator('input[type="file"]').first().setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(locked) });
        await page.locator('.fa-sheet').waitFor();
        await page.waitForTimeout(120);
        await look(page, at, `sheet: restore with a password`, found, reported);
        await closeSheet();
        assert.deepEqual(problems, [], at);
        await context.close();
      }));
      assert.deepEqual(found.sort(), []);
    });
  }
}
