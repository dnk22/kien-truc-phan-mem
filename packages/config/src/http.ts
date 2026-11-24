import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
interface Request extends IncomingMessage {
  correlationId?: string;
}
export function correlationMiddleware(
  req: Request,
  res: ServerResponse,
  next: () => void,
) {
  const id = req.headers['x-correlation-id'];
  req.correlationId =
    typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id)
      ? id
      : randomUUID();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<ServerResponse>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    const body =
      error instanceof HttpException ? error.getResponse() : undefined;
    const detail =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>)
        : {};
    const message =
      status >= 500
        ? 'Service unavailable'
        : typeof detail.message === 'string'
          ? detail.message
          : Array.isArray(detail.message)
            ? detail.message.join('; ')
            : 'Request rejected';
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: { code: detail.code ?? `HTTP_${status}`, message },
        meta: { correlationId: req.correlationId ?? randomUUID() },
      }),
    );
  }
}
