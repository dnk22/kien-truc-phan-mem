import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { success } from '@minimart/config';
import type { Principal } from '@minimart/auth';
import type { ListQuery } from '../domain/inventory.types';
import type { Page } from '../domain/inventory.repository';
import { InventoryError } from '../domain/inventory.errors';
export interface InventoryRequest {
  correlationId?: string;
  principal: Principal;
}
export function pageResponse(
  req: InventoryRequest,
  q: ListQuery,
  result: Page<unknown>,
) {
  return success(req, result.items, {
    page: q.page,
    pageSize: q.pageSize,
    total: result.total,
    totalPages: Math.ceil(result.total / q.pageSize),
  });
}
@Catch(InventoryError)
export class InventoryErrorFilter implements ExceptionFilter {
  catch(error: InventoryError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<{ correlationId?: string }>();
    ctx
      .getResponse<{
        status: (code: number) => { json: (body: unknown) => void };
      }>()
      .status(error.status)
      .json({
        success: false,
        error: { code: error.code, message: error.message },
        meta: { correlationId: req.correlationId ?? '' },
      });
  }
}
