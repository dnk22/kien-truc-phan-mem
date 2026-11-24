import { Module } from '@nestjs/common';
import { JwtGuard, RolesGuard } from '@minimart/auth';
import { ReportProxyService } from './report-proxy.service';
import { ReportProxyController } from './report-proxy.controller';
@Module({
  controllers: [ReportProxyController],
  providers: [ReportProxyService, JwtGuard, RolesGuard],
})
export class ReportProxyModule {}
