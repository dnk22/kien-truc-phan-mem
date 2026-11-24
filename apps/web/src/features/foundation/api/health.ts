import type { HealthStatus } from '@minimart/contracts';
import { client } from '../../../shared/api/client';
export async function getGatewayHealth(): Promise<HealthStatus> {
  return (await client.get<HealthStatus>('/health/ready')).data;
}
