import { Button, Space, Tag } from 'antd';
import type { CatalogStatus } from '@minimart/contracts';
export function CatalogStatusTag({ status }: { status: CatalogStatus }) {
  return (
    <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>
      {status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
    </Tag>
  );
}
export function CatalogActions({
  status,
  canWrite,
  onEdit,
  onStatus,
  onView,
}: {
  status: CatalogStatus;
  canWrite: boolean;
  onEdit: () => void;
  onStatus: () => void;
  onView?: () => void;
}) {
  return (
    <Space>
      {onView && (
        <Button type="link" onClick={onView}>
          Chi tiết
        </Button>
      )}
      {canWrite && (
        <>
          <Button type="link" onClick={onEdit}>
            Sửa
          </Button>
          <Button type="link" danger={status === 'ACTIVE'} onClick={onStatus}>
            {status === 'ACTIVE' ? 'Ngừng' : 'Kích hoạt'}
          </Button>
        </>
      )}
    </Space>
  );
}
