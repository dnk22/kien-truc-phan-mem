import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { LiveSessionGuard, Roles, RolesGuard } from '@minimart/auth';
import { success } from '@minimart/config';
import { InvoiceService } from '../application/invoice.service';
import { invoiceQuery } from './sales.validation';
import {
  publicInvoice,
  SalesErrorFilter,
  type SalesRequest,
} from './sales-http';
@Controller('api/v1/invoices')
@UseGuards(LiveSessionGuard, RolesGuard)
@UseFilters(SalesErrorFilter)
@Roles('MANAGER', 'CASHIER')
export class InvoiceController {
  constructor(private readonly invoices: InvoiceService) {}
  @Get()
  async list(@Query() query: unknown, @Req() req: SalesRequest) {
    const q = invoiceQuery(query);
    const result = await this.invoices.list({
      ...q,
      cashierId:
        req.principal.role === 'CASHIER' ? req.principal.sub : undefined,
    });
    return success(req, result.items.map(publicInvoice), {
      page: q.page,
      pageSize: q.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / q.pageSize),
    });
  }
  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string, @Req() req: SalesRequest) {
    return success(
      req,
      publicInvoice(
        await this.invoices.get(
          id,
          req.principal.role === 'CASHIER' ? req.principal.sub : undefined,
        ),
      ),
    );
  }
}
