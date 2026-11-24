import { Card, Select } from 'antd';
import type { SaleInvoice, SaleStatus } from '@minimart/contracts';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataTable } from '../../../shared/components/DataTable';
import { ErrorState } from '../../../shared/components/ErrorState';
import { SearchInput } from '../../../shared/components/SearchInput';
import { TableToolbar } from '../../../shared/components/TableToolbar';
import { useInvoices } from '../hooks/useInvoices';
import { saleStatusLabels } from '../utils/sale-status';
import { invoiceColumns } from '../components/invoiceColumns';
export default function InvoicesPage() {
  const { filters, setFilters, query } = useInvoices();
  return (
    <>
      <PageHeader title="Hóa đơn" />
      <Card>
        <TableToolbar>
          <SearchInput
            value={filters.search ?? ''}
            placeholder="Mã hóa đơn"
            onChange={(search) => setFilters({ ...filters, search, page: 1 })}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            value={filters.status}
            options={Object.entries(saleStatusLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(status: SaleStatus | undefined) =>
              setFilters({ ...filters, status, page: 1 })
            }
          />
        </TableToolbar>
        {query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : (
          <DataTable<SaleInvoice>
            columns={invoiceColumns}
            dataSource={query.data?.items ?? []}
            loading={query.isFetching}
            pagination={{
              current: filters.page,
              pageSize: filters.pageSize,
              total: query.data?.total ?? 0,
              showSizeChanger: true,
              onChange: (page, pageSize) =>
                setFilters({
                  ...filters,
                  page: pageSize !== filters.pageSize ? 1 : page,
                  pageSize,
                }),
            }}
          />
        )}
      </Card>
    </>
  );
}
