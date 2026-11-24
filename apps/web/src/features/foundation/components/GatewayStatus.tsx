import { Alert, Spin } from 'antd';
import { useGatewayHealth } from '../hooks/useGatewayHealth';
export function GatewayStatus() {
  const health = useGatewayHealth();
  if (health.isPending)
    return (
      <Spin tip="Đang kiểm tra Gateway">
        <div style={{ minHeight: 40 }} />
      </Spin>
    );
  return (
    <Alert
      showIcon
      type={health.isError ? 'error' : 'success'}
      message={
        health.isError
          ? 'Chưa kết nối được API Gateway'
          : `API Gateway: ${health.data.status}`
      }
    />
  );
}
