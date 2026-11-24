import { createServer } from 'node:http';
import { createRuntime, root, commonEnv } from './verification/runtime.mjs';
import { verifyApi } from './verification/api-cases.mjs';
import { verifyBrowser } from './verification/browser-cases.mjs';
const runtime = await createRuntime();
try {
  await runtime.setup();
  const api = await verifyApi(runtime);
  await verifyBrowser(runtime, api);
  runtime.start(
    'rate-gateway',
    root + '/apps/api-gateway',
    'node',
    ['dist/main.js'],
    { PORT: '18080', LOGIN_RATE_LIMIT_MAX: '2' },
  );
  await runtime.wait('http://localhost:18080/health/live');
  api.status(
    await api.login('absent', commonEnv.DEMO_PASSWORD, { port: 18080 }),
    401,
    'rate-limit first attempt',
  );
  api.status(
    await api.login('absent', commonEnv.DEMO_PASSWORD, { port: 18080 }),
    401,
    'rate-limit second attempt',
  );
  api.status(
    await api.login('absent', commonEnv.DEMO_PASSWORD, { port: 18080 }),
    429,
    'HTTP login rate limiting',
  );
  runtime.start(
    'unavailable-gateway',
    root + '/apps/api-gateway',
    'node',
    ['dist/main.js'],
    {
      PORT: '18081',
      IDENTITY_SERVICE_URL: 'http://127.0.0.1:9',
      GATEWAY_TIMEOUT_MS: '100',
    },
  );
  await runtime.wait('http://localhost:18081/health/live');
  api.status(
    await api.login('admin', commonEnv.DEMO_PASSWORD, { port: 18081 }),
    503,
    'unavailable Identity maps to 503',
  );
  const slowServer = createServer((_req, res) => {
    setTimeout(() => res.end('{}'), 300);
  });
  await new Promise((resolve) =>
    slowServer.listen(18082, '127.0.0.1', resolve),
  );
  try {
    runtime.start(
      'timeout-gateway',
      root + '/apps/api-gateway',
      'node',
      ['dist/main.js'],
      {
        PORT: '18083',
        IDENTITY_SERVICE_URL: 'http://127.0.0.1:18082',
        GATEWAY_TIMEOUT_MS: '50',
      },
    );
    await runtime.wait('http://localhost:18083/health/live');
    api.status(
      await api.login('admin', commonEnv.DEMO_PASSWORD, { port: 18083 }),
      503,
      'Identity request timeout maps to 503',
    );
  } finally {
    slowServer.closeAllConnections();
    await new Promise((resolve) => slowServer.close(resolve));
  }
  runtime.log(
    'COMPLETE DEV-1 native API/database/browser integration. Docker/RabbitMQ runtime BLOCKED: no daemon.',
  );
} catch (error) {
  runtime.log('FAIL ' + error.stack);
  process.exitCode = 1;
} finally {
  await runtime.cleanup();
}
