import { Alert, Button, Form, Input } from 'antd';
import { useChangePassword } from '../hooks/useAuth';
import type { PasswordInput } from '../types';
import { errorMessage } from '../../../shared/utils/errorMessage';
export function ChangePasswordForm() {
  const mutation = useChangePassword();
  return (
    <>
      <p>
        Đổi mật khẩu sẽ kết thúc tất cả phiên đăng nhập. Mật khẩu mới gồm 10–64
        ký tự ASCII in được.
      </p>
      {mutation.isError ? (
        <Alert
          type="error"
          message={errorMessage(mutation.error)}
          className="form-alert"
        />
      ) : null}
      <Form<PasswordInput & { confirmPassword: string }>
        layout="vertical"
        onFinish={({ currentPassword, newPassword }) =>
          mutation.mutate({ currentPassword, newPassword })
        }
        requiredMark={false}
      >
        <Form.Item
          name="currentPassword"
          label="Mật khẩu hiện tại"
          rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Nhập mật khẩu mới' },
            {
              pattern: /^[\x20-\x7E]{10,64}$/,
              message: 'Dùng 10–64 ký tự ASCII in được',
            },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Nhập lại mật khẩu mới' },
            ({ getFieldValue }) => ({
              validator: (_, value: string) =>
                value === getFieldValue('newPassword')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Mật khẩu xác nhận không khớp')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          aria-label="Đổi mật khẩu"
          loading={mutation.isPending}
        >
          Đổi mật khẩu
        </Button>
      </Form>
    </>
  );
}
