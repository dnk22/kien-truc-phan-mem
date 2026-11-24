import { Form, Input, Modal } from 'antd';
import type { SupplierSummary } from '@minimart/contracts';
import type { SupplierValues } from '../../inventory/api/inventory.api';
export function SupplierForm({
  item,
  pending,
  onSave,
  onCancel,
}: {
  item?: SupplierSummary;
  pending: boolean;
  onSave: (v: SupplierValues) => void;
  onCancel: () => void;
}) {
  const [form] = Form.useForm<SupplierValues>();
  return (
    <Modal
      open
      title={item ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={pending}
      onOk={() => form.submit()}
      onCancel={onCancel}
      closable={!pending}
      maskClosable={!pending}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={item}
        onFinish={onSave}
      >
        <Form.Item
          name="code"
          label="Mã"
          rules={[{ required: true, whitespace: true, max: 64 }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, whitespace: true, max: 200 }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Điện thoại" rules={[{ max: 50 }]}>
          <Input />
        </Form.Item>
        <Form.Item name="address" label="Địa chỉ" rules={[{ max: 500 }]}>
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
}
