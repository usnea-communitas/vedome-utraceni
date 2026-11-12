/**
 * The check of the sources the Tips screen names.
 *
 * Every tip, the compound-interest note, the "today's money" switch and the three
 * categories name their sources in FA_SOURCES (fa-core.jsx), each with the day it
 * was last read. This script
 *
 * - opens every source address once and lists the ones that no longer answer,
 *   or that now lead to a different page;
 * - lists the sources last checked more than 180 days ago;
 *
 * and writes the result as Markdown, for one issue that
 * `.github/workflows/source-check.yml` updates once a month. It never changes a
 * tip: whether a source still says what the app says has to be read by a person.
 *
 *   node scripts/check-sources.mjs [--out report.md] [--title-out title.txt]
 *                                  [--today YYYY-MM-DD] [--strict]
 *
 * With --strict it exits with 1 when a source does not answer (the check by hand
 * before a change is merged: `npm run sources:check`).
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadApp } from '../tests/harness.mjs';

/** A source older than this is due to be read again. */
export const MAX_AGE_DAYS = 180;
const DAY = 24 * 60 * 60 * 1000;

/** Every source once, with the parts of the app that use it. */
export function collectSources(app) {
  const uses = {};
  const note = (id, where) => { (uses[id] = uses[id] || []).push(where); };
  for (const tip of app.APP.tipy) for (const id of tip.src || []) note(id, `tip "${tip.t}"`);
  for (const [part, ids] of Object.entries(app.FA_SECTION_SOURCES)) for (const id of ids) note(id, part);
  return Object.entries(app.FA_SOURCES).map(([id, s]) => ({ id, name: s.name, url: s.url, checked: s.checked, uses: uses[id] || [] }));
}

/** Whole days from one ISO date to another. */
export function daysBetween(from, to) {
  return Math.floor((Date.parse(to) - Date.parse(from)) / DAY);
}

/** The same page, give or take `www.`, a trailing slash or http → https. */
export function samePage(a, b) {
  const key = address => {
    const url = new URL(address);
    return url.host.replace(/^www\./, '') + url.pathname.replace(/\/+$/, '') + url.search;
  };
  return key(a) === key(b);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Opens one address: HEAD first (some servers refuse it, then GET), one retry
 * after a network error or a 5xx/429 answer. `status` is 0 when nothing answered.
 */
export async function checkUrl(url, { fetch = globalThis.fetch, retryDelay = 3000, timeout = 20000 } = {}) {
  const headers = {
    'user-agent': 'vedome-utraceni source check (+https://github.com/usnea-communitas/vedome-utraceni)',
    accept: 'text/html,application/pdf;q=0.9,*/*;q=0.8',
  };
  let last = { url, status: 0, finalUrl: url, error: '' };
  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const method of ['HEAD', 'GET']) {
      try {
        const res = await fetch(url, { method, headers, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
        await res.body?.cancel();
        last = { url, status: res.status, finalUrl: res.url || url, error: '' };
        if (res.ok) return last;
      } catch (e) {
        last = { url, status: 0, finalUrl: url, error: e.cause?.code || e.name || String(e) };
      }
    }
    const retry = last.status === 0 || last.status === 429 || last.status >= 500;
    if (!retry || attempt === 2) break;
    await sleep(retryDelay);
  }
  return last;
}

/** A source is fine when it answers 2xx and is still the same page. */
export function problemOf(result) {
  if (result.status === 0) return `no answer (${result.error || 'network'})`;
  if (result.status < 200 || result.status >= 300) return `HTTP ${result.status}`;
  if (!samePage(result.url, result.finalUrl)) return `now leads to ${result.finalUrl}`;
  return '';
}

/** The issue's title and Markdown body. */
export function report(sources, results, today) {
  const broken = sources.map((s, i) => ({ ...s, problem: problemOf(results[i]) })).filter(s => s.problem);
  const stale = sources.filter(s => daysBetween(s.checked, today) > MAX_AGE_DAYS);
  const title = broken.length || stale.length
    ? `Sources of the tips: ${broken.length} to fix, ${stale.length} to read again`
    : `Sources of the tips: all ${sources.length} answer`;
  const lines = [
    `Checked on ${today}: ${sources.length} sources named on the Tips screen (\`FA_SOURCES\` in \`fa-core.jsx\`).`,
    '',
  ];
  if (broken.length) {
    lines.push('## Do not answer or lead elsewhere', '');
    for (const s of broken) lines.push(`- **${s.name}** (${s.id}): ${s.problem} – ${s.url}; used by ${s.uses.join(', ') || 'nothing'}`);
    lines.push('');
  }
  if (stale.length) {
    lines.push(`## Last read more than ${MAX_AGE_DAYS} days ago`, '');
    for (const s of stale) lines.push(`- **${s.name}** (${s.id}): checked ${s.checked}, ${daysBetween(s.checked, today)} days ago – ${s.url}`);
    lines.push('');
  }
  if (!broken.length && !stale.length) lines.push('Every source answers and was read within the last ' + MAX_AGE_DAYS + ' days.', '');
  lines.push(
    'When a source has moved or changed, read it again, fix the tip or its source in `fa-core.jsx` (with a new `checked` date) and the translations in `fa-i18n.jsx`, and open a pull request. This check never changes a tip by itself.',
  );
  return { title, body: lines.join('\n') + '\n', broken, stale };
}

async function main(argv) {
  const arg = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
  const today = arg('--today') || new Date().toISOString().slice(0, 10);
  const sources = collectSources(loadApp());
  const results = [];
  for (const s of sources) results.push(await checkUrl(s.url));
  const { title, body, broken } = report(sources, results, today);
  for (const [i, s] of sources.entries()) console.log(`${problemOf(results[i]) ? 'FAIL' : 'ok  '} ${results[i].status} ${s.url}`);
  console.log(`\n${title}`);
  if (arg('--out')) writeFileSync(arg('--out'), body);
  if (arg('--title-out')) writeFileSync(arg('--title-out'), title + '\n');
  if (argv.includes('--strict') && broken.length) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
