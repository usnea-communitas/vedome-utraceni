// The Czech address (/cs/): cs/index.html is index.html with its head in Czech,
// both pages name each other, and the sitemap and the service worker know both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../harness.mjs';

const SITE = 'https://vedome-utraceni.vercel.app';
const read = f => readFileSync(join(root, f), 'utf8');
const en = read('index.html');
const cs = read('cs/index.html');
const head = html => html.slice(0, html.indexOf('</head>'));
const meta = (html, re) => (html.match(re) || [])[1];
const data = html => JSON.parse(meta(html, /<script type="application\/ld\+json">(.*?)<\/script>/));

test('the Czech page speaks Czech in its head and points to itself', () => {
  assert.match(cs, /^<!DOCTYPE html>\n<html lang="cs">/);
  assert.match(meta(cs, /<title>([^<]*)<\/title>/), /^Vědomé utrácení — /);
  assert.match(meta(cs, /<meta name="description" content="([^"]*)"/), /pravidla 50\/30\/20/);
  assert.equal(meta(cs, /<link rel="canonical" href="([^"]*)"/), SITE + '/cs/');
  assert.equal(meta(cs, /<meta property="og:url" content="([^"]*)"/), SITE + '/cs/');
  assert.equal(meta(cs, /<meta property="og:locale" content="([^"]*)"/), 'cs_CZ');
  assert.equal(meta(cs, /<meta property="og:image" content="([^"]*)"/), SITE + '/og-cs.jpg');
  assert.ok(existsSync(join(root, 'og-cs.jpg')), 'the Czech share picture exists');
  assert.equal(data(cs).url, SITE + '/cs/');
  assert.match(data(cs).description, /pravidla 50\/30\/20/);
  // every address in the page and the app is the same as at /
  assert.match(head(cs), /<meta charset="utf-8" \/>\n<base href="\/" \/>/);
  assert.match(cs, /base-uri 'self'/);
});

test('the English page stays the default and names the Czech one', () => {
  assert.match(en, /^<!DOCTYPE html>\n<html lang="en">/);
  assert.equal(meta(en, /<link rel="canonical" href="([^"]*)"/), SITE + '/');
  assert.doesNotMatch(en, /<base /);
  assert.match(en, /base-uri 'none'/);
  assert.equal(data(en).url, SITE + '/');
  for (const html of [en, cs]) {
    assert.match(html, new RegExp(`<link rel="alternate" hreflang="en" href="${SITE}/" />`));
    assert.match(html, new RegExp(`<link rel="alternate" hreflang="cs" href="${SITE}/cs/" />`));
    assert.match(html, new RegExp(`<link rel="alternate" hreflang="x-default" href="${SITE}/" />`));
  }
});

test('the two pages differ only in their heads, and load the same build', () => {
  assert.equal(cs.slice(cs.indexOf('</head>')), en.slice(en.indexOf('</head>')));
  assert.equal(meta(cs, /src="app\.js\?v=([\w.-]+)"/), meta(en, /src="app\.js\?v=([\w.-]+)"/));
});

test('the sitemap and the service worker know both addresses', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, new RegExp(`<loc>${SITE}/</loc>`));
  assert.match(sitemap, new RegExp(`<loc>${SITE}/cs/</loc>`));
  const sw = read('sw.js');
  assert.match(sw, /'\.\/cs\/index\.html'/);
  assert.match(sw, /\/\^\\\/cs\(\\\/\|\$\)\/\.test\(url\.pathname\) \? '\.\/cs\/index\.html' : '\.\/index\.html'/);
});
