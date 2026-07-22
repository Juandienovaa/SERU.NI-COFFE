import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductCatalogItem } from '@/types/product';

export interface CartItem {
  product: ProductCatalogItem;
  qty: number;
}

interface OnlineCartState {
  items: CartItem[];
  addItem: (product: ProductCatalogItem) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useOnlineCart = create<OnlineCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          const existing = state.items.find(i => i.product.product_id === product.product_id);
          if (existing) {
            return {
              items: state.items.map(i => 
                i.product.product_id === product.product_id 
                  ? { ...i, qty: i.qty + 1 }
                  : i
              )
            };
          }
          return { items: [...state.items, { product, qty: 1 }] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(i => i.product.product_id !== productId)
        }));
      },
      updateQty: (productId, qty) => {
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter(i => i.product.product_id !== productId) };
          }
          return {
            items: state.items.map(i => 
              i.product.product_id === productId ? { ...i, qty } : i
            )
          };
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      },
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.product.price || 0) * item.qty, 0);
      }
    }),
    {
      name: 'seruni-online-cart',
    }
  )
);
