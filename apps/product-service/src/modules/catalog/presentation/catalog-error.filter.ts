import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { CatalogError } from '../domain/catalog.errors';
@Catch(CatalogError)
export class CatalogErrorFilter implements ExceptionFilter {
  catch(error: CatalogError, host: ArgumentsHost) {
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
