import { createRequire } from 'node:module';
import { root, commonEnv, requireTool } from './runtime.mjs';
const jwt = createRequire(root + '/packages/auth/package.json')('jsonwebtoken');
const bcrypt = createRequire(root + '/apps/identity-service/package.json')(
  'bcrypt',
);
export async function verifyApi(runtime) {
  const { check, log, run, urls } = runtime;
  const pg = requireTool('pg');
  const db = new pg.Client({ connectionString: urls.identity });
  await db.connect();
  async function call(
    path,
    { method = 'GET', data, token, cookie, headers = {}, port = 8080 } = {},
  ) {
    const response = await fetch(`http://localhost:${port}/api/v1${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        'X-CSRF-Protection': '1',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.json();
    check(
      !JSON.stringify(body).includes('passwordHash') &&
        !JSON.stringify(body).includes('password_hash') &&
        !JSON.stringify(body).includes('tokenHash'),
      'response excludes credential hashes: ' +
        method +
        ' ' +
        path +
        ' ' +
        response.status,
    );
    return {
      status: response.status,
      body,
      cookie: response.headers.get('set-cookie')?.split(';')[0],
      response,
    };
  }
  async function login(
    username,
    password = commonEnv.DEMO_PASSWORD,
    extra = {},
  ) {
    return call('/auth/login', {
      method: 'POST',
      data: { username, password },
      ...extra,
    });
  }
  function status(result, expected, label) {
    check(
      result.status === expected,
      `${label}: expected ${expected}, got ${result.status}`,
    );
    return result;
  }
  try {
    check(
      (await db.query('SELECT count(*)::int AS n FROM users')).rows[0].n === 4,
      'exactly four seeded demo users',
    );
    check(
      (await db.query('SELECT value FROM foundation_metadata')).rows[0]
        .value === 'DEV-0',
      'upgrade preserves DEV-0 marker',
    );
    const cashierBefore = (
      await db.query("SELECT * FROM users WHERE username='cashier'")
    ).rows[0];
    await db.query(
      "UPDATE users SET status='LOCKED', full_name='Seed preservation', password_hash='changed-hash' WHERE username='cashier'",
    );
    run(['db:seed'], root + '/apps/identity-service', {
      DATABASE_URL: urls.identity,
    });
    const changed = (
      await db.query("SELECT * FROM users WHERE username='cashier'")
    ).rows[0];
    check(
      changed.status === 'LOCKED' &&
        changed.password_hash === 'changed-hash' &&
        changed.full_name === 'Seed preservation',
      'seed preserves edited password/status/profile',
    );
    await db.query(
      "UPDATE users SET status='ACTIVE', full_name=$1, password_hash=$2 WHERE username='cashier'",
      [cashierBefore.full_name, cashierBefore.password_hash],
    );
    const { spawnSync } = await import('node:child_process');
    const productionSeed = spawnSync('pnpm', ['db:seed'], {
      cwd: root + '/apps/identity-service',
      env: {
        ...process.env,
        ...commonEnv,
        DATABASE_URL: urls.identity,
        NODE_ENV: 'production',
        DEMO_SEED_ENABLED: 'true',
      },
      encoding: 'utf8',
    });
    check(
      productionSeed.status !== 0 &&
        (await db.query('SELECT count(*)::int AS n FROM users')).rows[0].n ===
          4,
      'production demo seed refused without adding users',
    );
    const sessions = {};
    for (const username of ['admin', 'manager', 'cashier', 'warehouse']) {
      const result = status(await login(username), 200, username + ' login');
      sessions[username] = result;
      check(
        result.body.data.user.role === username.toUpperCase(),
        username + ' role',
      );
      check(
        /HttpOnly/i.test(result.response.headers.get('set-cookie')) &&
          /SameSite=Lax/i.test(result.response.headers.get('set-cookie')),
        'HttpOnly/SameSite refresh cookie',
      );
    }
    let admin = sessions.admin.body.data.accessToken;
    status(
      await login('admin', commonEnv.DEMO_PASSWORD, {
        headers: { Origin: 'http://localhost:8080' },
      }),
      200,
      'explicitly trusted Swagger origin may authenticate',
    );
    const correlated = status(
      await call('/auth/me', {
        token: admin,
        headers: { 'X-Correlation-Id': 'dev1-cross-service-check' },
      }),
      200,
      'protected me through Gateway',
    );
    check(
      correlated.body.meta.correlationId === 'dev1-cross-service-check' &&
        correlated.response.headers.get('x-correlation-id') ===
          'dev1-cross-service-check',
      'correlation ID propagates Gateway to Identity and response',
    );
    check(
      correlated.response.headers.get('access-control-allow-credentials') ===
        'true',
      'Gateway CORS allows cookie credentials for configured origin',
    );

    status(await login('admin', 'WrongPassword'), 401, 'wrong password');
    status(await login('absent'), 401, 'unknown account');
    status(await call('/users'), 401, 'missing JWT');
    status(await call('/users', { token: 'invalid' }), 401, 'invalid JWT');
    for (const username of ['manager', 'cashier', 'warehouse']) {
      status(
        await call('/users', {
          token: sessions[username].body.data.accessToken,
          headers: { 'X-Role': 'ADMIN', 'X-User-Role': 'ADMIN' },
        }),
        403,
        username + ' cannot spoof admin',
      );
      status(
        await call('/users', {
          port: 3001,
          token: sessions[username].body.data.accessToken,
        }),
        403,
        'Identity independently denies ' + username,
      );
    }
    const claims = jwt.decode(admin);
    delete claims.iat;
    delete claims.exp;
    delete claims.iss;
    delete claims.aud;
    const expired = jwt.sign(claims, commonEnv.JWT_SECRET, {
      expiresIn: -1,
      issuer: commonEnv.JWT_ISSUER,
      audience: commonEnv.JWT_AUDIENCE,
    });
    status(await call('/auth/me', { token: expired }), 401, 'expired JWT');
    const wrongIssuer = jwt.sign(claims, commonEnv.JWT_SECRET, {
      expiresIn: 60,
      issuer: 'attacker',
      audience: commonEnv.JWT_AUDIENCE,
    });
    status(await call('/auth/me', { token: wrongIssuer }), 401, 'wrong issuer');
    status(
      await call('/auth/refresh', {
        method: 'POST',
        cookie: sessions.manager.cookie,
        headers: { Origin: 'https://untrusted.example' },
      }),
      403,
      'CSRF untrusted origin',
    );
    status(
      await call('/auth/logout', {
        method: 'POST',
        cookie: sessions.manager.cookie,
        headers: { 'X-CSRF-Protection': '' },
      }),
      403,
      'CSRF missing custom header',
    );
    const rotated = status(
      await call('/auth/refresh', {
        method: 'POST',
        cookie: sessions.manager.cookie,
      }),
      200,
      'refresh rotation',
    );
    check(
      rotated.cookie !== sessions.manager.cookie,
      'rotation replaces opaque refresh token',
    );
    status(
      await call('/auth/me', { token: sessions.manager.body.data.accessToken }),
      401,
      'rotation invalidates previous session access',
    );
    status(
      await call('/auth/refresh', {
        method: 'POST',
        cookie: sessions.manager.cookie,
      }),
      401,
      'refresh replay rejected',
    );
    status(
      await call('/auth/refresh', { method: 'POST', cookie: rotated.cookie }),
      401,
      'refresh replay revokes token family',
    );
    const logoutLogin = await login('manager');
    status(
      await call('/auth/logout', {
        method: 'POST',
        cookie: logoutLogin.cookie,
      }),
      200,
      'logout',
    );
    status(
      await call('/auth/me', { token: logoutLogin.body.data.accessToken }),
      401,
      'logout revokes access at Identity',
    );
    status(
      await call('/auth/refresh', {
        method: 'POST',
        cookie: logoutLogin.cookie,
      }),
      401,
      'logout revokes refresh',
    );
    status(
      await call('/auth/logout', { method: 'POST' }),
      200,
      'logout idempotent without cookie',
    );
    const create = {
      username: 'api_employee',
      password: 'InitialPassword!2026',
      fullName: 'Nhân viên kiểm thử',
      role: 'CASHIER',
      email: 'employee@example.test',
    };
    const created = status(
      await call('/users', { method: 'POST', data: create, token: admin }),
      201,
      'create user',
    );
    const id = created.body.data.id;
    const stored = (
      await db.query('SELECT password_hash FROM users WHERE id=$1', [id])
    ).rows[0].password_hash;
    check(
      stored !== create.password &&
        (await bcrypt.compare(create.password, stored)),
      'password stored as bcrypt hash',
    );
    status(
      await call('/users', { method: 'POST', data: create, token: admin }),
      409,
      'database unique username',
    );
    status(
      await call('/users', {
        method: 'POST',
        data: { ...create, username: 'x', role: 'OWNER', password: 'short' },
        token: admin,
      }),
      400,
      'input validation',
    );
    status(
      await call('/users/' + id, {
        method: 'PATCH',
        data: { role: 'ADMIN' },
        token: admin,
      }),
      400,
      'profile cannot change role through unknown property',
    );
    status(
      await call('/users/' + id, {
        method: 'PATCH',
        data: {
          fullName: 'Nhân viên đã cập nhật',
          email: null,
          phone: '+84912345678',
        },
        token: admin,
      }),
      200,
      'update profile',
    );
    const listed = status(
      await call(
        '/users?search=đã%20cập%20nhật&role=CASHIER&status=ACTIVE&page=1&pageSize=1',
        { token: admin },
      ),
      200,
      'filtered/paginated list',
    );
    check(
      listed.body.meta.total === 1 &&
        listed.body.data.length === 1 &&
        listed.body.meta.pageSize === 1,
      'pagination metadata and search',
    );
    status(await call('/users/' + id, { token: admin }), 200, 'user detail');
    status(
      await call('/users/not-a-uuid', { token: admin }),
      400,
      'UUID validation',
    );
    status(
      await call('/users/00000000-0000-4000-8000-000000000000', {
        token: admin,
      }),
      404,
      'missing user',
    );
    const beforeLock = await login('api_employee', create.password);
    status(
      await call('/users/' + id + '/status', {
        method: 'PATCH',
        data: { status: 'LOCKED' },
        token: admin,
      }),
      200,
      'lock user',
    );
    status(
      await login('api_employee', create.password),
      401,
      'locked account login',
    );
    status(
      await call('/auth/me', { token: beforeLock.body.data.accessToken }),
      401,
      'lock revokes existing access',
    );
    status(
      await call('/auth/refresh', {
        method: 'POST',
        cookie: beforeLock.cookie,
      }),
      401,
      'lock revokes refresh',
    );
    status(
      await call('/users/' + id + '/status', {
        method: 'PATCH',
        data: { status: 'ACTIVE' },
        token: admin,
      }),
      200,
      'unlock user',
    );
    const beforeRole = await login('api_employee', create.password);
    status(
      await call('/users/' + id + '/role', {
        method: 'PATCH',
        data: { role: 'WAREHOUSE' },
        token: admin,
      }),
      200,
      'change role',
    );
    status(
      await call('/auth/me', { token: beforeRole.body.data.accessToken }),
      401,
      'role change revokes old access',
    );
    const passwordLogin = await login('api_employee', create.password);
    status(
      await call('/auth/change-password', {
        method: 'POST',
        token: passwordLogin.body.data.accessToken,
        data: { currentPassword: 'wrong', newPassword: 'UpdatedPassword!2026' },
      }),
      401,
      'wrong current password',
    );
    status(
      await call('/auth/change-password', {
        method: 'POST',
        token: passwordLogin.body.data.accessToken,
        data: {
          currentPassword: create.password,
          newPassword: 'UpdatedPassword!2026',
        },
      }),
      200,
      'change password',
    );
    status(
      await call('/auth/me', { token: passwordLogin.body.data.accessToken }),
      401,
      'password change revokes access',
    );
    status(
      await call('/auth/refresh', {
        method: 'POST',
        cookie: passwordLogin.cookie,
      }),
      401,
      'password change revokes refresh',
    );
    status(
      await login('api_employee', create.password),
      401,
      'old password rejected',
    );
    status(
      await login('api_employee', 'UpdatedPassword!2026'),
      200,
      'new password accepted',
    );
    const selfId = sessions.admin.body.data.user.id;
    status(
      await call(`/users/${selfId}/status`, {
        method: 'PATCH',
        token: admin,
        data: { status: 'LOCKED' },
      }),
      409,
      'last active admin cannot lock',
    );
    status(
      await call(`/users/${selfId}/role`, {
        method: 'PATCH',
        token: admin,
        data: { role: 'MANAGER' },
      }),
      409,
      'last active admin cannot demote',
    );
    const second = status(
      await call('/users', {
        method: 'POST',
        token: admin,
        data: {
          username: 'second_admin',
          password: create.password,
          fullName: 'Admin thứ hai',
          role: 'ADMIN',
        },
      }),
      201,
      'create second admin',
    );
    const secondLogin = await login('second_admin', create.password);
    const concurrent = await Promise.all([
      call(`/users/${selfId}/status`, {
        method: 'PATCH',
        token: admin,
        data: { status: 'LOCKED' },
      }),
      call(`/users/${second.body.data.id}/status`, {
        method: 'PATCH',
        token: secondLogin.body.data.accessToken,
        data: { status: 'LOCKED' },
      }),
    ]);
    check(
      concurrent.filter((r) => r.status === 200).length === 1 &&
        concurrent.every((r) => [200, 403, 409].includes(r.status)),
      'concurrent locking leaves one active admin',
    );
    check(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM users WHERE role='ADMIN' AND status='ACTIVE'",
        )
      ).rows[0].n === 1,
      'last-admin DB invariant after competing locks',
    );
    // Restore the isolated fixture for subsequent browser tests, not a live database.
    await db.query("UPDATE users SET status='ACTIVE' WHERE username='admin'");
    admin = (await login('admin')).body.data.accessToken;
    if (
      (await db.query("SELECT status FROM users WHERE username='second_admin'"))
        .rows[0].status === 'LOCKED'
    )
      status(
        await call(`/users/${second.body.data.id}/status`, {
          method: 'PATCH',
          token: admin,
          data: { status: 'ACTIVE' },
        }),
        200,
        'restore second admin fixture',
      );
    const secondAgain = await login('second_admin', create.password);
    const demotions = await Promise.all([
      call(`/users/${selfId}/role`, {
        method: 'PATCH',
        token: admin,
        data: { role: 'MANAGER' },
      }),
      call(`/users/${second.body.data.id}/role`, {
        method: 'PATCH',
        token: secondAgain.body.data.accessToken,
        data: { role: 'MANAGER' },
      }),
    ]);
    check(
      demotions.filter((r) => r.status === 200).length === 1 &&
        demotions.every((r) => [200, 403, 409].includes(r.status)),
      'concurrent demotions preserve one admin',
    );
    check(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM users WHERE role='ADMIN' AND status='ACTIVE'",
        )
      ).rows[0].n === 1,
      'last-admin DB invariant after competing demotions',
    );
    await db.query(
      "UPDATE users SET role='ADMIN',status='ACTIVE' WHERE username='admin'",
    );
    const raceLogin = await login('cashier');
    const races = await Promise.all([
      call('/auth/refresh', { method: 'POST', cookie: raceLogin.cookie }),
      call('/auth/refresh', { method: 'POST', cookie: raceLogin.cookie }),
    ]);
    check(
      races.filter((r) => r.status === 200).length === 1 &&
        races.filter((r) => r.status === 401).length === 1,
      'concurrent refresh accepts one rotation, rejects replay',
    );
    const winner = races.find((r) => r.status === 200);
    status(
      await call('/auth/me', { token: winner.body.data.accessToken }),
      401,
      'concurrent refresh replay revokes the family',
    );
    const hashes = (await db.query('SELECT token_hash FROM refresh_sessions'))
      .rows;
    check(
      hashes.length > 0 &&
        hashes.every((row) => /^[a-f0-9]{64}$/.test(row.token_hash)),
      'only refresh hashes persisted',
    );
    const invalidRefresh = await login('warehouse');
    const raw = invalidRefresh.cookie.split('=')[1];
    const crypto = await import('node:crypto');
    await db.query(
      "UPDATE refresh_sessions SET expires_at=CURRENT_TIMESTAMP-interval '1 second' WHERE token_hash=$1",
      [crypto.createHash('sha256').update(raw).digest('hex')],
    );
    status(
      await call('/auth/refresh', {
        method: 'POST',
        cookie: invalidRefresh.cookie,
      }),
      401,
      'expired refresh rejected',
    );
    log('API integration cases complete');
    return { call, login, status };
  } finally {
    await db.end();
  }
}
