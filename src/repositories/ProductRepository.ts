import { ProductCatalogItem } from "@/types/product";
import { products as officialPosProducts } from "@/app/produk/data";

/**
 * Single Source of Truth Product Repository (`ProductRepository.ts`).
 * Enforces immutable `product_id` across POS, Barista MES, Inventory, and Reports.
 * Prevents string matching errors and ensures reliable stock/sales synchronization.
 */
export class ProductRepository {
  private catalog: ProductCatalogItem[];

  constructor() {
    // Normalize and enrich the official POS product catalog into enterprise ProductCatalogItem
    this.catalog = officialPosProducts.map((p) => ({
      product_id: p.id,
      product_name: p.name,
      sku: `SRN-${p.category.toUpperCase().slice(0, 3)}-${String(p.id).padStart(3, "0")}`,
      category: p.category,
      unit: "Cup",
      status: "ACTIVE",
      image: p.image,
      price: p.price,
      tags: p.tags
    }));
  }

  /**
   * Returns all active products in the centralized catalog.
   */
  async getAllProducts(): Promise<ProductCatalogItem[]> {
    return [...this.catalog.filter((item) => item.status === "ACTIVE")];
  }

  /**
   * Returns an immutable product record by its exact integer ID (`product_id`).
   */
  async getProductById(id: number): Promise<ProductCatalogItem | null> {
    const found = this.catalog.find((item) => item.product_id === id);
    return found || null;
  }

  /**
   * Filter products by category ("Coffee" | "Non-Coffee").
   */
  async getProductsByCategory(category: "Coffee" | "Non-Coffee"): Promise<ProductCatalogItem[]> {
    return this.catalog.filter((item) => item.category === category && item.status === "ACTIVE");
  }
}

export const productRepository = new ProductRepository();
