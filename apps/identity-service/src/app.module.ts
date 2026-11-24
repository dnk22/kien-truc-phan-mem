import { Module } from '@nestjs/common';
import { HealthController, HEALTH_PROBE } from '@minimart/config';
import { DatabaseProbe } from './infrastructure/database/database.probe';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthenticationModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';
@Module({
  imports: [DatabaseModule, AuthenticationModule, UserModule],
  controllers: [HealthController],
  providers: [{ provide: HEALTH_PROBE, useClass: DatabaseProbe }],
})
export class AppModule {}
