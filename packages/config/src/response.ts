import type { ApiSuccess } from '@minimart/contracts';
export function success<T>(
  req: { correlationId?: string },
  data: T,
  meta: Record<string, unknown> = {},
): ApiSuccess<T> {
  return {
    success: true,
    data,
    meta: { ...meta, correlationId: req.correlationId ?? '' },
  };
}
