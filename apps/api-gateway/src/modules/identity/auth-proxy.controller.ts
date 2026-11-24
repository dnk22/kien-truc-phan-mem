import { ApiEnvelopeResponses } from '@minimart/config';
import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtGuard, LoginRateLimiter } from '@minimart/auth';
import type { Request, Response } from 'express';
import { IdentityProxyService } from './identity-proxy.service';
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
export class AuthProxyController {
  constructor(
    private readonly proxy: IdentityProxyService,
    private readonly limiter: LoginRateLimiter,
  ) {}
  @Post('login')
  @HttpCode(200)
  @ApiBody({
    schema: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  login(@Req() req: Request, @Res() res: Response) {
    this.limiter.consume(req.ip ?? 'unknown');
    return this.proxy.forward(req, res);
  }
  @Post('refresh') @HttpCode(200) refresh(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Post('logout') @HttpCode(200) logout(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Get('me') @ApiBearerAuth() @UseGuards(JwtGuard) me(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Post('change-password')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string', minLength: 10, maxLength: 64 },
      },
    },
  })
  password(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res);
  }
}
