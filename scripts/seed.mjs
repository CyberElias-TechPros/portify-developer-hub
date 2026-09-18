#!/usr/bin/env node
/**
 * Seeds the local D1 database with the demo dataset.
 *
 *   npm run db:seed
 *
 * Talks to the running Worker (npm run dev / dev:all). When ALLOW_DEV_ROUTES
 * is enabled locally the route is open; otherwise an admin session is needed.
 */
const API = process.env.API_TARGET || 'http://127.0.0.1:8787';
const email = process.env.SEED_EMAIL || 'elias@portify.dev';
const password = process.env.SEED_PASSWORD || 'demo1234';

const json = (response) => response.json().catch(() => ({}));

let token = null;
try {
  const login = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(json);
  token = login?.data?.session?.access_token ?? null;
} catch {
  /* the dev route below works without a session */
}

const response = await fetch(`${API}/api/admin/seed`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ reset: process.argv.includes('--reset') }),
});

const payload = await json(response);
if (!response.ok || payload.error) {
  console.error('Seed failed:', payload.error?.message || response.statusText);
  console.error('Start the API first (npm run dev) and make sure ALLOW_DEV_ROUTES=1 or sign in.');
  process.exit(1);
}
console.log('Seed complete:', JSON.stringify(payload.data).slice(0, 200));
