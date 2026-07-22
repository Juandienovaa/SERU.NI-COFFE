"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductInventoryItem, InventorySummaryStats, RawProductInventoryRecord } from "@/types/inventory";
import * as inventoryService from "@/services/inventoryService";
import { inventoryRepository } from "@/repositories/InventoryRepository";

/**
 * Enterprise Live Inventory Hook.
 *
 * PRINSIP ARSITEKTUR:
 * 1. Data inventaris HANYA berasal dari Supabase (`product_inventory`).
 *    Tidak ada localStorage override, tidak ada mock data.
 * 2. Realtime sinkronisasi melalui DUA channel:
 *    a. Supabase `postgres_changes` WebSocket (cross-tab, cross-device).
 *    b. `CustomEvent("inventory_realtime_sync")` (same-tab instant update).
 * 3. `summaryStats` diturunkan dari `items` menggunakan `useMemo` —
 *    BUKAN disimpan sebagai state terpisah (mencegah state drift).
 * 4. Background polling sebagai fallback jika WebSocket terputus.
 */
export function useInventory(autoPollSeconds: number = 15) {
  const [items, setItems] = useState<ProductInventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * Fetch seluruh inventaris dari Supabase dan enrich dengan metadata.
   *
   * MENGAPA PARAMETER `silent`:
   * - `silent = false`: Tampilkan loading spinner (untuk initial load).
   * - `silent = true`: Refresh di background tanpa mengganggu UX
   *   (untuk Realtime events dan polling).
   */
  const refreshInventory = useCallback(async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const smartList = await inventoryService.getSmartInventory();
      setItems(smartList);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useInventory] Error fetching inventory:", message);
      setErrorMsg(message || "Gagal menyinkronkan data stok dari Supabase.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  /**
   * MENGAPA `useMemo` BUKAN `useState`:
   * `summaryStats` diturunkan dari `items`. Jika disimpan sebagai state
   * terpisah, nilainya bisa tidak sinkron saat `items` berubah tapi
   * `summaryStats` belum ter-update (state drift).
   */
  const summaryStats: InventorySummaryStats = useMemo(
    () => inventoryService.computeSummaryStats(items),
    [items]
  );

  useEffect(() => {
    let isMounted = true;

    // 1. Initial load dari Supabase
    refreshInventory(false);

    // 2. Supabase Realtime WebSocket subscription (`postgres_changes`)
    //    Mendengarkan INSERT, UPDATE, DELETE pada tabel `product_inventory`.
    //    Setiap perubahan akan di-patch secara optimistic ke state lokal,
    //    lalu diikuti full refresh untuk memastikan konsistensi penuh.
    const unsubscribeRealtime = inventoryRepository.subscribeToInventoryChanges(
      (payload: { new: RawProductInventoryRecord; old: RawProductInventoryRecord }) => {
        if (!isMounted) return;
        console.log("[useInventory] Realtime postgres_changes event received");

        if (payload && payload.new) {
          const incoming = payload.new;
          setItems((prev) => {
            const exists = prev.some((item) => item.product_id === incoming.product_id);
            if (exists) {
              return prev.map((item) =>
                item.product_id === incoming.product_id
                  ? {
                      ...item,
                      current_stock: Math.max(0, Math.floor(Number(incoming.current_stock) || 0)),
                      last_produced_at: incoming.last_produced_at || item.last_produced_at,
                      last_produced_by: incoming.last_produced_by || item.last_produced_by
                    }
                  : item
              );
            }
            return prev;
          });
        }
        // Full refresh untuk re-enrich metadata dan memasukkan item baru jika ada
        refreshInventory(true);
      }
    );

    // 3. Same-tab instant sync via CustomEvent
    //    MENGAPA DIPERLUKAN:
    //    Supabase Realtime memiliki latensi ~100-500ms. CustomEvent memberikan
    //    update instan (0ms) di tab yang sama, sehingga Barista langsung melihat
    //    perubahan stok setelah "Setor ke Kasir" tanpa delay.
    const handleLocalSync = (e: Event) => {
      if (!isMounted) return;
      const customEvent = e as CustomEvent<{
        productId: number;
        productName: string;
        newStock: number;
        lastProducedAt: string;
        lastProducedBy: string;
      }>;
      if (!customEvent.detail) return;

      const { productId, newStock, lastProducedAt, lastProducedBy } = customEvent.detail;

      setItems((prev) => {
        const exists = prev.some((item) => item.product_id === productId);
        if (exists) {
          return prev.map((item) =>
            item.product_id === productId
              ? {
                  ...item,
                  current_stock: Math.max(0, Math.floor(Number(newStock) || 0)),
                  last_produced_at: lastProducedAt || item.last_produced_at,
                  last_produced_by: lastProducedBy || item.last_produced_by
                }
              : item
          );
        }
        return prev;
      });
      // Full refresh untuk re-enrich badges dan MRP recommendations
      refreshInventory(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("inventory_realtime_sync", handleLocalSync);
    }

    // 4. Background polling fallback
    //    MENGAPA DIPERLUKAN:
    //    WebSocket bisa terputus di jaringan mobile yang tidak stabil.
    //    Polling memastikan data tetap sinkron meskipun Realtime down.
    //    Hanya aktif saat tab visible (menghemat bandwidth & CPU).
    const pollInterval = setInterval(() => {
      if (isMounted && document.visibilityState === "visible") {
        refreshInventory(true);
      }
    }, autoPollSeconds * 1000);

    // Cleanup: Mencegah memory leak dan state update setelah unmount
    return () => {
      isMounted = false;
      unsubscribeRealtime();
      if (typeof window !== "undefined") {
        window.removeEventListener("inventory_realtime_sync", handleLocalSync);
      }
      clearInterval(pollInterval);
    };
  }, [refreshInventory, autoPollSeconds]);

  return {
    items,
    summaryStats,
    loading,
    errorMsg,
    refreshInventory
  };
}
