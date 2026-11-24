import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
export const project = process.env.VERIFY_COMPOSE_PROJECT ?? 'minimart-final';
export const envFile = process.env.VERIFY_ENV_FILE ?? '/tmp/minimart-final.env';
export const gateway =
  process.env.VERIFY_GATEWAY_URL ?? 'http://localhost:8080';
export const web = process.env.VERIFY_WEB_URL ?? 'http://localhost:3300';
export const evidence = 'docs/evidence/final';
export const runId = randomUUID().slice(0, 8);
export const results = [];
export function compose(...args) {
  return ['compose', '-p', project, '--env-file', envFile, ...args];
}
export function docker(...args) {
  return execFileSync('docker', args, {
    encoding: 'utf8',
    timeout: 120000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}
export function command(...args) {
  return docker(...compose(...args));
}
export function sql(database, query) {
  assert.ok(
    [
      'identity_db',
      'product_db',
      'inventory_db',
      'sales_db',
      'report_db',
    ].includes(database),
  );
  return execFileSync(
    'docker',
    compose(
      'exec',
      '-T',
      'postgres',
      'psql',
      '-X',
      '-U',
      'minimart_bootstrap',
      '-d',
      database,
      '-v',
      'ON_ERROR_STOP=1',
      '-At',
    ),
    { input: query, encoding: 'utf8', timeout: 20000 },
  );
}
export const literal = (value) =>
  "'" + String(value).replaceAll("'", "''") + "'";
export function rows(database, query) {
  return JSON.parse(
    sql(
      database,
      `SELECT COALESCE(json_agg(t),'[]'::json) FROM (${query}) t;`,
    ).trim(),
  );
}
export function inNode(service, code) {
  return execFileSync('docker', compose('exec', '-T', service, 'node'), {
    input: code,
    encoding: 'utf8',
    timeout: 30000,
  });
}
export function broker(code) {
  return inNode(
    'sales-service',
    `const amqp=require('amqplib');(async()=>{const c=await amqp.connect(process.env.RABBITMQ_URL);const ch=await c.createConfirmChannel();ch.on('error',()=>{});try{${code}}finally{await ch.close().catch(()=>{});await c.close().catch(()=>{});}})().catch(e=>{console.error(e.message);process.exitCode=1;});`,
  );
}
export function publish(event, headers = {}) {
  broker(
    `await new Promise((resolve,reject)=>ch.publish('minimart.sales','sale.completed.v1',Buffer.from(${JSON.stringify(JSON.stringify(event))}),{persistent:true,mandatory:true,messageId:${JSON.stringify(event.eventId)},contentType:'application/json',headers:${JSON.stringify(headers)}},e=>e?reject(e):resolve()));`,
  );
}
export function queue(name) {
  return JSON.parse(
    broker(
      `console.log(JSON.stringify(await ch.checkQueue(${JSON.stringify(name)})));`,
    ).trim(),
  );
}
export async function eventually(label, fn, timeout = 60000) {
  const end = Date.now() + timeout;
  let last;
  do {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      last = error.message;
    }
    await sleep(500);
  } while (Date.now() < end);
  throw new Error(label + ' timed out' + (last ? ': ' + last : ''));
}
export async function test(id, label, work) {
  const start = performance.now();
  try {
    await work();
    results.push({
      id,
      label,
      result: 'PASS',
      durationMs: Math.round(performance.now() - start),
    });
    console.log('PASS ' + id + ' ' + label);
  } catch (error) {
    results.push({ id, label, result: 'FAIL', message: error.message });
    console.error('FAIL ' + id + ' ' + label + ': ' + error.message);
    throw error;
  } finally {
    mkdirSync(evidence, { recursive: true });
    writeFileSync(
      evidence +
        (process.env.VERIFY_STAGE === 'browser'
          ? '/acceptance-browser.json'
          : '/acceptance.json'),
      JSON.stringify(results, null, 2) + '\n',
    );
  }
}
export async function request(
  path,
  {
    method = 'GET',
    token,
    body,
    key,
    cookie,
    status,
    headers = {},
    timeout = 20000,
  } = {},
) {
  const response = await fetch(
    new URL(path.startsWith('/api/') ? path : '/api/v1' + path, gateway),
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        Origin: web,
        'X-CSRF-Protection': '1',
        'X-Correlation-Id': 'final-' + runId,
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    },
  );
  const value = await response.json();
  assert.ok(
    !JSON.stringify(value).includes('passwordHash') &&
      !JSON.stringify(value).includes('tokenHash'),
    'credential hash leaked',
  );
  if (status !== undefined)
    assert.ok(
      (Array.isArray(status) ? status : [status]).includes(response.status),
      method +
        ' ' +
        path +
        ' expected ' +
        status +
        ' got ' +
        response.status +
        ' ' +
        (value.error?.code ?? ''),
    );
  return {
    status: response.status,
    data: value.data,
    error: value.error,
    meta: value.meta,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
    response,
  };
}
export async function login(username = 'cashier', password) {
  password ??=
    process.env.DEMO_PASSWORD ??
    readFileSync(envFile, 'utf8').match(/^DEMO_PASSWORD=(.*)$/m)?.[1];
  assert.ok(password, 'DEMO_PASSWORD missing');
  return request('/auth/login', {
    method: 'POST',
    body: { username, password },
    status: 200,
  });
}
export async function prepare(
  f,
  items = [{ productId: f.product.id, quantity: 1 }],
  key = randomUUID(),
) {
  const result = await request('/sales/checkout/prepare', {
    method: 'POST',
    token: f.cashier,
    body: { items },
    key,
    status: [200, 409],
  });
  return { ...result, key };
}
export async function invoice(f, id) {
  return (await request('/invoices/' + id, { token: f.cashier, status: 200 }))
    .data;
}
export async function waitInvoice(f, id, status) {
  return eventually('invoice ' + status, async () => {
    const row = await invoice(f, id);
    return row.status === status ? row : false;
  });
}
export async function pay(
  f,
  id,
  input = { method: 'CASH', amountReceived: 1000000 },
  key = randomUUID(),
) {
  const result = await request('/sales/checkout/' + id + '/confirm', {
    method: 'POST',
    token: f.cashier,
    body: input,
    key,
    status: [200, 503],
  });
  return { ...result, key, input };
}
export async function sale(f, input) {
  const ready = await prepare(f);
  assert.equal(ready.status, 200);
  await waitInvoice(f, ready.data.id, 'READY');
  await pay(f, ready.data.id, input);
  return waitInvoice(f, ready.data.id, 'COMPLETED');
}
export async function verifyDisposable() {
  assert.equal(process.env.VERIFY_DISPOSABLE, 'true');
  assert.ok(
    project === 'minimart-final' || project.startsWith('minimart-verify-'),
    'select a dedicated verification project',
  );
  const id = command('ps', '-q', 'postgres').trim();
  assert.ok(id);
  assert.equal(
    docker(
      'inspect',
      '--format',
      '{{index .Config.Labels "com.docker.compose.project"}}',
      id,
    ).trim(),
    project,
  );
}
export function sqlFailure(database, statement) {
  const p = spawnSync(
    'docker',
    compose(
      'exec',
      '-T',
      'postgres',
      'psql',
      '-X',
      '-U',
      'minimart_bootstrap',
      '-d',
      database,
      '-v',
      'ON_ERROR_STOP=1',
      '-At',
    ),
    { input: 'BEGIN;\n' + statement + ';\nROLLBACK;\n', encoding: 'utf8' },
  );
  assert.notEqual(p.status, 0, 'expected PostgreSQL constraint rejection');
  assert.match(
    p.stderr,
    /violates check constraint/,
    'expected CHECK violation, not an unrelated SQL failure',
  );
}
export { assert, randomUUID, sleep };
