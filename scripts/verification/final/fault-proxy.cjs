const { Buffer } = require('node:buffer');
const { setTimeout } = require('node:timers');
const http = require('node:http');
let mode = 'normal';
const base = 'http://inventory-service:3003';
http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    if (req.url === '/__control') {
      if (
        req.headers['x-service-credential'] !== process.env.SERVICE_CREDENTIAL
      ) {
        res.writeHead(401);
        res.end();
        return;
      }
      mode = JSON.parse(body.toString()).mode;
      res.end('{}');
      return;
    }
    const action = mode;
    if (
      action === 'before-reserve' &&
      req.method === 'POST' &&
      req.url === '/internal/v1/stock/reservations'
    ) {
      setTimeout(() => res.destroy(), 10000);
      return;
    }
    if (action === 'before-commit' && req.url.endsWith('/commit')) {
      res.writeHead(503, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: { code: 'FAULT_DEPENDENCY_UNAVAILABLE' },
        }),
      );
      return;
    }
    try {
      const response = await globalThis.fetch(base + req.url, {
        method: req.method,
        headers: {
          'content-type': 'application/json',
          'x-service-credential': req.headers['x-service-credential'] ?? '',
          'x-correlation-id': req.headers['x-correlation-id'] ?? '',
        },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
      });
      const result = await response.text();
      if (
        response.ok &&
        ((action === 'after-reserve' &&
          req.url === '/internal/v1/stock/reservations') ||
          (action === 'after-commit' && req.url.endsWith('/commit')))
      ) {
        setTimeout(() => res.destroy(), 30000);
        return;
      }
      res.writeHead(response.status, { 'content-type': 'application/json' });
      res.end(result);
    } catch {
      res.writeHead(503);
      res.end('{}');
    }
  })
  .listen(3903, '0.0.0.0');
