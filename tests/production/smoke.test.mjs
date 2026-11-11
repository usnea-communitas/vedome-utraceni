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

  // the rest of what the service worker caches for offline use, as sw.js lists it
  const sw = await (await get('/sw.js')).text();
  const react = sw.match(/const REACT = '([^']+)'/)[1];
  const core = sw.match(/const CORE = \[([^\]]+)\]/)[1].match(/'[^']*'(?: \+ (?:BUILD|REACT))?/g)
    .map(item => item.replace(/^'\.\/?/, '/').replace(/' \+ BUILD$/, build).replace(/' \+ REACT$/, react).replace(/'$/, ''));
  assert.ok(core.length >= 8, `CORE lists ${core.length} files`);
  // (each answer is read to the end, so no download is left open after the test)
  const ok = async path => { const res = await get(path); await res.arrayBuffer(); assert.equal(res.status, 200, `GET ${path}`); };
  for (const path of ['/sw.js', ...core]) await ok(path);
  // and every icon of the manifest
  for (const icon of (await (await get('/manifest.webmanifest')).json()).icons) await ok('/' + icon.src);
});

test('security headers, fonts, icons and the share preview are in place', async () => {
  const res = await get('/');
  const h = name => res.headers.get(name) || '';
  assert.equal(h('x-content-type-options'), 'nosniff');
  assert.equal(h('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal(h('x-frame-options'), 'SAMEORIGIN');
  assert.match(h('permissions-policy'), /camera=\(\)/);
  assert.match(h('content-security-policy'), /frame-ancestors 'self'/);
  const html = await res.text();
  assert.match(html, /http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self';/, 'CSP without inline scripts');
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/, 'no Google Fonts');
  const og = html.match(/property="og:image" content="([^"]+)"/)[1];
  assert.match(og, /^https:\/\//, 'og:image is an absolute address');
  const image = await fetch(og);
  assert.equal(image.status, 200, `GET ${og}`);
  assert.match(image.headers.get('content-type') || '', /image\/jpeg/);
  // the icons the page names (favicon, home-screen icon)
  const icons = [...html.matchAll(/<link rel="(?:icon|apple-touch-icon)" href="([^"]+)"/g)].map(m => '/' + m[1]);
  assert.ok(icons.length >= 2, `${icons.length} icons`);
  for (const path of [...icons, '/robots.txt', '/sitemap.xml']) {
    const res = await get(path); await res.arrayBuffer();
    assert.equal(res.status, 200, `GET ${path}`);
  }
  // every font the page names exists and is cached for a year
  const fonts = [...new Set([...html.matchAll(/url\((fonts\/[^)]+\.woff2)\)/g)].map(m => '/' + m[1]))];
  assert.ok(fonts.length >= 10, `${fonts.length} fonts`);
  for (const path of fonts) {
    const font = await get(path); await font.arrayBuffer();
    assert.equal(font.status, 200, `GET ${path}`);
    assert.match(font.headers.get('cache-control') || '', /immutable/, `${path} is cached for a year`);
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
  page.on('request', r => { if (new URL(r.url()).origin !== site.origin) problems.push('request outside the site: ' + r.url()); });

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
