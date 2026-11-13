// The Czech share picture (og-cs.jpg) for the Czech address (/cs/): og.jpg with
// its text set in Czech, in the app's own fonts. The tree and the background
// stay those of og.jpg; only the text side is painted over and written again.
// Run after changing og.jpg or the wording: node scripts/og-cs.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
// the app's own font files, declared as index.html declares them
const fonts = (index.match(/@font-face \{ font-family: '(Newsreader Heading|Newsreader|Hanken Grotesk)'[^}]*\}/g) || []).join('\n');

const html = `<!doctype html><html lang="cs"><head><meta charset="utf-8"><style>
${fonts}
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; background: #0B0F22 url(og.jpg) 0 0 / 1200px 630px no-repeat; }
/* the text side of og.jpg, painted over with its own gradient */
.side { position: absolute; left: 520px; top: 0; width: 680px; height: 630px;
  background: linear-gradient(90deg, rgb(15,21,45) 0%, rgb(13,19,41) 26%, rgb(12,17,36) 56%, rgb(12,15,34) 85%, rgb(11,14,31) 100%); }
.t { position: absolute; left: 541px; margin: 0; white-space: nowrap; }
h1 { top: 144px; font: 500 80px/80px 'Newsreader Heading', serif; letter-spacing: -0.01em; color: rgb(240,232,218); }
.en { top: 323px; font: italic 500 35px/40px 'Newsreader', serif; color: rgb(216,197,143); }
p { top: 400px; font: 400 25px/40px 'Hanken Grotesk', sans-serif; color: rgb(208,208,208); }
</style></head><body>
<div class="side"></div>
<h1 class="t">Vědomé<br>utrácení</h1>
<div class="t en">Mindful Spending</div>
<p class="t">Klidný plán peněz 50/30/20. Bez účtu –<br>tvoje data zůstávají v prohlížeči.</p>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(root, 'og.jpg')).href.replace(/og\.jpg$/, ''));
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(root, 'og-cs.jpg'), type: 'jpeg', quality: 90 });
await browser.close();
console.log('og-cs.jpg written');
