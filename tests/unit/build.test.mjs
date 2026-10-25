// Every source compiles without esbuild warnings (duplicate keys, suspicious
// comparisons…), and the generated files carry the current cache stamps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { transformSync } from 'esbuild';
import { root } from '../harness.mjs';

test('the .jsx sources compile without warnings', () => {
  const warnings = [];
  for (const file of readdirSync(root).filter(f => f.endsWith('.jsx'))) {
    const out = transformSync(readFileSync(join(root, file), 'utf8'), {
      loader: 'jsx', jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment',
      target: 'es2019', sourcefile: file, logLevel: 'silent',
    });
    for (const w of out.warnings) warnings.push(`${file}:${w.location && w.location.line}: ${w.text}`);
  }
  assert.deepEqual(warnings, []);
});

test('index.html and sw.js point at the committed app.js', () => {
  const build = createHash('sha256').update(readFileSync(join(root, 'app.js'))).digest('hex').slice(0, 10);
  assert.match(readFileSync(join(root, 'index.html'), 'utf8'), new RegExp(`src="app\\.js\\?v=${build}"`));
  assert.match(readFileSync(join(root, 'sw.js'), 'utf8'), new RegExp(`const BUILD = '${build}';`));
});
