import { Button, Select } from 'antd';
import type { CatalogFilters } from '../types';
import { SearchInput } from '../../../shared/components/SearchInput';
import { TableToolbar } from '../../../shared/components/TableToolbar';
export function CatalogToolbar({
  filters,
  onChange,
  categories,
}: {
  filters: CatalogFilters;
  onChange: (value: CatalogFilters) => void;
  categories?: { label: string; value: string }[];
}) {
  return (
    <TableToolbar>
      <SearchInput
        value={filters.search ?? ''}
        placeholder="Tìm theo tên hoặc mã"
        onChange={(search) => onChange({ ...filters, search, page: 1 })}
      />
      <Select
        allowClear
        placeholder="Trạng thái"
        value={filters.status}
        style={{ width: 150 }}
        options={[
          { label: 'Hoạt động', value: 'ACTIVE' },
          { label: 'Ngừng hoạt động', value: 'INACTIVE' },
        ]}
        onChange={(status) => onChange({ ...filters, status, page: 1 })}
      />
      {categories && (
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Danh mục"
          value={filters.categoryId}
          options={categories}
          style={{ width: 180 }}
          onChange={(categoryId) =>
            onChange({ ...filters, categoryId, page: 1 })
          }
        />
      )}
      {categories && (
        <Select
          value={filters.sortBy ?? 'name'}
          style={{ width: 160 }}
          options={[
            { label: 'Tên', value: 'name' },
            { label: 'Giá bán', value: 'sellingPrice' },
            { label: 'Ngày tạo', value: 'createdAt' },
          ]}
          onChange={(sortBy) => onChange({ ...filters, sortBy, page: 1 })}
        />
      )}
      {categories && (
        <Select
          value={filters.sortOrder ?? 'asc'}
          style={{ width: 110 }}
          options={[
            { label: 'Tăng dần', value: 'asc' },
            { label: 'Giảm dần', value: 'desc' },
          ]}
          onChange={(sortOrder) => onChange({ ...filters, sortOrder, page: 1 })}
        />
      )}
      <Button onClick={() => onChange({ page: 1, pageSize: filters.pageSize })}>
        Đặt lại
      </Button>
    </TableToolbar>
  );
}
