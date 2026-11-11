// scripts/workshop-pdf.mjs — makes the PDFs of the lesson kit in docs/workshop/.
//
// The Markdown files in docs/workshop/cs and docs/workshop/en are the source;
// the PDFs in docs/workshop/pdf are made from them with Chromium (Playwright,
// already a dev dependency for the browser tests) and committed, like app.js.
// Run it after changing the kit:
//
//   node scripts/workshop-pdf.mjs
//
// Three PDFs per language: the facilitator's guide (A4: both lesson plans,
// questions, common problems and the table against the Standard), the
// worksheets with the questionnaire (A4, one sheet per page, to print for the
// group) and the slides (16:9, one slide per page). The type is the app's own
// (Newsreader and Hanken Grotesk from fonts/), so nothing is fetched.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const KIT = path.join(ROOT, 'docs', 'workshop');
const OUT = path.join(KIT, 'pdf');
const REPO = 'https://github.com/usnea-communitas/vedome-utraceni/blob/main/docs/workshop/';

export const KITS = {
  cs: {
    lang: 'cs',
    page: 'strana',
    pdfs: [
      { file: 'vedome-utraceni-pro-lektory-cs.pdf', kind: 'guide', title: 'Vědomé utrácení · sada pro lektory',
        footer: 'Vědomé utrácení · sada pro lektory · CC BY-NC-SA 4.0 · © Martin Pazderník',
        parts: ['lekce-90-minut.md', 'lekce-45-minut.md', 'otazky-k-diskusi.md', 'caste-potize.md', 'standard-financni-gramotnosti.md'] },
      { file: 'vedome-utraceni-pracovni-listy-cs.pdf', kind: 'sheets', title: 'Vědomé utrácení · pracovní listy a dotazník',
        footer: 'Vědomé utrácení · pracovní listy · CC BY-NC-SA 4.0 · © Martin Pazderník',
        parts: ['pracovni-listy.md', 'dotaznik.md'] },
      { file: 'vedome-utraceni-snimky-cs.pdf', kind: 'slides', title: 'Vědomé utrácení · snímky',
        footer: 'Vědomé utrácení · vedome-utraceni.vercel.app · CC BY-NC-SA 4.0',
        parts: ['snimky.md'] },
    ],
  },
  en: {
    lang: 'en',
    page: 'page',
    pdfs: [
      { file: 'mindful-spending-facilitator-guide-en.pdf', kind: 'guide', title: 'Mindful Spending · facilitator kit',
        footer: 'Mindful Spending · facilitator kit · CC BY-NC-SA 4.0 · © Martin Pazderník',
        parts: ['lesson-90-minutes.md', 'lesson-45-minutes.md', 'discussion-questions.md', 'common-problems.md', 'financial-literacy-standard.md'] },
      { file: 'mindful-spending-worksheets-en.pdf', kind: 'sheets', title: 'Mindful Spending · worksheets and questionnaire',
        footer: 'Mindful Spending · worksheets · CC BY-NC-SA 4.0 · © Martin Pazderník',
        parts: ['worksheets.md', 'questionnaire.md'] },
      { file: 'mindful-spending-slides-en.pdf', kind: 'slides', title: 'Mindful Spending · slides',
        footer: 'Mindful Spending · vedome-utraceni.vercel.app · CC BY-NC-SA 4.0',
        parts: ['slides.md'] },
    ],
  },
};

const font = (family, weight, file, range) =>
  `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${weight}; ` +
  `src: url(${pathToFileURL(path.join(ROOT, 'fonts', file)).href}) format('woff2'); unicode-range: ${range}; }`;
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT = 'U+0100-017F';
const FONTS = [
  font('Newsreader', '400 600', 'newsreader-normal-latin-v2.woff2', LATIN),
  font('Newsreader', '400 600', 'newsreader-normal-latin-ext-v2.woff2', LATIN_EXT),
  font('Hanken Grotesk', '400 700', 'hanken-grotesk-normal-latin-v2.woff2', LATIN),
  font('Hanken Grotesk', '400 700', 'hanken-grotesk-normal-latin-ext-v2.woff2', LATIN_EXT),
].join('\n');

// the Forest Calm palette of the app (index.html)
const BASE_CSS = `
${FONTS}
:root { --ink: #2C3826; --soft: #55614E; --moss: #567049; --moss-deep: #3D5235; --moss-soft: #E1EAD4; --line: #C9D2BE; --paper: #FBFAF5; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; color: var(--ink); font: 400 10.5pt/1.5 'Hanken Grotesk', 'DejaVu Sans', sans-serif; }
h1, h2, h3 { font-family: 'Newsreader', 'DejaVu Serif', serif; font-weight: 500; color: var(--moss-deep); line-height: 1.2; break-after: avoid; }
a { color: var(--moss-deep); text-decoration: underline; text-decoration-color: var(--line); text-underline-offset: 2px; }
strong { font-weight: 650; }
table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; break-inside: auto; font-size: 9.5pt; }
tr { break-inside: avoid; }
th, td { text-align: left; vertical-align: top; padding: 4pt 6pt; border-bottom: 0.6pt solid var(--line); }
th { font-weight: 650; color: var(--moss-deep); border-bottom: 1pt solid var(--moss); }
code { font-family: inherit; background: var(--moss-soft); padding: 0 3pt; border-radius: 3pt; }
ul, ol { padding-left: 16pt; }
li { margin: 2pt 0; }
li > ul, li > ol { margin-top: 2pt; }
.page-break { break-after: page; }
`;

const GUIDE_CSS = `
@page { size: A4; margin: 18mm 17mm 20mm; }
h1 { font-size: 22pt; margin: 0 0 8pt; break-before: page; }
main > h1:first-child { break-before: auto; }
h2 { font-size: 14pt; margin: 16pt 0 6pt; }
h3 { font-size: 11.5pt; margin: 12pt 0 4pt; }
p { margin: 0 0 6pt; }
.cover { height: 247mm; display: flex; flex-direction: column; justify-content: center; break-after: page; }
.cover h1 { font-size: 34pt; break-before: auto; margin-bottom: 10pt; }
.cover p { font-size: 13pt; color: var(--soft); max-width: 120mm; }
.cover ol { font-size: 12pt; margin-top: 18pt; color: var(--ink); }
table { break-inside: avoid; }
td.code { white-space: nowrap; }
`;

const SHEETS_CSS = `
@page { size: A4; margin: 16mm 16mm 18mm; }
h1 { font-size: 20pt; margin: 0 0 6pt; }
h2 { font-size: 18pt; margin: 0 0 10pt; }
h3 { font-size: 12.5pt; margin: 14pt 0 4pt; }
p { margin: 0 0 8pt; }
table { font-size: 10pt; }
td { height: 28pt; }
td:first-child { width: 38%; }
.write-lines { height: 82pt; margin: 4pt 0 12pt; background: repeating-linear-gradient(to bottom, transparent 0 19.5pt, var(--line) 19.5pt 20.5pt); }
.write-lines.short { height: 41pt; }
.extra h1 { font-size: 18pt; }
.extra p { margin: 0 0 5pt; }
.extra .write-lines { height: 41pt; margin: 0 0 9pt; }
.extra .write-lines.short { height: 20.5pt; }
.sheet-note { margin-top: 18pt; font-size: 8.5pt; color: var(--soft); }
`;

const SLIDES_CSS = `
@page { size: 1280px 720px; margin: 0; }
body { font-size: 38px; line-height: 1.35; counter-reset: slide; }
.slide { position: relative; width: 1280px; height: 720px; padding: 64px 88px 84px; overflow: hidden; break-after: page; background: var(--paper); counter-increment: slide; }
.slide:last-child { break-after: auto; }
.slide h2 { font-size: 68px; margin: 0 0 30px; }
.slide p { margin: 0 0 18px; max-width: 1040px; }
.slide ul, .slide ol { margin: 0 0 20px; padding-left: 46px; }
.slide li { margin: 6px 0; }
.slide img { width: 330px; height: 330px; float: right; margin: -10px 0 16px 48px; }
.slide .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; font-size: 27px; }
.slide .cols p { margin-bottom: 10px; }
.slide .cols ul, .slide .cols ol { padding-left: 34px; }
.slide::after { content: attr(data-footer) '  ·  ' counter(slide); position: absolute; left: 88px; right: 88px; bottom: 30px; font-size: 17px; color: var(--soft); }
.slide.title { display: flex; flex-direction: column; justify-content: center; background: var(--moss-deep); color: #F4F1E6; }
.slide.title h1 { font-size: 92px; color: #F4F1E6; margin: 0 0 18px; }
.slide.title p { font-size: 34px; color: #DCE6D0; }
.slide.title::after { color: #C7D3BB; }
`;

// relative links to other kit files point at the repository, so they work in a PDF
function absoluteLinks(html, lang) {
  return html.replace(/href="(?!https?:|mailto:|#)([^"]+?\.md)(#[^"]*)?"/g,
    (_, file, hash = '') => `href="${REPO}${lang}/${file}${hash}"`);
}

async function partHtml(lang, file) {
  const md = await readFile(path.join(KIT, lang, file), 'utf8');
  return absoluteLinks(marked.parse(md), lang);
}

function page(lang, title, css, body) {
  const base = pathToFileURL(path.join(KIT, lang) + path.sep).href;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${title}</title>` +
    `<base href="${base}"><style>${BASE_CSS}${css}</style></head><body>${body}</body></html>`;
}

async function guide(kit, pdf) {
  const parts = await Promise.all(pdf.parts.map(f => partHtml(kit.lang, f)));
  const titles = parts.map(html => (html.match(/<h1[^>]*>(.*?)<\/h1>/) || [])[1]).filter(Boolean);
  const [name, rest] = pdf.title.split(' · ');
  const cover = `<section class="cover"><h1>${name}</h1><p>${rest}</p><ol>${titles.map(t => `<li>${t}</li>`).join('')}</ol></section>`;
  // the Standard's codes (B 1.2 / 1 a) and similar) stay on one line
  const main = parts.join('\n').replace(/<td>([A-D] \d(?:\.\d)? \/ [^<]{1,8})<\/td>/g, '<td class="code">$1</td>');
  return page(kit.lang, pdf.title, GUIDE_CSS, cover + `<main>${main}</main>`);
}

async function sheets(kit, pdf) {
  const parts = await Promise.all(pdf.parts.map(f => partHtml(kit.lang, f)));
  // the worksheets start after their introduction, which is for the facilitator
  const [first, ...others] = parts;
  const cut = first.indexOf('<div class="page-break"></div>');
  const body = (cut >= 0 ? first.slice(cut + '<div class="page-break"></div>'.length) : first) +
    others.map(html => '<div class="page-break"></div><section class="extra">' + html + '</section>').join('');
  return page(kit.lang, pdf.title, SHEETS_CSS, body);
}

async function slides(kit, pdf) {
  const html = await partHtml(kit.lang, pdf.parts[0]);
  const footer = pdf.footer.replace(/"/g, '&quot;');
  const body = html.split(/<hr\s*\/?>/).map((slide, i) =>
    `<section class="slide${i === 0 ? ' title' : ''}" data-footer="${footer}">${slide}</section>`).join('');
  return page(kit.lang, pdf.title, SLIDES_CSS, body);
}

const MAKERS = { guide, sheets, slides };

export async function buildKitPdfs({ only } = {}) {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const work = await mkdir(path.join(tmpdir(), 'vu-workshop-pdf'), { recursive: true }).then(() => path.join(tmpdir(), 'vu-workshop-pdf'));
  const made = [];
  try {
    for (const kit of Object.values(KITS)) {
      for (const pdf of kit.pdfs) {
        if (only && !only.includes(pdf.file)) continue;
        const html = await MAKERS[pdf.kind](kit, pdf);
        const file = path.join(work, pdf.file.replace(/\.pdf$/, '.html'));
        await writeFile(file, html);
        const tab = await browser.newPage();
        await tab.goto(pathToFileURL(file).href, { waitUntil: 'load' });
        await tab.evaluate(() => document.fonts.ready);
        const options = pdf.kind === 'slides'
          ? { width: '1280px', height: '720px', printBackground: true, preferCSSPageSize: true }
          : {
              format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
              headerTemplate: '<span></span>',
              footerTemplate: `<div style="width:100%;margin:0 17mm;font:8px sans-serif;color:#55614E;display:flex;justify-content:space-between">` +
                `<span>${pdf.footer}</span><span>${kit.page} <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
            };
        const bytes = await tab.pdf(options);
        await writeFile(path.join(OUT, pdf.file), bytes);
        await tab.close();
        made.push({ file: pdf.file, bytes: bytes.length });
      }
    }
  } finally {
    await browser.close();
    await rm(work, { recursive: true, force: true });
  }
  return made;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const { file, bytes } of await buildKitPdfs()) {
    console.log(`${file}  ${Math.round(bytes / 1024)} kB`);
  }
}
