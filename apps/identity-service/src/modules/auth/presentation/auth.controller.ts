import { ApiEnvelopeResponses } from '@minimart/config';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { LoginRateLimiter } from '@minimart/auth';
import { success } from '@minimart/config';
import type { Response } from 'express';
import { AuthService } from '../application/auth.service';
import { userProfile } from '../../users/application/user.mapper';
import { IdentityGuard, type IdentityRequest } from './identity.guard';
import { CsrfGuard } from './csrf.guard';
import { ChangePasswordDto, LoginDto } from './auth.dto';
import { refreshCookie, writeRefreshCookie } from './cookies';
@ApiTags('auth')
@ApiHeader({
  name: 'X-CSRF-Protection',
  required: true,
  schema: { type: 'string', enum: ['1'], default: '1' },
  description:
    'Required for cookie auth actions. Origin must be in CSRF_ALLOWED_ORIGINS.',
})
@ApiEnvelopeResponses()
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly limiter: LoginRateLimiter,
  ) {}
  @Post('login')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async login(
    @Body() dto: LoginDto,
    @Req() req: IdentityRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.limiter.consume(`${req.ip}:${dto.username}`);
    const result = await this.auth.login(dto.username, dto.password);
    writeRefreshCookie(res, result.refreshToken);
    return success(req, result.data);
  }
  @Post('refresh')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async refresh(
    @Req() req: IdentityRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.auth.refresh(refreshCookie(req));
      writeRefreshCookie(res, result.refreshToken);
      return success(req, result.data);
    } catch (error) {
      writeRefreshCookie(res, '', true);
      throw error;
    }
  }
  @Post('logout')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async logout(
    @Req() req: IdentityRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.logout(refreshCookie(req));
    writeRefreshCookie(res, '', true);
    return success(req, result);
  }
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(IdentityGuard)
  me(@Req() req: IdentityRequest, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return success(req, userProfile(req.user));
  }
  @Post('change-password')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(IdentityGuard, CsrfGuard)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: IdentityRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    writeRefreshCookie(res, '', true);
    return success(req, result);
  }
}
