import { Alert, Button, Space } from 'antd';
import { errorMessage } from '../utils/errorMessage';
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <Alert
      type="error"
      showIcon
      message="Không tải được dữ liệu"
      description={
        <Space direction="vertical">
          <span>{errorMessage(error)}</span>
          {retry ? <Button onClick={retry}>Thử lại</Button> : null}
        </Space>
      }
    />
  );
}
