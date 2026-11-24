import { InventoryError } from './inventory.errors';
import type { StockItem, StockRow } from './inventory.types';
export function available(stock: Pick<StockRow, 'onHand' | 'reserved'>) {
  return stock.onHand - stock.reserved;
}
export function assertAvailable(stock: StockRow | null, quantity: number) {
  if (!stock || available(stock) < quantity)
    throw new InventoryError('INSUFFICIENT_STOCK', 'Không đủ hàng có thể bán.');
}
export function assertAdjustment(
  stock: StockRow,
  expectedVersion: number,
  counted: number,
) {
  if (stock.version !== expectedVersion)
    throw new InventoryError(
      'STALE_STOCK_VERSION',
      'Tồn kho đã thay đổi, cần kiểm kê lại.',
    );
  if (counted < stock.reserved)
    throw new InventoryError(
      'STOCK_RESERVED',
      'Số lượng kiểm kê thấp hơn hàng đang giữ.',
    );
}
export function sameItems(a: StockItem[], b: StockItem[]) {
  const canonical = (items: StockItem[]) =>
    JSON.stringify(
      [...items]
        .sort((x, y) => x.productId.localeCompare(y.productId))
        .map(({ productId, quantity }) => ({ productId, quantity })),
    );
  return canonical(a) === canonical(b);
}
