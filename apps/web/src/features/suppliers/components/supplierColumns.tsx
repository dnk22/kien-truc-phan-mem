import type { TableColumnsType } from 'antd';
import type { SupplierSummary } from '@minimart/contracts';
import {
  CatalogActions,
  CatalogStatusTag,
} from '../../catalog/components/CatalogActions';
export function supplierColumns(
  edit: (s: SupplierSummary) => void,
  toggle: (s: SupplierSummary) => void,
  history: (s: SupplierSummary) => void,
): TableColumnsType<SupplierSummary> {
  return [
    { title: 'Mã', dataIndex: 'code' },
    { title: 'Tên nhà cung cấp', dataIndex: 'name' },
    { title: 'Điện thoại', dataIndex: 'phone' },
    { title: 'Địa chỉ', dataIndex: 'address' },
    {
      title: 'Trạng thái',
      render: (_, s) => <CatalogStatusTag status={s.status} />,
    },
    {
      title: 'Thao tác',
      render: (_, s) => (
        <CatalogActions
          status={s.status}
          canWrite
          onEdit={() => edit(s)}
          onStatus={() => toggle(s)}
          onView={() => history(s)}
        />
      ),
    },
  ];
}
