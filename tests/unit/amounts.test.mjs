// Typed amounts: one tolerant rule for every interface language (fa-core.jsx)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from '../harness.mjs';

const app = loadApp();

test('thousands separators are read as thousands', () => {
  for (const s of ['1000', '1 000', '1 000', '1,000', '1.000', "1'000"]) assert.equal(app.faParseAmount(s), 1000, s);
  assert.equal(app.faParseAmount('1.000.000'), 1000000);
  assert.equal(app.faParseAmount('1,234,567'), 1234567);
});

test('a lone mark followed by one or two digits is the decimal mark', () => {
  assert.equal(app.faParseAmount('12,50'), 12.5);
  assert.equal(app.faParseAmount('12.5'), 12.5);
  assert.equal(app.faParseAmount('0,500'), 0.5); // a leading zero is never a thousands group
  assert.equal(app.faParseAmount('12,'), 12);
});

test('with both marks the last one is decimal', () => {
  assert.equal(app.faParseAmount('1.234,50'), 1234.5);
  assert.equal(app.faParseAmount('1,234.50'), 1234.5);
});

test('a trailing currency label is ignored; anything else is not a number', () => {
  assert.equal(app.faParseAmount('500 Kč'), 500);
  assert.equal(app.faParseAmount('500 CZK'), 500);
  for (const s of ['', 'abc', '12a', '-500', null, undefined]) assert.ok(Number.isNaN(app.faParseAmount(s)), String(s));
});

test('faAmount gives whole positive crowns or 0', () => {
  assert.equal(app.faAmount('12,50'), 13);
  assert.equal(app.faAmount('12.49'), 12);
  assert.equal(app.faAmount('1,000'), 1000);
  assert.equal(app.faAmount(38000), 38000);
  assert.equal(app.faAmount('0'), 0);
  assert.equal(app.faAmount('abc'), 0);
});
