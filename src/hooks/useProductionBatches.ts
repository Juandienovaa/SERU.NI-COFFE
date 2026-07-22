"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductionBatch } from "@/types/productionBatch";
import { fetchProductionBatches, createProductionBatch } from "@/services/productionBatchService";

/**
 * Custom React Hook untuk manajemen state & siklus hidup `ProductionBatch`.
 * Menyediakan kapabilitas pemuatan data (dengan lazy/initial load), penanganan submit,
 * kalkulasi turunan yang ter-memoize (`useMemo`), serta proteksi duplikasi state.
 */
export function useProductionBatches(initialLimit: number = 50) {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  /**
   * Mengambil data batch produksi dari Supabase dan memperbarui state history.
   */
  const loadBatches = useCallback(async (isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    setError(null);

    const result = await fetchProductionBatches(initialLimit);
    if (result.error) {
      setError(result.error);
      if (!isSilent) setLoading(false);
      return;
    }

    if (result.data) {
      setBatches(result.data);
    }
    if (!isSilent) setLoading(false);
  }, [initialLimit]);

  // Load data pertama kali saat mount
  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  /**
   * Mengirimkan pembuatan batch baru ke database melalui service layer.
   * Melakukan pembaruan state instan pada daftar history jika sukses (tanpa perlu reload full dari server).
   */
  const submitNewBatch = useCallback(async (rawCups: number): Promise<{ success: boolean; data?: ProductionBatch; error?: string }> => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await createProductionBatch(rawCups);
      
      if (response.error || !response.data) {
        const errMsg = response.error || "Gagal membuat sesi produksi batch.";
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      // Pembaruan Optimistic/Local State: Sisipkan batch baru di urutan teratas (Newest First)
      const newBatch = response.data;
      setBatches((prevBatches) => [newBatch, ...prevBatches]);

      return { success: true, data: newBatch };
    } catch (err: any) {
      const errMsg = err?.message || "Terjadi kesalahan sistem saat memproses batch baru.";
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setSubmitting(false);
    }
  }, []);

  /**
   * Kalkulasi turunan ter-memoize (`useMemo`) untuk mencegah re-render yang tidak perlu.
   */
  const stats = useMemo(() => {
    let totalPending = 0;
    let totalCompleted = 0;
    let totalCupsToday = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();

    batches.forEach((batch) => {
      if (batch.status === "PENDING" || batch.status === "PENDING_BARISTA") totalPending++;
      if (batch.status === "COMPLETED") totalCompleted++;

      if (batch.created_at) {
        const batchTime = new Date(batch.created_at).getTime();
        if (batchTime >= startOfToday) {
          totalCupsToday += Number(batch.raw_cups_given) || 0;
        }
      }
    });

    return {
      totalBatches: batches.length,
      totalPending,
      totalCompleted,
      totalCupsToday
    };
  }, [batches]);

  return {
    batches,
    loading,
    submitting,
    error,
    selectedRowId,
    setSelectedRowId,
    loadBatches,
    submitNewBatch,
    stats
  };
}
