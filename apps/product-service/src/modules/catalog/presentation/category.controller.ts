import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Roles, RolesGuard } from '@minimart/auth';
import { success } from '@minimart/config';
import { CategoryService } from '../application/category.service';
import { CatalogSessionGuard } from './catalog-session.guard';
import { CatalogErrorFilter } from './catalog-error.filter';
import { categoryInput, catalogQuery, statusInput } from './catalog.validation';
type RequestContext = { correlationId?: string };
@Controller('api/v1/categories')
@UseGuards(CatalogSessionGuard, RolesGuard)
@UseFilters(CatalogErrorFilter)
@Roles('MANAGER', 'CASHIER', 'WAREHOUSE')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}
  @Get() async list(@Query() query: unknown, @Req() req: RequestContext) {
    const q = catalogQuery(query);
    const result = await this.service.list(q);
    return success(req, result.items, {
      page: q.page,
      pageSize: q.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / q.pageSize),
    });
  }
  @Get(':id') async get(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestContext,
  ) {
    return success(req, await this.service.get(id));
  }
  @Post() @Roles('MANAGER') async create(
    @Body() body: unknown,
    @Req() req: RequestContext,
  ) {
    return success(req, await this.service.create(categoryInput(body, false)));
  }
  @Patch(':id') @Roles('MANAGER') async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Req() req: RequestContext,
  ) {
    return success(
      req,
      await this.service.update(id, categoryInput(body, true)),
    );
  }
  @Patch(':id/status') @Roles('MANAGER') async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Req() req: RequestContext,
  ) {
    return success(
      req,
      await this.service.update(id, { status: statusInput(body) }),
    );
  }
}
