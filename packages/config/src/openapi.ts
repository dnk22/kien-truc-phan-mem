import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiResponse } from '@nestjs/swagger';
export function ApiEnvelopeResponses() {
  return applyDecorators(
    ApiHeader({
      name: 'X-Correlation-Id',
      required: false,
      description:
        '1–64 ASCII letters, numbers, underscore or hyphen; echoed in response.',
    }),
    ...[400, 401, 403, 404, 409, 429, 503].map((status) =>
      ApiResponse({
        status,
        description: (
          {
            400: 'Validation error',
            401: 'Unauthenticated/session expired or revoked',
            403: 'Forbidden/CSRF rejected',
            404: 'Resource not found',
            409: 'Username conflict/last active admin',
            429: 'Login rate limited',
            503: 'Dependency unavailable',
          } as Record<number, string>
        )[status],
        schema: {
          type: 'object',
          required: ['success', 'error', 'meta'],
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
            meta: {
              type: 'object',
              properties: { correlationId: { type: 'string' } },
            },
          },
        },
      }),
    ),
  );
}
