import { Injectable } from '@nestjs/common';
import type { ApiSuccess, ApiFailure } from '@minimart/contracts';
import { RemoteError } from '../domain/sales.errors';
@Injectable()
export class InternalHttpClient {
  async request<T>(
    base: string,
    path: string,
    method: 'GET' | 'POST',
    body?: unknown,
    correlationId?: string,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(new URL(path, base), {
        method,
        headers: {
          'content-type': 'application/json',
          'x-service-credential': process.env.SERVICE_CREDENTIAL ?? '',
          'x-correlation-id': correlationId ?? '',
        },
        body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
        signal: AbortSignal.timeout(4000),
        redirect: 'error',
      });
    } catch {
      throw new RemoteError(503, 'REMOTE_OUTCOME_UNKNOWN');
    }
    let envelope: ApiSuccess<T> | ApiFailure;
    try {
      envelope = (await response.json()) as ApiSuccess<T> | ApiFailure;
    } catch {
      throw new RemoteError(503, 'INVALID_REMOTE_RESPONSE');
    }
    if (!response.ok || !envelope.success)
      throw new RemoteError(
        response.status,
        envelope.success ? 'REMOTE_ERROR' : envelope.error.code,
      );
    return envelope.data;
  }
}
