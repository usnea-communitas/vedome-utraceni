// Tips with sources (fa-core.jsx, fa-invest.jsx, scripts/check-sources.mjs): every
// tip names where its fact comes from, every source is real and dated, the texts
// are in every language, and the simulator can count in today's money.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, inApp, plain } from '../harness.mjs';
import { collectSources, checkUrl, problemOf, report, MAX_AGE_DAYS } from '../../scripts/check-sources.mjs';

const app = loadApp();
const sources = plain(app.FA_SOURCES);
const sections = plain(app.FA_SECTION_SOURCES);

test('every tip names at least one source, and every source is used', () => {
  const used = new Set();
  for (const tip of app.APP.tipy) {
    assert.ok(Array.isArray(tip.src) && tip.src.length, `tip "${tip.t}" has no source`);
    for (const id of tip.src) { assert.ok(sources[id], `tip "${tip.t}": unknown source ${id}`); used.add(id); }
  }
  for (const [part, ids] of Object.entries(sections)) {
    assert.ok(ids.length, part);
    for (const id of ids) { assert.ok(sources[id], `${part}: unknown source ${id}`); used.add(id); }
  }
  assert.deepEqual(Object.keys(sources).filter(id => !used.has(id)), [], 'sources nobody uses');
});

test('a source has a name, an https address and the day it was checked', () => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = new Set();
  for (const [id, s] of Object.entries(sources)) {
    assert.ok(s.name && s.name.length > 8, id);
    assert.match(s.url, /^https:\/\/[^\s]+$/, id);
    assert.ok(!urls.has(s.url), `${id}: the same address twice`);
    urls.add(s.url);
    assert.match(s.checked, /^\d{4}-\d{2}-\d{2}$/, id);
    assert.ok(s.checked <= today, `${id}: checked in the future`);
    assert.ok(!Number.isNaN(Date.parse(s.checked)), id);
  }
});

test('the tips, their facts and the category notes are in every language', () => {
  const texts = [...app.APP.tipy].flatMap(t => [t.t, t.d, t.factTitle, t.fact])
    .concat(Object.values(plain(inApp(app, 'CAT_EXPLAIN'))));
  for (const lang of ['en', 'pl', 'uk', 'es']) {
    const other = loadApp({ 'fa.lang': lang });
    const missing = [...texts].filter(t => other.L(t) === t);
    assert.deepEqual(missing, [], lang);
  }
});

test('in today\'s money each year is divided by the price level, deposits and gains alike', () => {
  const nominal = plain(app.faInvestProjection(500, 20, 0.08));
  const today = plain(app.faInTodaysMoney(nominal, app.FA_INFLATION));
  assert.equal(app.FA_INFLATION, 0.02);
  assert.deepEqual(today[0], nominal[0]);
  const last = today.at(-1), was = nominal.at(-1);
  assert.ok(Math.abs(last.fv - was.fv / 1.02 ** 20) < 1e-6);
  assert.ok(Math.abs(last.contributed - 120000 / 1.02 ** 20) < 1e-6);
  // the split between deposits and gains stays the same in every year
  for (const [i, p] of today.entries()) if (p.fv) assert.ok(Math.abs(p.contributed / p.fv - nominal[i].contributed / nominal[i].fv) < 1e-12);
  // 500 Kč a month at 8 % for 20 years: about 294 510 Kč, about 198 200 Kč in today's money
  assert.equal(Math.round(was.fv / 10) * 10, 294510);
  assert.equal(Math.round(last.fv / 100) * 100, 198200);
});

test('the source check lists every source once with what uses it', () => {
  const list = collectSources(app);
  assert.deepEqual(list.map(s => s.id).sort(), Object.keys(sources).sort());
  const reserves = list.find(s => s.id === 'mfReserves2020');
  assert.deepEqual(reserves.uses, ['tip "Zaplať nejdřív budoucí já"', 'tip "Pojmenuj své cíle"']);
  assert.deepEqual(list.find(s => s.id === 'csu2022').uses, ['inflation']);
});

test('the source check tries HEAD, then GET, and notices a page that moved', async () => {
  const calls = [];
  const fake = answers => async (url, opts) => {
    calls.push(opts.method);
    const a = answers.shift();
    if (a instanceof Error) throw a;
    return { ok: a.status >= 200 && a.status < 300, status: a.status, url: a.url || url, body: null };
  };
  // a server that refuses HEAD
  const ok = await checkUrl('https://example.org/a', { fetch: fake([{ status: 405 }, { status: 200 }]), retryDelay: 0 });
  assert.deepEqual(calls, ['HEAD', 'GET']);
  assert.equal(problemOf(ok), '');
  // a redirect to another page is a problem, a trailing slash or www. is not
  assert.match(problemOf({ url: 'https://a.cz/x', finalUrl: 'https://a.cz/y', status: 200 }), /now leads to/);
  assert.equal(problemOf({ url: 'https://a.cz/x', finalUrl: 'https://www.a.cz/x/', status: 200 }), '');
  // nothing answers twice: no answer, after one retry
  calls.length = 0;
  const down = await checkUrl('https://example.org/b', { fetch: fake([new Error('x'), new Error('x'), new Error('x'), new Error('x')]), retryDelay: 0 });
  assert.equal(calls.length, 4);
  assert.match(problemOf(down), /^no answer/);
});

test('the report names what to fix and what to read again', () => {
  const list = collectSources(app);
  const fine = list.map(s => ({ url: s.url, finalUrl: s.url, status: 200 }));
  assert.match(report(list, fine, '2026-11-12').title, /all \d+ answer/);
  const later = new Date(Date.parse('2026-11-12') + (MAX_AGE_DAYS + 1) * 864e5).toISOString().slice(0, 10);
  const broken = fine.map((r, i) => (i === 0 ? { ...r, status: 404 } : r));
  const r = report(list, broken, later);
  assert.equal(r.broken.length, 1);
  assert.equal(r.stale.length, list.length);
  assert.match(r.title, /1 to fix, \d+ to read again/);
  assert.match(r.body, /HTTP 404/);
});
