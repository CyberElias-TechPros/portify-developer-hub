#!/usr/bin/env node
/**
 * Drives every critical user flow through the real UI in jsdom against the
 * running Worker: sign in, contact, comment, react, follow.
 *
 *   npm run check:flows
 */
import { JSDOM } from 'jsdom';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = process.env.API_TARGET || 'http://127.0.0.1:8787';
const OUT = path.join(root, '.render-check');

console.log('› building flow bundle…');
fs.rmSync(OUT, { recursive: true, force: true });
const build = spawnSync(
  'npx',
  ['vite', 'build', '--config', 'scripts/flow-check.vite.config.ts', '--outDir', '.render-check', '--logLevel', 'warn'],
  { cwd: root, stdio: 'inherit' }
);
if (build.status !== 0) process.exit(1);

const dom = new JSDOM('<!doctype html><html class="dark"><body></body></html>', {
  url: 'http://localhost:8080/',
  pretendToBeVisual: true,
});
const { window } = dom;
window.matchMedia = (query) => ({
  matches: false,
  media: query,
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
globalThis.IntersectionObserver = Observer;
globalThis.ResizeObserver = Observer;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};

globalThis.AbortSignal = window.AbortSignal;
globalThis.AbortController = window.AbortController;

const realFetch = globalThis.fetch;
const bridgeFetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  return realFetch(url.startsWith('http') ? url : `${API}${url}`, init);
};
window.fetch = bridgeFetch;
globalThis.fetch = bridgeFetch;

const problems = [];
process.on('unhandledRejection', (reason) => problems.push(`unhandledRejection: ${reason}`));
process.on('uncaughtException', (error) => problems.push(`uncaughtException: ${error?.message || error}`));
console.error = (...args) => {
  const message = args.map((a) => (a instanceof Error ? a.message : String(a))).join(' ');
  if (message.includes('Warning:') || message.includes('DevTools')) return;
  problems.push(message.split('\n')[0].slice(0, 200));
};

for (const name of [
  'window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Element', 'Node',
  'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'getComputedStyle', 'requestAnimationFrame',
  'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'FormData', 'Blob', 'File', 'Image', 'DOMParser',
  'NodeList', 'HTMLCollection', 'MutationObserver', 'SVGElement', 'EventTarget', 'NodeFilter', 'DOMRect',
  'Range', 'Selection', 'XMLSerializer', 'HTMLDivElement',
]) {
  if (window[name] === undefined) continue;
  try {
    Object.defineProperty(globalThis, name, { value: window[name], writable: true, configurable: true });
  } catch {
    /* getter-only globals stay on window */
  }
}

const health = await realFetch(`${API}/api/health`).then((r) => r.json()).catch(() => null);
if (!health?.data || health.data.database !== 'ok') {
  console.error('API is not reachable at', API, '— start it with `npm run dev:api`');
  process.exit(1);
}
// Sign-in is exercised through the UI in flow 1; the resulting token then
// authenticates every later flow, exactly like a real session.
window.localStorage.removeItem('portify.session.token');

const login = await realFetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'elias@portify.dev', password: 'demo1234' }),
}).then((r) => r.json());
if (!login?.data?.session?.access_token) {
  console.error('could not sign in against', API);
  process.exit(1);
}

const post = await realFetch(`${API}/api/db/blog_posts?limit=1&order=publish_date.desc`).then((r) => r.json());
const slug = post?.data?.[0]?.slug;
const people = await realFetch(`${API}/api/community/people?limit=5`).then((r) => r.json());
const otherUser = (people?.data?.people ?? []).find((p) => p.username !== 'elias')?.username;
if (!slug || !otherUser) {
  console.error('fixtures missing — run `npm run db:seed` first');
  process.exit(1);
}

// Fixtures for the social flows: a peer skill to endorse, a DM thread and the
// peer's display name for the testimonial loop.
const credentials = login.data.session.access_token;
const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${credentials}` };
const portfolio = await realFetch(`${API}/api/portfolio/${otherUser}`).then((r) => r.json());
const skillId = portfolio?.data?.skills?.find((skill) => skill.user_id !== login.data.user.id)?.id;
const peerId = portfolio?.data?.profile?.id;
let threadId = null;
if (peerId) {
  const created = await realFetch(`${API}/api/dm/threads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ userId: peerId }),
  }).then((r) => r.json());
  threadId = created?.data?.thread?.id ?? null;
}
console.log(`› fixtures: peer=${otherUser} skill=${skillId ? 'yes' : 'no'} thread=${threadId ? 'yes' : 'no'}`);

const { runFlows } = await import(path.join(OUT, 'flow-entry.js'));
const flows = await runFlows(slug, otherUser, {
  skillId,
  threadId,
  otherName: portfolio?.data?.profile?.full_name ?? otherUser,
  ownerUsername: 'elias',
  freshEmail: `newcomer.${Date.now()}@portify.dev`,
  freshPassword: 'sup3rsecret',
});

let failed = 0;
for (const flow of flows) {
  const ok = flow.steps.every((step) => step.ok);
  if (!ok) failed += 1;
  console.log(`\n${ok ? '✓' : '✗'} ${flow.name}`);
  for (const step of flow.steps) {
    console.log(`   ${step.ok ? '·' : '✗'} ${step.label}${step.detail ? ` — ${step.detail}` : ''}`);
  }
}

const uniqueProblems = [...new Set(problems)].filter((p) => !/Failed to fetch|Not implemented/.test(p));
if (uniqueProblems.length) {
  console.log(`\nruntime errors (${uniqueProblems.length}):`);
  for (const problem of uniqueProblems.slice(0, 25)) console.log(' • ' + problem.slice(0, 220));
}

console.log(`\n${flows.length - failed}/${flows.length} flows passed`);
if (failed || uniqueProblems.length) process.exitCode = 1;
