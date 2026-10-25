// Amounts, days and months follow the interface language (fa-core.jsx, issue #3)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from '../harness.mjs';

const app = loadApp();
const NB = ' ';
const inLang = (lang, fn) => { app.setFaLang(lang); try { return fn(); } finally { app.setFaLang('en'); } };

test('amounts are grouped per language and always end in Kč', () => {
  assert.equal(inLang('en', () => app.kc(21450)), '21,450' + NB + 'Kč');
  assert.equal(inLang('cs', () => app.kc(21450)), '21' + NB + '450' + NB + 'Kč');
  assert.equal(inLang('es', () => app.kc(21450)), '21.450' + NB + 'Kč');
  assert.equal(inLang('cs', () => app.fmt(1000.4)), '1' + NB + '000');
  assert.equal(inLang('en', () => app.fmt(-2500)), '-2,500');
});

test('day labels follow the language; the stored day stays ISO', () => {
  assert.equal(inLang('en', () => app.faDayLabel('2026-10-25')), '10/25');
  assert.equal(inLang('cs', () => app.faDayLabel('2026-10-25')), '25. 10.');
  assert.equal(inLang('es', () => app.faDayLabel('2026-10-25')), '25/10');
  assert.equal(app.faExpenseDay({ day: '2026-09-01', ts: 0 }), '2026-09-01');
  assert.equal(app.faExpenseMonth({ day: '2026-09-01' }), '2026-09');
});

test('month labels and names are capitalised, in the interface language', () => {
  assert.equal(inLang('en', () => app.faMonthLabel('2026-10')), 'October 2026');
  assert.equal(inLang('cs', () => app.faMonthLabel('2026-10')), 'Říjen 2026');
  assert.equal(inLang('pl', () => app.faMonthName(10)), 'Październik');
  assert.equal(inLang('es', () => app.faMonthLabel('2026-09')), 'Septiembre de 2026');
});

test('old Czech month labels from earlier versions are still understood', () => {
  assert.equal(app.faMonthFromLabel('Červen 2026'), '2026-06');
  assert.equal(app.faMonthFromLabel('2026-06'), '2026-06');
  assert.equal(app.faMonthFromLabel('June 2026'), null);
});
