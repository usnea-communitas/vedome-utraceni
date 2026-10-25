// tests/harness.mjs — loads the .jsx sources into a Node vm context, the same
// way scripts/compile.mjs joins them for the browser, with small stand-ins for
// React, localStorage and window. Unit tests then call the app's own functions.
import { transformSync } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// compile order, without the device frame, the Tweaks panel and the app shell (which mounts React)
const SOURCES = [
  'fa-core.jsx', 'fa-i18n.jsx', 'fa-forest.jsx', 'fa-wizard.jsx', 'fa-ui.jsx', 'fa-tree.jsx',
  'fa-invest.jsx', 'fa-prehled.jsx', 'fa-add.jsx', 'fa-screens.jsx', 'fa-plan.jsx', 'fa-store.jsx',
  'fa-onboard.jsx', 'fa-settings.jsx',
];

function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    clear: () => m.clear(),
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

const ReactStub = {
  createElement: () => null, Fragment: 'Fragment', Component: class {},
  useState: v => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {}, useRef: v => ({ current: v ?? null }), useMemo: f => f(), useCallback: f => f, useId: () => 'id',
};

let code;
function compiled() {
  if (!code) {
    const joined = SOURCES.map(f => `// ── ${f} ──\n` + readFileSync(join(root, f), 'utf8')).join('\n;\n');
    code = transformSync(joined, { loader: 'jsx', jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', target: 'es2019' }).code;
  }
  return code;
}

// a fresh app context; `storage` seeds localStorage (values are stored as given)
export function loadApp(storage = {}) {
  const context = { React: ReactStub, localStorage: memoryStorage(storage), navigator: {}, console, Intl, Date, Math, JSON };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(compiled(), context, { filename: 'app.js' });
  return context;
}

// evaluate an expression inside the app context (reaches top-level const/let such as S)
export const inApp = (app, expr) => vm.runInContext(expr, app);

// values created in the vm belong to another realm; compare them as plain JSON
export const plain = v => JSON.parse(JSON.stringify(v));
