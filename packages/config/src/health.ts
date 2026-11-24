import {
  Controller,
  Get,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
export const HEALTH_PROBE = Symbol('HEALTH_PROBE');
export interface HealthProbe {
  check(): Promise<void>;
}
@Injectable()
export class ProcessProbe implements HealthProbe {
  async check(): Promise<void> {
    /* Gateway has no owned database. */
  }
}
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(HEALTH_PROBE) private readonly probe: HealthProbe) {}
  @Get('live') live() {
    return { status: 'ok', service: process.env.SERVICE_NAME ?? 'unknown' };
  }
  @Get('ready') async ready() {
    try {
      await this.probe.check();
      return this.live();
    } catch {
      throw new ServiceUnavailableException({
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'Service dependency unavailable',
      });
    }
  }
}
