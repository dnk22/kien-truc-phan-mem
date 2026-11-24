import { Module } from '@nestjs/common';
import { HealthController, HEALTH_PROBE, ProcessProbe } from '@minimart/config';
import { IdentityProxyModule } from './modules/identity/identity-proxy.module';
@Module({
  imports: [IdentityProxyModule],
  controllers: [HealthController],
  providers: [{ provide: HEALTH_PROBE, useClass: ProcessProbe }],
})
export class AppModule {}
