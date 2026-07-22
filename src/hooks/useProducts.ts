"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductCatalogItem } from "@/types/product";
import { fetchAllProducts } from "@/services/productService";

/**
 * React Hook (`useProducts.ts`) consuming the centralized Product Repository.
 * Guarantees UI consistency across POS, Barista MES, and Inventory consoles.
 */
export function useProducts() {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchAllProducts();
    if (res.success && res.data) {
      setProducts(res.data);
    } else {
      setError(res.error || "Gagal memuat katalog produk dari repository.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const getProductById = useCallback(
    (id: number): ProductCatalogItem | undefined => {
      return products.find((item) => item.product_id === id);
    },
    [products]
  );

  return {
    products,
    loading,
    error,
    getProductById,
    refreshProducts: loadProducts
  };
}
