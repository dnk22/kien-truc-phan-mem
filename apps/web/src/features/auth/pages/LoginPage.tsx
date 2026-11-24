import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useLogin } from '../hooks/useAuth';
import { errorMessage } from '../../../shared/utils/errorMessage';
import type { LoginInput } from '../types';
export default function LoginPage() {
  const login = useLogin();
  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="brand-mark">M</div>
        <Typography.Title>MiniMart</Typography.Title>
        <Typography.Paragraph>
          Vận hành gọn gàng.
          <br />
          Quản lý cửa hàng trong một không gian.
        </Typography.Paragraph>
        <span>HỆ THỐNG NỘI BỘ · NHÓM 06 PTIT</span>
      </section>
      <Card className="login-card">
        <Typography.Title level={2}>Chào mừng trở lại</Typography.Title>
        <Typography.Paragraph type="secondary">
          Đăng nhập bằng tài khoản nhân viên của bạn.
        </Typography.Paragraph>
        {login.isError ? (
          <Alert
            type="error"
            showIcon
            message={errorMessage(login.error)}
            className="form-alert"
          />
        ) : null}
        <Form<LoginInput>
          layout="vertical"
          onFinish={(values) => login.mutate(values)}
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              { required: true, message: 'Nhập tên đăng nhập' },
              { max: 40 },
            ]}
          >
            <Input
              autoComplete="username"
              size="large"
              placeholder="Tên đăng nhập"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Nhập mật khẩu' }]}
          >
            <Input.Password
              autoComplete="current-password"
              size="large"
              placeholder="Mật khẩu"
              maxLength={64}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            aria-label="Đăng nhập"
            size="large"
            block
            loading={login.isPending}
          >
            Đăng nhập
          </Button>
        </Form>
        <p className="login-note">
          Chỉ dành cho nhân viên được cấp quyền truy cập.
        </p>
      </Card>
    </main>
  );
}
