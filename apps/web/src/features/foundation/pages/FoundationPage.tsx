import { Card, Space, Typography } from 'antd';
import { GatewayStatus } from '../components/GatewayStatus';
export function FoundationPage() {
  return (
    <main className="foundation">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Title>MiniMart</Typography.Title>
            <Typography.Paragraph>
              Nền tảng quản lý siêu thị mini — Nhóm 06 PTIT
            </Typography.Paragraph>
          </div>
          <GatewayStatus />
          <Typography.Paragraph>
            DEV-0: Monorepo, hạ tầng và kiểm tra sức khỏe dịch vụ. Các chức năng
            nghiệp vụ sẽ được triển khai sau khi review nền tảng.
          </Typography.Paragraph>
          <Typography.Link
            href="http://localhost:8080/docs"
            target="_blank"
            rel="noreferrer"
          >
            Tài liệu API nền tảng
          </Typography.Link>
        </Space>
      </Card>
    </main>
  );
}
