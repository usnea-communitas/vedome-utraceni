// The facilitator kit in docs/workshop/: both languages have the same
// documents, every PDF exists, fits its pages and is linked from the app and
// the kit's README, and the numbers in the lesson plans and slides are the
// ones the app's stories seed (fa-workshop.jsx). Change a story, and this test
// says which part of the kit to update; then run `node scripts/workshop-pdf.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadApp, inApp, plain, root } from '../harness.mjs';
import { KITS } from '../../scripts/workshop-pdf.mjs';

const KIT = join(root, 'docs', 'workshop');
const read = (lang, file) => readFileSync(join(KIT, lang, file), 'utf8').replace(/ /g, ' ');
const pdfPages = bytes => (bytes.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
// 11600 → "11 600" in Czech, "11,600" in English, as the kit writes them
const num = (n, lang) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'cs' ? ' ' : ',');
const stories = plain(inApp(loadApp(), 'FA_WORKSHOP_STORIES'));
const doc = (lang, kind, i = 0) => read(lang, KITS[lang].pdfs.find(p => p.kind === kind).parts[i]);

test('Czech and English have the same documents, and every source exists', () => {
  assert.deepEqual(Object.keys(KITS), ['cs', 'en']);
  const shape = lang => KITS[lang].pdfs.map(p => [p.kind, p.parts.length]);
  assert.deepEqual(shape('cs'), shape('en'));
  for (const kit of Object.values(KITS)) {
    for (const pdf of kit.pdfs) {
      for (const part of pdf.parts) assert.ok(existsSync(join(KIT, kit.lang, part)), `${kit.lang}/${part}`);
    }
  }
});

test('every PDF is there, fits its pages and is linked from the app and the README', () => {
  const app = loadApp();
  const inAppLinks = ['cs', 'en', 'pl'].flatMap(lang => plain(app.faWorkshopKit(lang)).map(k => k.href));
  const readme = readFileSync(join(KIT, 'README.md'), 'utf8');
  for (const kit of Object.values(KITS)) {
    for (const pdf of kit.pdfs) {
      const file = join(KIT, 'pdf', pdf.file);
      assert.ok(existsSync(file), `${pdf.file}: run node scripts/workshop-pdf.mjs`);
      const bytes = readFileSync(file);
      assert.equal(bytes.subarray(0, 5).toString('latin1'), '%PDF-', pdf.file);
      assert.ok(inAppLinks.includes('docs/workshop/pdf/' + pdf.file), `${pdf.file} is linked in the app`);
      assert.ok(readme.includes('pdf/' + pdf.file), `${pdf.file} is listed in docs/workshop/README.md`);
      if (pdf.kind === 'sheets') {
        // one page per worksheet and one for the questionnaire: nothing spills over
        const sheets = (doc(kit.lang, 'sheets').match(/<div class="page-break"><\/div>/g) || []).length;
        assert.equal(pdfPages(bytes), sheets + 1, `${pdf.file} pages`);
      }
      if (pdf.kind === 'slides') {
        const slides = doc(kit.lang, 'slides').split(/\n---\n/).length;
        assert.equal(pdfPages(bytes), slides, `${pdf.file} pages`);
      }
    }
  }
  // Polish, Ukrainian and Spanish get the English kit
  assert.deepEqual(plain(app.faWorkshopKit('pl')), plain(app.faWorkshopKit('en')));
});

test('the slides the lesson plans refer to exist', () => {
  for (const lang of Object.keys(KITS)) {
    const slides = doc(lang, 'slides').split(/\n---\n/).length;
    for (const file of KITS[lang].pdfs.find(p => p.kind === 'guide').parts.slice(0, 2)) {
      const refs = [...read(lang, file).matchAll(/(?:snímk[yu]|snímek|slides?) (\d+)(?:–(\d+))?/g)]
        .flatMap(m => [Number(m[1]), Number(m[2] || m[1])]);
      assert.ok(refs.length > 0, file);
      assert.ok(Math.max(...refs) <= slides, `${lang}/${file} refers to slide ${Math.max(...refs)} of ${slides}`);
    }
  }
});

test('the lesson plans, the slides and the paper stories use the numbers the app seeds', () => {
  const ratios = { nutne: 50, radost: 30, budouci: 20 };
  for (const lang of Object.keys(KITS)) {
    const plan = doc(lang, 'guide', 0);
    const slides = doc(lang, 'slides');
    for (const s of stories) {
      const income = s.income.reduce((sum, x) => sum + x.amount, 0);
      const has = (text, n, what) => assert.ok(text.includes(num(n, lang)), `${lang}: ${s.id} ${what} ${num(n, lang)}`);
      has(plan, income, 'income');
      has(slides, income, 'income on the slides');
      for (const share of Object.values(ratios)) has(plan, income * share / 100, `${share} %`);
      for (const x of s.income) has(plan, x.amount, x.name);
      for (const x of s.spent) {
        has(plan, x.amount, x.name);
        if (x.cat === 'radost') has(plan, x.amount * 12, `${x.name} per year`);
      }
      has(plan, s.surprise.amount, 'surprise');
      has(slides, s.surprise.amount, 'surprise on the slides');
      // what is left of Need after the surprise (task 4)
      const need = income * ratios.nutne / 100 - s.spent.filter(x => x.cat === 'nutne').reduce((sum, x) => sum + x.amount, 0) - s.surprise.amount;
      assert.ok(plan.includes(need < 0 ? '−' + num(-need, lang) : num(need, lang)), `${lang}: ${s.id} Need after the surprise ${need}`);
    }
  }
});

test('the coverage table quotes points that are in the Standard', () => {
  // the codes the table may use: areas A–D, levels 1.1, 1.2 and 2
  for (const lang of Object.keys(KITS)) {
    const table = doc(lang, 'guide', 4);
    const codes = [...table.matchAll(/^\| ([A-D] \d(?:\.\d)? \/ [0-9a-e)\s]+?) \|/gm)].map(m => m[1]);
    assert.ok(codes.length >= 20, `${lang}: ${codes.length} points`);
    assert.equal(new Set(codes).size, codes.length, `${lang}: each point once`);
    for (const code of codes) assert.match(code, /^[A-D] (1\.1|1\.2|2) \/ \d( [a-e]\))?$/, `${lang}: ${code}`);
  }
  const cs = doc('cs', 'guide', 4), en = doc('en', 'guide', 4);
  const rows = text => [...text.matchAll(/^\| ([A-D] [^|]+?) \|/gm)].map(m => m[1]);
  assert.deepEqual(rows(cs), rows(en), 'both languages list the same points');
});
