import { bootstrap } from '@minimart/config';
import { AppModule } from './app.module';
void bootstrap(AppModule, 'product-service', 3002, 'product_db').catch(() => {
  process.stderr.write('Startup failed: verify environment and dependencies\n');
  process.exitCode = 1;
});
