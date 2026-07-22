import { productRepository } from "@/repositories/ProductRepository";
import { ProductCatalogItem } from "@/types/product";
import { ServiceResponse } from "@/types/production";

/**
 * Enterprise Product Service (`productService.ts`).
 * Serves as the application boundary for querying the single-source-of-truth catalog.
 */

export async function fetchAllProducts(): Promise<ServiceResponse<ProductCatalogItem[]>> {
  try {
    const data = await productRepository.getAllProducts();
    return { success: true, data };
  } catch (err: any) {
    console.error("[productService] Error fetching products:", err);
    return { success: false, data: [], error: err?.message || "Gagal memuat katalog produk." };
  }
}

export async function fetchProductById(id: number): Promise<ServiceResponse<ProductCatalogItem | null>> {
  try {
    const data = await productRepository.getProductById(id);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, data: null, error: err?.message || "Produk tidak ditemukan." };
  }
}

export async function fetchProductsByCategory(category: "Coffee" | "Non-Coffee"): Promise<ServiceResponse<ProductCatalogItem[]>> {
  try {
    const data = await productRepository.getProductsByCategory(category);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || "Gagal memuat kategori produk." };
  }
}
