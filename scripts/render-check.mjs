#!/usr/bin/env node
/**
 * Boots a jsdom DOM, points the app's fetches at the running Worker and renders
 * every route, reporting render crashes, console errors and blank pages.
 *
 *   npm run check:render
 */
import { JSDOM } from 'jsdom';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = process.env.API_TARGET || 'http://127.0.0.1:8787';
const OUT = path.join(root, '.render-check');

console.log('› building route bundle…');
fs.rmSync(OUT, { recursive: true, force: true });
const build = spawnSync(
  'npx',
  [
    'vite',
    'build',
    '--config',
    'scripts/render-check.vite.config.ts',
    '--outDir',
    '.render-check',
    '--logLevel',
    'warn',
  ],
  { cwd: root, stdio: 'inherit', shell: false }
);
if (build.status !== 0) {
  console.error('bundle build failed');
  process.exit(1);
}

const bundlePath = path.join(OUT, 'render-entry.js');
if (!fs.existsSync(bundlePath)) {
  console.error('expected bundle at', bundlePath);
  process.exit(1);
}

// ------------------------------------------------------------------ jsdom --
const dom = new JSDOM('<!doctype html><html class="dark"><body><div id="root"></div></body></html>', {
  url: 'http://localhost:8080/',
  pretendToBeVisual: true,
});

const { window } = dom;
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
});
class Observer {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
window.IntersectionObserver = Observer;
window.ResizeObserver = Observer;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
if (!window.Element.prototype.animate) {
  window.Element.prototype.animate = () => ({ finished: Promise.resolve(), cancel() {}, play() {}, pause() {} });
}

// Bridge the app's relative fetches to the real Worker. The app calls bare
// `fetch` (Node's global) as well as `window.fetch`, so both must be bridged.
const realFetch = globalThis.fetch;
const bridgeFetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  const absolute = url.startsWith('http') ? url : `${API}${url}`;
  return realFetch(absolute, init);
};
window.fetch = bridgeFetch;
globalThis.fetch = bridgeFetch;

const errors = [];
dom.window.addEventListener('error', (event) => errors.push(`window.error: ${event.message}`));
process.on('unhandledRejection', (reason) => errors.push(`unhandledRejection: ${reason}`));
// React re-throws render failures asynchronously; record them and keep going.
process.on('uncaughtException', (error) => {
  const message = String(error?.message || error);
  errors.push(`uncaughtException: ${message}`);
});

console.error = (...args) => {
  const message = args.map((a) => (a instanceof Error ? a.message : String(a))).join(' ');
  if (message.includes('Warning:') || message.includes('DevTools')) return;
  errors.push(message.split('\n')[0].slice(0, 220));
};
console.warn = () => {};

// ---------------------------------------------------------------- globals --
const globals = [
  'window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent', 'MouseEvent',
  'KeyboardEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'localStorage',
  'sessionStorage', 'ResizeObserver', 'IntersectionObserver', 'FormData', 'Blob', 'File', 'Image',
  'DOMParser', 'NodeList', 'HTMLCollection', 'CSSStyleDeclaration', 'MutationObserver', 'SVGElement',
];
for (const name of globals) {
  if (window[name] === undefined) continue;
  try {
    Object.defineProperty(globalThis, name, { value: window[name], writable: true, configurable: true });
  } catch {
    /* navigator and friends are getter-only on some runtimes — the app can use window.navigator */
  }
}
globalThis.window = window;
globalThis.document = window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = false;

// Sign in so authenticated routes render as a real user, exactly like the app.
const login = await realFetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'elias@portify.dev', password: 'demo1234' }),
}).then((r) => r.json());
const token = login?.data?.session?.access_token;
if (token) {
  window.localStorage.setItem('portify.session.token', token);
  console.log('› signed in as', login.data.user.email);
} else {
  console.warn('› could not sign in — authenticated routes will render their signed-out states');
}

// -------------------------------------------------------------------- run --
const { run } = await import(bundlePath);
const results = await run();

let failures = 0;
console.log('\nroute                                     nodes  chars  status');
for (const row of results) {
  const problems = [];
  if (row.boundary) problems.push('error boundary shown');
  if (!row.redirected && (!row.hasMarkup || row.nodes < 5)) problems.push('blank output');
  if (problems.length) failures += 1;
  console.log(
    `${row.path.padEnd(40)}  ${String(row.nodes).padStart(5)}  ${String(row.chars).padStart(5)}  ${
      problems.length ? '✗ ' + problems.join(', ') : '✓'
    }`
  );
  console.log(`    ${row.sample}`);
}

const uniqueErrors = [...new Set(errors)].filter(
  (message) => !/Download the React DevTools|jsdom|Not implemented/.test(message)
);
if (uniqueErrors.length) {
  console.log(`\nconsole/render errors (${uniqueErrors.length}):`);
  for (const message of uniqueErrors.slice(0, 40)) console.log(' • ' + message.slice(0, 260));
}

console.log(`\n${results.length - failures}/${results.length} routes rendered`);
if (failures || uniqueErrors.length) process.exitCode = 1;
