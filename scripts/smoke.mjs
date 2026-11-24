const urls = [8080, 3001, 3002, 3003, 3004, 3005];
let failed = false;
for (const port of urls) {
  for (const route of ['/health/live', '/health/ready', '/docs-json']) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${route}`, {
        signal: AbortSignal.timeout(5000),
      });
      console.log(
        `${response.ok ? 'PASS' : 'FAIL'} :${port}${route} HTTP ${response.status}`,
      );
      if (!response.ok) failed = true;
    } catch {
      console.log(`FAIL :${port}${route} unreachable`);
      failed = true;
    }
  }
}
try {
  const response = await fetch('http://127.0.0.1:3000', {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok || !(await response.text()).includes('root'))
    throw new Error('invalid HTML');
  console.log('PASS web HTML');
} catch {
  console.log('FAIL web HTML');
  failed = true;
}
process.exitCode = failed ? 1 : 0;
