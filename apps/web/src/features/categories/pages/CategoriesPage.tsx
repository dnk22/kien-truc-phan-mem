import { useState } from 'react';
import { Button, Card } from 'antd';
import type { CategorySummary } from '@minimart/contracts';
import type { CategoryValues } from '../../catalog/types';
import { useCatalog } from '../../catalog/hooks/useCatalog';
import { CatalogToolbar } from '../../catalog/components/CatalogToolbar';
import { CategoryForm } from '../components/CategoryForm';
import { categoryColumns } from '../components/categoryColumns';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataTable } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ErrorState } from '../../../shared/components/ErrorState';
export default function CategoriesPage() {
  const { filters, setFilters, query, save, status } = useCatalog<
    CategorySummary,
    CategoryValues
  >('categories');
  const [editor, setEditor] = useState<{ item?: CategorySummary } | null>(null);
  const [target, setTarget] = useState<CategorySummary | null>(null);
  return (
    <>
      <PageHeader
        title="Quản lý danh mục"
        actions={
          <Button type="primary" onClick={() => setEditor({})}>
            + Thêm danh mục
          </Button>
        }
      />
      <Card>
        <CatalogToolbar filters={filters} onChange={setFilters} />
        {query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : (
          <DataTable<CategorySummary>
            columns={categoryColumns((item) => setEditor({ item }), setTarget)}
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
      {editor && (
        <CategoryForm
          item={editor.item}
          pending={save.isPending}
          onCancel={() => {
            if (!save.isPending) setEditor(null);
          }}
          onSave={(values) =>
            save.mutate(
              { id: editor.item?.id, values },
              { onSuccess: () => setEditor(null) },
            )
          }
        />
      )}
      <ConfirmDialog
        open={!!target}
        title="Xác nhận đổi trạng thái"
        pending={status.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target)
            status.mutate(
              {
                id: target.id,
                status: target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
              },
              { onSuccess: () => setTarget(null) },
            );
        }}
      >
        {target?.name}
      </ConfirmDialog>
    </>
  );
}
