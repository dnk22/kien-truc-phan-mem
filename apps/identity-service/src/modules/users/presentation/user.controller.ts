import { ApiEnvelopeResponses } from '@minimart/config';
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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard } from '@minimart/auth';
import { success } from '@minimart/config';
import {
  IdentityGuard,
  type IdentityRequest,
} from '../../auth/presentation/identity.guard';
import { UserService } from '../application/user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserRoleDto,
  UserStatusDto,
} from './user.dto';
@ApiTags('users')
@ApiBearerAuth()
@Roles('ADMIN')
@UseGuards(IdentityGuard, RolesGuard)
@ApiEnvelopeResponses()
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly users: UserService) {}
  @Get() async list(@Query() query: UserQueryDto, @Req() req: IdentityRequest) {
    const result = await this.users.list(query);
    return success(req, result.items, {
      page: query.page,
      pageSize: query.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / query.pageSize),
    });
  }
  @Get(':id') async get(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IdentityRequest,
  ) {
    return success(req, await this.users.get(id));
  }
  @Post() async create(
    @Body() dto: CreateUserDto,
    @Req() req: IdentityRequest,
  ) {
    return success(req, await this.users.create(req.user.id, dto));
  }
  @Patch(':id') async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: IdentityRequest,
  ) {
    return success(req, await this.users.update(req.user.id, id, dto));
  }
  @Patch(':id/status') async status(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UserStatusDto,
    @Req() req: IdentityRequest,
  ) {
    return success(req, await this.users.update(req.user.id, id, dto));
  }
  @Patch(':id/role') async role(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UserRoleDto,
    @Req() req: IdentityRequest,
  ) {
    return success(req, await this.users.update(req.user.id, id, dto));
  }
}
