import { bootstrap } from '@minimart/config';
import { AppModule } from './app.module';
void bootstrap(AppModule, 'report-service', 3005, 'report_db').catch(() => {
  process.stderr.write('Startup failed: verify environment and dependencies\n');
  process.exitCode = 1;
});
