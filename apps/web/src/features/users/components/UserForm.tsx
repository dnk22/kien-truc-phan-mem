import { Alert, Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import type { UserProfile } from '@minimart/contracts';
import { ROLES } from '@minimart/contracts';
import { roleLabels } from '../../auth/utils/roles';
import type { UserFormValues } from '../types';
import { usernameRules, passwordRules } from '../utils/validation';
import { errorMessage } from '../../../shared/utils/errorMessage';
export function UserForm({
  open,
  user,
  pending,
  error,
  onSave,
  onCancel,
}: {
  open: boolean;
  user?: UserProfile;
  pending: boolean;
  error: unknown;
  onSave: (values: UserFormValues) => void;
  onCancel: () => void;
}) {
  const [form] = Form.useForm<UserFormValues>();
  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue(
        user
          ? {
              username: user.username,
              fullName: user.fullName,
              email: user.email ?? undefined,
              phone: user.phone ?? undefined,
              role: user.role,
            }
          : { role: 'CASHIER' },
      );
    }
  }, [open, user, form]);
  return (
    <Modal
      forceRender
      open={open}
      title={user ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={user ? 'Lưu thay đổi' : 'Tạo tài khoản'}
      okButtonProps={{ 'aria-label': user ? 'Lưu thay đổi' : 'Tạo tài khoản' }}
      cancelText="Hủy"
      confirmLoading={pending}
      maskClosable={!pending}
      cancelButtonProps={{ disabled: pending }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        requiredMark={false}
      >
        {error ? (
          <Alert
            className="form-alert"
            type="error"
            message={errorMessage(error)}
          />
        ) : null}
        <Form.Item name="username" label="Tên đăng nhập" rules={usernameRules}>
          <Input disabled={Boolean(user)} autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[
            {
              required: true,
              whitespace: true,
              min: 2,
              max: 120,
              message: 'Nhập họ tên từ 2–120 ký tự',
            },
          ]}
        >
          <Input />
        </Form.Item>
        {user ? null : (
          <>
            <Form.Item
              name="password"
              label="Mật khẩu ban đầu"
              rules={passwordRules}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
              <Select
                options={ROLES.map((role) => ({
                  value: role,
                  label: roleLabels[role],
                }))}
              />
            </Form.Item>
          </>
        )}
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { type: 'email', message: 'Email không hợp lệ' },
            { max: 254 },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Điện thoại"
          rules={[
            {
              pattern: /^[+0-9 ()-]{6,20}$/,
              message: 'Số điện thoại từ 6–20 ký tự',
            },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
