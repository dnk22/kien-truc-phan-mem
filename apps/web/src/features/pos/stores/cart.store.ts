import { create } from 'zustand';
import type { ProductSummary, SaleCartItem } from '@minimart/contracts';
interface CartLine extends SaleCartItem {
  product: ProductSummary;
}
interface CartStore {
  items: CartLine[];
  add: (product: ProductSummary) => void;
  quantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}
export const useCartStore = create<CartStore>((set) => ({
  items: [],
  add: (product) =>
    set((state) => {
      const current = state.items.find((i) => i.productId === product.id);
      return {
        items: current
          ? state.items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: Math.min(2147483647, i.quantity + 1) }
                : i,
            )
          : state.items.length >= 100
            ? state.items
            : [...state.items, { productId: product.id, product, quantity: 1 }],
      };
    }),
  quantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === id &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 2147483647
          ? { ...i, quantity }
          : i,
      ),
    })),
  remove: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== id) })),
  clear: () => set({ items: [] }),
}));
