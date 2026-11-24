/* global document, window */
import { createRequire } from 'node:module';
const requireTool = createRequire('/tmp/minimart-verification/package.json');
const { default: EmbeddedPostgres } = await import(
  requireTool.resolve('embedded-postgres')
);
const pg = requireTool('pg');
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = requireTool('playwright');
const YAML = requireTool('yaml');
const root = process.cwd();
const evidence = root + '/docs/evidence';
mkdirSync(evidence, { recursive: true });
const lines = [];
function log(s) {
  lines.push(s);
  console.log(s);
}
function assert(ok, message) {
  if (!ok) throw new Error(message);
  log('PASS ' + message);
}
const services = ['identity', 'product', 'inventory', 'sales', 'report'];
const cluster = new EmbeddedPostgres({
  databaseDir: '/tmp/minimart-verification/database',
  user: 'minimart_bootstrap',
  password: 'local_bootstrap_password',
  port: 55432,
  persistent: false,
  onLog: () => {},
  onError: () => {},
});
const children = [];
let browser;
function run(args, cwd, env) {
  const p = spawnSync('pnpm', args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: 60000,
  });
  if (p.status !== 0)
    throw new Error(args.join(' ') + ' failed: ' + p.stdout + p.stderr);
  log('PASS ' + cwd.split('/').pop() + ' ' + args.join(' '));
  if (args[0] === 'smoke') log(p.stdout);
}
function start(name, cwd, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);
  let logs = '';
  child.stdout.on('data', (b) => (logs += b));
  child.stderr.on('data', (b) => (logs += b));
  child.on('exit', () => writeFileSync(evidence + '/' + name + '.log', logs));
  return child;
}
async function wait(url) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (r.ok) return;
    } catch {
      /* Wait until the process is listening. */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Startup timeout ' + url);
}
try {
  const compose = YAML.parse(readFileSync(root + '/compose.yaml', 'utf8'));
  assert(
    Object.keys(compose.services).length === 9,
    'Compose YAML defines exactly nine services',
  );
  assert(
    Object.entries(compose.services)
      .filter(([, s]) => s.ports)
      .map(([n]) => n)
      .sort()
      .join(',') === 'api-gateway,web',
    'only web/gateway publish host ports',
  );
  await cluster.initialise();
  await cluster.start();
  const admin = cluster.getPgClient();
  await admin.connect();
  log(
    'PostgreSQL ' +
      (await admin.query('SHOW server_version')).rows[0].server_version,
  );
  for (const s of services) {
    await admin.query(
      `CREATE ROLE ${s}_user LOGIN PASSWORD 'local_${s}_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`,
    );
    await admin.query(`CREATE DATABASE ${s}_db OWNER ${s}_user`);
    await admin.query(`REVOKE ALL ON DATABASE ${s}_db FROM PUBLIC`);
  }
  await admin.query('REVOKE CONNECT ON DATABASE postgres FROM PUBLIC');
  await admin.query('REVOKE CONNECT ON DATABASE template1 FROM PUBLIC');
  for (const s of services) {
    const cwd = root + `/apps/${s}-service`;
    const env = {
      DATABASE_URL: `postgresql://${s}_user:local_${s}_password@127.0.0.1:55432/${s}_db?schema=public&connect_timeout=2&pool_timeout=2`,
    };
    run(['db:migrate'], cwd, env);
    run(['db:migrate'], cwd, env);
    run(['db:seed'], cwd, env);
    run(['db:seed'], cwd, env);
    const own = new pg.Client({ connectionString: env.DATABASE_URL });
    await own.connect();
    assert(
      (await own.query('SELECT count(*)::int AS n FROM foundation_metadata'))
        .rows[0].n === 1,
      s + ' seed idempotency: exactly one marker',
    );
    await own.end();
    for (const other of services.filter((x) => x !== s)) {
      const cross = new pg.Client({
        connectionString: env.DATABASE_URL.replace(
          '/' + s + '_db',
          '/' + other + '_db',
        ),
      });
      let denied = false;
      try {
        await cross.connect();
      } catch (e) {
        denied = e.code === '42501';
      } finally {
        await cross.end().catch(() => {});
      }
      assert(denied, s + ' cannot connect ' + other + '_db');
    }
    start(s, cwd, 'node', ['dist/main.js'], {
      ...env,
      SERVICE_CREDENTIAL: 'local-demo-service-credential-change-me-32chars',
      NODE_ENV: 'test',
      JWT_SECRET: 'native-verification-signing-key-at-least-32-chars',
    });
  }
  await admin.end();
  start('gateway', root + '/apps/api-gateway', 'node', ['dist/main.js'], {
    SERVICE_CREDENTIAL: 'local-demo-service-credential-change-me-32chars',
    NODE_ENV: 'test',
    JWT_SECRET: 'native-verification-signing-key-at-least-32-chars',
  });
  start('web', root + '/apps/web', 'pnpm', ['dev']);
  await Promise.all(
    [8080, 3001, 3002, 3003, 3004, 3005, 3000].map((p) =>
      wait(`http://127.0.0.1:${p}/` + (p === 3000 ? '' : 'health/ready')),
    ),
  );
  run(['smoke'], root, {});
  const correlation = await fetch('http://localhost:8080/health/live', {
    headers: {
      'X-Correlation-Id': 'real-startup-check',
      Origin: 'http://localhost:3000',
    },
  });
  assert(
    correlation.headers.get('x-correlation-id') === 'real-startup-check',
    'real HTTP correlation preserved',
  );
  assert(
    correlation.headers.get('access-control-allow-origin') ===
      'http://localhost:3000',
    'CORS allowlist',
  );
  const blocked = await fetch(
    'http://localhost:8080/internal/v1/stock/reservations',
  );
  assert(blocked.status === 404, 'gateway does not expose internal endpoints');
  browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1365, height: 900 },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:3000/foundation');
  await page.getByText('API Gateway: ok').waitFor();
  assert(
    errors.length === 0,
    'browser renders live Gateway status without page errors',
  );
  await page.screenshot({
    path: evidence + '/dev0-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    'mobile has no horizontal overflow',
  );
  await page.screenshot({
    path: evidence + '/dev0-mobile.png',
    fullPage: true,
  });
  await browser.close();
  browser = undefined;
  await cluster.stop();
  for (const p of [3001, 3002, 3003, 3004, 3005]) {
    const live = await fetch(`http://localhost:${p}/health/live`);
    const ready = await fetch(`http://localhost:${p}/health/ready`, {
      signal: AbortSignal.timeout(15000),
    });
    assert(
      live.status === 200 && ready.status === 503,
      `:${p} database down: live=200 ready=503`,
    );
  }
  log('COMPLETE native runtime verified; Docker/RabbitMQ not executed.');
} catch (e) {
  log('FAIL ' + e.stack);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  for (const c of children) c.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 1200));
  await cluster.stop().catch(() => {});
  writeFileSync(evidence + '/native-verification.log', lines.join('\n') + '\n');
}
