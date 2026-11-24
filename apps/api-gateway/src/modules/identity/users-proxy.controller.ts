import { ApiEnvelopeResponses } from '@minimart/config';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtGuard, Roles, RolesGuard } from '@minimart/auth';
import type { Request, Response } from 'express';
import { IdentityProxyService } from './identity-proxy.service';
const userSchema = {
  type: 'object' as const,
  properties: {
    username: { type: 'string' },
    password: { type: 'string', minLength: 10, maxLength: 64 },
    fullName: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    role: {
      type: 'string',
      enum: ['ADMIN', 'MANAGER', 'CASHIER', 'WAREHOUSE'],
    },
  },
};
@ApiTags('users')
@ApiBearerAuth()
@Roles('ADMIN')
@UseGuards(JwtGuard, RolesGuard)
@ApiEnvelopeResponses()
@Controller('api/v1/users')
export class UsersProxyController {
  constructor(private readonly proxy: IdentityProxyService) {}
  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  list(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res);
  }
  @Get(':id') get(
    @Param('id', ParseUUIDPipe) _id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Post()
  @ApiBody({
    schema: {
      ...userSchema,
      required: ['username', 'password', 'fullName', 'role'],
    },
  })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res);
  }
  @Patch(':id')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        email: { type: 'string', nullable: true },
        phone: { type: 'string', nullable: true },
      },
    },
  })
  update(
    @Param('id', ParseUUIDPipe) _id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Patch(':id/status')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: { status: { type: 'string', enum: ['ACTIVE', 'LOCKED'] } },
    },
  })
  status(
    @Param('id', ParseUUIDPipe) _id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Patch(':id/role')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role'],
      properties: {
        role: {
          type: 'string',
          enum: ['ADMIN', 'MANAGER', 'CASHIER', 'WAREHOUSE'],
        },
      },
    },
  })
  role(
    @Param('id', ParseUUIDPipe) _id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
}
