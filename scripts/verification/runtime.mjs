import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
export const requireTool = createRequire(
  '/tmp/minimart-verification/package.json',
);
export const root = process.cwd();
export const evidence = root + '/docs/evidence/dev1';
export const commonEnv = {
  NODE_ENV: 'test',
  SERVICE_CREDENTIAL: 'native-dev1-service-credential-at-least-32-chars',
  JWT_SECRET: 'native-dev1-signing-secret-at-least-32-characters',
  JWT_ISSUER: 'minimart-identity',
  JWT_AUDIENCE: 'minimart-api',
  JWT_ACCESS_TTL_SECONDS: '300',
  CORS_ORIGIN: 'http://localhost:3000',
  CSRF_ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:8080',
  COOKIE_SECURE: 'false',
  DEMO_SEED_ENABLED: 'true',
  DEMO_PASSWORD: 'MiniMartDemo!2026',
  LOGIN_RATE_LIMIT_MAX: '200',
};
export async function createRuntime() {
  mkdirSync(evidence, { recursive: true });
  const { default: EmbeddedPostgres } = await import(
    requireTool.resolve('embedded-postgres')
  );
  const cluster = new EmbeddedPostgres({
    databaseDir: '/tmp/minimart-verification/dev1-database',
    user: 'minimart_bootstrap',
    password: 'verification_password',
    port: 55433,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });
  const children = [];
  const lines = [];
  function log(message) {
    console.log(message);
    lines.push(message);
  }
  function check(ok, message) {
    if (!ok) throw new Error(message);
    log('PASS ' + message);
  }
  function run(args, cwd, env = {}) {
    const p = spawnSync('pnpm', args, {
      cwd,
      env: { ...process.env, ...commonEnv, ...env },
      encoding: 'utf8',
      timeout: 60000,
    });
    if (p.status !== 0)
      throw new Error(args.join(' ') + ' failed: ' + p.stdout + p.stderr);
    log('PASS ' + cwd.split('/').pop() + ' ' + args.join(' '));
    return p.stdout;
  }
  function start(name, cwd, command, args, env = {}) {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...commonEnv, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    let output = '';
    child.stdout.on('data', (data) => {
      output += data;
    });
    child.stderr.on('data', (data) => {
      output += data;
    });
    child.on('exit', () =>
      writeFileSync(evidence + '/' + name + '.log', output),
    );
    return child;
  }
  async function wait(url) {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(url, { signal: AbortSignal.timeout(700) })).ok) return;
      } catch {
        /* Retry startup only. */
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error('Startup timeout: ' + url);
  }
  async function cleanup() {
    for (const child of children) child.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 1000));
    await cluster.stop().catch(() => {});
    writeFileSync(evidence + '/verification.log', lines.join('\n') + '\n');
  }
  const urls = {};
  async function setup() {
    for (const port of [
      3000, 3001, 3002, 3003, 3004, 3005, 8080, 18080, 18081, 18082, 18083,
      55433,
    ]) {
      await new Promise((resolve, reject) => {
        const server = createServer();
        server.once('error', () => reject(new Error('Port occupied: ' + port)));
        server.listen(port, '127.0.0.1', () => server.close(resolve));
      });
    }
    await cluster.initialise();
    await cluster.start();
    const admin = cluster.getPgClient();
    await admin.connect();
    const services = ['identity', 'product', 'inventory', 'sales', 'report'];
    for (const service of services) {
      await admin.query(
        `CREATE ROLE ${service}_user LOGIN PASSWORD 'verification_password' NOSUPERUSER NOCREATEDB NOCREATEROLE`,
      );
      await admin.query(`CREATE DATABASE ${service}_db OWNER ${service}_user`);
      await admin.query(`REVOKE ALL ON DATABASE ${service}_db FROM PUBLIC`);
      urls[service] =
        `postgresql://${service}_user:verification_password@127.0.0.1:55433/${service}_db?schema=public&connect_timeout=2&pool_timeout=2`;
    }
    const pg = requireTool('pg');
    const old = new pg.Client({ connectionString: urls.identity });
    await old.connect();
    await old.query(
      readFileSync(
        root +
          '/apps/identity-service/prisma/migrations/20261124000000_foundation/migration.sql',
        'utf8',
      ),
    );
    await old.query(
      "INSERT INTO foundation_metadata VALUES ('milestone','DEV-0',CURRENT_TIMESTAMP)",
    );
    await old.end();
    run(
      [
        'exec',
        'prisma',
        'migrate',
        'resolve',
        '--applied',
        '20261124000000_foundation',
      ],
      root + '/apps/identity-service',
      { DATABASE_URL: urls.identity },
    );
    for (const service of services) {
      const cwd = root + `/apps/${service}-service`;
      const env = { DATABASE_URL: urls[service] };
      run(['db:migrate'], cwd, env);
      run(['db:migrate'], cwd, env);
      run(['db:seed'], cwd, env);
      run(['db:seed'], cwd, env);
      start(service, cwd, 'node', ['dist/main.js'], env);
    }
    await admin.end();
    start('gateway', root + '/apps/api-gateway', 'node', ['dist/main.js']);
    start('web', root + '/apps/web', 'pnpm', ['dev'], {
      NODE_ENV: 'development',
    });
    await Promise.all(
      [8080, 3001, 3002, 3003, 3004, 3005].map((p) =>
        wait(`http://localhost:${p}/health/ready`),
      ),
    );
    await wait('http://localhost:3000');
    log(run(['smoke'], root));
  }
  return { check, log, run, start, wait, cleanup, setup, urls };
}
