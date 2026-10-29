// Production smoke test: is the live site serving this build, and does it start?
// Run after a deployment (.github/workflows/production-smoke.yml) or by hand on the
// commit that is deployed: npm run test:production
// PROD_URL overrides the address; EXPECT_BUILD the app.js hash to wait for
// (by default the one stamped into the checked-out index.html).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { root } from '../harness.mjs';

const site = new URL(process.env.PROD_URL || 'https://vedome-utraceni.vercel.app/');
const build = process.env.EXPECT_BUILD || readFileSync(join(root, 'index.html'), 'utf8').match(/app\.js\?v=([0-9a-f]+)/)[1];
const sleep = ms => new Promise(r => setTimeout(r, ms));

// one retry on a network error or a 5xx answer
async function get(path) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(new URL(path, site), { headers: { 'cache-control': 'no-cache' } });
      if (res.status < 500 || attempt === 2) return res;
    } catch (e) { if (attempt === 2) throw e; }
    await sleep(5000);
  }
}

let browser;
after(() => browser?.close());

test(`${site.host} serves build ${build}`, async () => {
  // the domain can take a moment to point at a new deployment
  let html = '';
  for (let waited = 0; ; waited += 5000) {
    const res = await get('/');
    assert.equal(res.status, 200, 'GET /');
    html = await res.text();
    if (html.includes(`app.js?v=${build}`) || waited >= 60000) break;
    await sleep(5000);
  }
  const served = (html.match(/app\.js\?v=([0-9a-f]+)/) || [])[1];
  assert.equal(served, build, 'index.html loads this build of app.js');

  const app = await get(`/app.js?v=${build}`);
  assert.equal(app.status, 200, 'GET app.js');
  assert.match(app.headers.get('content-type') || '', /javascript/);
  const code = Buffer.from(await app.arrayBuffer());
  assert.equal(createHash('sha256').update(code).digest('hex').slice(0, 10), build, 'app.js content matches its hash');

  // the rest of what the service worker caches for offline use
  const sw = await (await get('/sw.js')).text();
  const react = sw.match(/const REACT = '([^']+)'/)[1];
  for (const path of ['/sw.js', '/manifest.webmanifest', '/icon.png',
    `/vendor/react.production.min.js?v=${react}`, `/vendor/react-dom.production.min.js?v=${react}`]) {
    assert.equal((await get(path)).status, 200, `GET ${path}`);
  }
});

test('the app starts and onboarding reaches the overview, with no console errors', async () => {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const problems = [];
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });

  await page.goto(site.href, { waitUntil: 'load' });
  assert.ok((await page.locator('.fa-onb-h').innerText()).trim(), 'the welcome screen');
  const next = page.locator('.fa-onb .fa-cta');
  await next.click(); await next.click();                       // welcome, name (optional)
  await page.locator('.fa-onb-input').fill('32 000'); await next.click();
  await next.click();                                           // 50 / 30 / 20
  await page.locator('.fa-onb .fa-textbtn').click();            // skip the first goal
  await next.click();                                           // theme → finish
  assert.equal(await page.locator('h1.fa-title').innerText(), 'Overview');
  assert.match(await page.locator('.fa-screen').innerText(), /32,000\u00a0Kč/);

  // on https the service worker installs: every file it caches was found
  const sw = await page.evaluate(() => Promise.race([
    navigator.serviceWorker.ready.then(r => r.active ? r.active.state : 'none'),
    new Promise(r => setTimeout(() => r('timeout'), 10000)),
  ]));
  assert.ok(['activating', 'activated'].includes(sw), `service worker: ${sw}`);
  assert.deepEqual(problems, []);
  await context.close();
});
