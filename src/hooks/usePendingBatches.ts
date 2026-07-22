"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductionBatchStage2, AllocationItem, ProductionConversionPayload } from "@/types/productionStage2";
import { fetchPendingBaristaBatches, submitProductionConversion } from "@/services/productionStage2Service";
import { validateProductionBalance } from "@/utils/productionMath";
import { products } from "@/app/produk/data";

/**
 * Custom Hook untuk memanage antrean batch (`ProductionQueue`) dan
 * workspace konversi barista (`ProductionWorkspace`).
 * Mendukung pemuatan dinamis produk dari katalog, alokasi fleksibel, dan optimasi UI.
 */
export function usePendingBatches() {
  const [pendingBatches, setPendingBatches] = useState<ProductionBatchStage2[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatchStage2 | null>(null);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [defectCups, setDefectCups] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Memuat antrean batch dari server.
   */
  const loadQueue = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);

    const res = await fetchPendingBaristaBatches();
    if (!res.success || res.error) {
      setError(res.error || "Gagal memuat antrean sesi produksi.");
      if (!isSilent) setLoading(false);
      return;
    }

    if (res.data) {
      setPendingBatches(res.data);
    }
    if (!isSilent) setLoading(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  /**
   * Inisialisasi daftar produk dari katalog resmi saat memilih batch.
   */
  const handleSelectBatch = useCallback((batch: ProductionBatchStage2 | null) => {
    if (!batch) {
      setSelectedBatch(null);
      setAllocations([]);
      setDefectCups(0);
      return;
    }

    setSelectedBatch(batch);
    setDefectCups(0);
    setError(null);

    // Muat produk standar Seru.ni dari katalog data.ts
    const initialItems: AllocationItem[] = products.map((p) => ({
      id: String(p.id),
      productName: p.name,
      quantity: 0,
      category: p.category
    }));

    setAllocations(initialItems);
  }, []);

  /**
   * Mengubah jumlah produksi pada produk tertentu.
   */
  const handleQuantityChange = useCallback((id: string, newQty: number) => {
    setAllocations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(0, newQty) } : item))
    );
  }, []);

  /**
   * Mengubah catatan jumlah gelas rusak / cacat.
   */
  const handleDefectChange = useCallback((newQty: number) => {
    setDefectCups(Math.max(0, newQty));
  }, []);

  /**
   * Menambahkan menu/produk custom baru secara dinamis ke dalam workspace.
   */
  const addNewCustomProduct = useCallback((productName: string) => {
    if (!productName || !productName.trim()) return;
    const cleanName = productName.trim();

    // Cek apakah produk dengan nama yang sama sudah ada di tabel alokasi
    setAllocations((prev) => {
      const exists = prev.some((item) => item.productName.toLowerCase() === cleanName.toLowerCase());
      if (exists) return prev;

      const newItem: AllocationItem = {
        id: `custom-${Date.now()}`,
        productName: cleanName,
        quantity: 0,
        category: "Custom"
      };

      return [newItem, ...prev];
    });
  }, []);

  /**
   * Hasil validasi kekekalan gelas ter-memoize (`useMemo`).
   */
  const balanceResult = useMemo(() => {
    const rawCups = selectedBatch ? Number(selectedBatch.raw_cups_given) : 0;
    return validateProductionBalance(rawCups, allocations, defectCups);
  }, [selectedBatch, allocations, defectCups]);

  /**
   * Pengiriman konversi produksi dari workspace ke database dengan auto-refresh & optimistic remove.
   */
  const submitConversion = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!selectedBatch) return { success: false, error: "Pilih sesi batch terlebih dahulu." };
    if (!balanceResult.isValid) return { success: false, error: balanceResult.message };

    setSubmitting(true);
    setError(null);

    const payload: ProductionConversionPayload = {
      batchId: selectedBatch.id,
      defectCups,
      allocations
    };

    try {
      const res = await submitProductionConversion(payload, Number(selectedBatch.raw_cups_given));

      if (!res.success || res.error) {
        const errMsg = res.error || "Gagal menyimpan konversi produksi ke database.";
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      // Optimistic remove dari antrean lokal
      setPendingBatches((prev) => prev.filter((b) => b.id !== selectedBatch.id));
      handleSelectBatch(null);

      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || "Terjadi kesalahan internal saat memproses transaksi.";
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setSubmitting(false);
    }
  }, [selectedBatch, balanceResult, defectCups, allocations, handleSelectBatch]);

  return {
    pendingBatches,
    selectedBatch,
    allocations,
    defectCups,
    loading,
    submitting,
    error,
    balanceResult,
    loadQueue,
    selectBatch: handleSelectBatch,
    handleQuantityChange,
    handleDefectChange,
    addNewCustomProduct,
    submitConversion
  };
}
