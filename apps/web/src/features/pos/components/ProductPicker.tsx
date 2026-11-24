import { Button, Card, List, Space } from 'antd';
import { SearchInput } from '../../../shared/components/SearchInput';
import { ErrorState } from '../../../shared/components/ErrorState';
import { money } from '../../inventory/utils/format';
import { useProductSearch } from '../hooks/useProductSearch';
import { useCartStore } from '../stores/cart.store';
export function ProductPicker({ disabled }: { disabled: boolean }) {
  const { search, setSearch, query } = useProductSearch();
  const add = useCartStore((s) => s.add);
  return (
    <Card
      className="pos-picker"
      title="Chọn sản phẩm"
      extra={
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tên, mã sản phẩm hoặc mã vạch"
        />
      }
    >
      {query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <List
          loading={query.isFetching}
          dataSource={query.data?.items ?? []}
          renderItem={(p) => (
            <List.Item
              actions={[
                <Button key="add" disabled={disabled} onClick={() => add(p)}>
                  Thêm
                </Button>,
              ]}
            >
              <Space direction="vertical" size={0}>
                <strong>{p.name}</strong>
                <span>
                  {p.code} · {p.unit} · {money(p.sellingPrice)}
                </span>
              </Space>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
