import { bootstrap } from '@minimart/config';
import { AppModule } from './app.module';
void bootstrap(AppModule, 'sales-service', 3004, 'sales_db').catch(() => {
  process.stderr.write('Startup failed: verify environment and dependencies\n');
  process.exitCode = 1;
});
