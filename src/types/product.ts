/**
 * Centralized Product Catalog Interface for Single Source of Truth across POS, MES, Inventory, and Reports.
 * Implements strict, immutable `product_id` keying to prevent string-based identity drift.
 */
export interface ProductCatalogItem {
  product_id: number;
  product_name: string;
  sku?: string;
  category: "Coffee" | "Non-Coffee";
  unit: string;
  status: "ACTIVE" | "INACTIVE";
  image?: string;
  price?: number;
  tags?: string[];
  is_stock_tracked?: boolean;
  is_offline_only?: boolean;
}
