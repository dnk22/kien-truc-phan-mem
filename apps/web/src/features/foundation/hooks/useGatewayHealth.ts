import { useQuery } from '@tanstack/react-query';
import { getGatewayHealth } from '../api/health';
export function useGatewayHealth() {
  return useQuery({
    queryKey: ['gateway-health'],
    queryFn: getGatewayHealth,
    refetchInterval: 15000,
  });
}
