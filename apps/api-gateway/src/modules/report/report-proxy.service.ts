import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Request, Response } from 'express';
@Injectable()
export class ReportProxyService {
  async forward(req: Request & { correlationId?: string }, res: Response) {
    res.setHeader('cache-control', 'no-store');
    const base = process.env.REPORT_SERVICE_URL ?? 'http://127.0.0.1:3005';
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-correlation-id': req.correlationId ?? '',
      'x-service-credential': process.env.SERVICE_CREDENTIAL ?? '',
    };
    for (const name of [
      'authorization',
      'cookie',
      'origin',
      'x-csrf-protection',
    ]) {
      const value = req.headers[name];
      if (typeof value === 'string') headers[name] = value;
    }
    let result: globalThis.Response;
    try {
      result = await fetch(new URL(req.originalUrl, base), {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method)
          ? undefined
          : JSON.stringify(req.body ?? {}),
        signal: AbortSignal.timeout(
          Number(process.env.GATEWAY_TIMEOUT_MS ?? 5000),
        ),
        redirect: 'manual',
      });
      const body = await result.text();
      res.status(result.status);
      for (const name of [
        'content-type',
        'cache-control',
        'x-correlation-id',
      ]) {
        const value = result.headers.get(name);
        if (value) res.setHeader(name, value);
      }
      const cookies = result.headers.getSetCookie();
      if (cookies.length) res.setHeader('set-cookie', cookies);
      res.send(body);
    } catch {
      throw new ServiceUnavailableException({
        code: 'REPORT_UNAVAILABLE',
        message: 'Dịch vụ báo cáo chưa sẵn sàng.',
      });
    }
  }
}
