import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

const base = process.env.VERIFY_GATEWAY_URL ?? 'http://localhost:8080';
const url = new URL(base);
if (!['localhost','127.0.0.1','::1'].includes(url.hostname)) throw new Error('DEV-6 verification only supports a disposable local environment.');
export const runId = randomUUID().slice(0, 8);
export async function request(path, { method = 'GET', token, body, key, status, statuses } = {}) {
  const response = await fetch(new URL('/api/v1' + path, base), {
    method,
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', 'X-CSRF-Protection': '1',
      'X-Correlation-Id': 'dev6-' + runId, ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(key ? { 'Idempotency-Key': key } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (status !== undefined) assert.equal(response.status, status, method + ' ' + path + ': ' + JSON.stringify(result.error ?? {}));
  if (statuses) assert.ok(statuses.includes(response.status), method + ' ' + path + ': unexpected ' + response.status);
  if (response.ok) assert.equal(result.success, true);
  return { status: response.status, data: result.data, error: result.error, meta: result.meta };
}
export async function login(username) {
  const password = process.env.DEMO_PASSWORD;
  if (!password) throw new Error('DEMO_PASSWORD is required');
  return (await request('/auth/login', { method: 'POST', body: { username, password }, status: 200 })).data.accessToken;
}
export async function eventually(label, fn, timeout = 60000) {
  const until = Date.now() + timeout;
  let last;
  do {
    try { last = await fn(); if (last) return last; } catch (error) { last = error; }
    await sleep(1000);
  } while (Date.now() < until);
  throw new Error(label + ' timed out: ' + String(last));
}
export function pass(label) { console.log('PASS ' + label); }
