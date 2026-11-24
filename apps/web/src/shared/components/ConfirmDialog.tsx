import { Modal } from 'antd';
import type { ReactNode } from 'react';
export function ConfirmDialog({
  open,
  title,
  children,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      okText="Xác nhận"
      okButtonProps={{ 'aria-label': 'Xác nhận' }}
      cancelText="Hủy"
      confirmLoading={pending}
      onOk={onConfirm}
      onCancel={onCancel}
      closable={!pending}
      maskClosable={!pending}
      cancelButtonProps={{ disabled: pending }}
    >
      {children}
    </Modal>
  );
}
