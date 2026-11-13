// The Czech address (/cs/) in Chromium (Playwright): it opens in Czech and
// remembers it for /, ?lang= and workshop links still work there, and every
// file loads from the site's own addresses. Run: npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { root } from '../harness.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
let server, base, browser;
const missing = [];

before(async () => {
  // like the host: a folder's address serves its index.html
  server = http.createServer(async (req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    if (path === '' || path.endsWith('/')) path += 'index.html';
    try {
      const body = await readFile(join(root, path));
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch { missing.push(path); res.writeHead(404); res.end(); }
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

async function phone() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const problems = [];
  await context.route(url => !url.href.startsWith(base), r => { problems.push('external request: ' + r.request().url()); return r.abort(); });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  return { context, page, problems };
}
const title = page => page.locator('h1').innerText().then(t => t.replace(/\s/g, ' '));

test('the Czech address opens in Czech, remembers it, and loads everything from the site', async () => {
  const { context, page, problems } = await phone();
  missing.length = 0;
  await page.goto(base + 'cs/');
  assert.equal(await title(page), 'Vítej ve Vědomém utrácení');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'cs');
  assert.equal(await page.evaluate(() => localStorage.getItem('fa.lang')), 'cs');
  // the fonts came through the base address too
  assert.ok(await page.evaluate(() => document.fonts.check('16px "Hanken Grotesk"')));
  // the demo stays on the Czech address
  assert.equal(await page.getByRole('link', { name: 'Prohlédnout si ukázku' }).getAttribute('href'), '/cs/?workshop=1&demo=1&lang=cs');
  // the same storage: / now opens in Czech as well
  await page.goto(base);
  assert.equal(await title(page), 'Vítej ve Vědomém utrácení');
  assert.deepEqual(missing, []);
  assert.deepEqual(problems, []);
  await context.close();
});

test('on the Czech address, ?lang= and a workshop link work as at /', async () => {
  const { context, page, problems } = await phone();
  await page.goto(base + 'cs/?lang=en');
  assert.equal(await title(page), 'Welcome to Mindful Spending');
  assert.equal(new URL(page.url()).pathname, '/cs/');
  const fresh = await phone();
  await fresh.page.goto(base + 'cs/?workshop=1');
  assert.equal(await title(fresh.page), 'Workshop Vědomého utrácení');
  assert.deepEqual(problems, []);
  assert.deepEqual(fresh.problems, []);
  await context.close();
  await fresh.context.close();
});
