"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ProductionBatch,
  ProductCounterItem,
  BalanceReconciliationResult,
  ProductionLockStatus,
  ProductionDraftState
} from "@/types/production";
import { validateProductionInvariant, clampQuantityInput, canIncrement } from "@/validators/production.validator";
import { calculateRemainingCups, getDefaultProductCounters, normalizeInteger } from "@/utils/allocation";
import {
  acquireProductionLock,
  releaseProductionLock,
  submitEnterpriseConversion,
  submitPartialFulfillment,
  fetchBatchDetailsAndItems
} from "@/services/productionBatchService";
import { useProductionDraft } from "./useProductionDraft";
import { supabase } from "@/lib/supabase";

/**
 * Enterprise Production Workstation Hook.
 *
 * PRINSIP ARSITEKTUR:
 * 1. SEMUA pembaruan state menggunakan Functional State Update
 *    (`setAllocations((prev) => ...)`) untuk mencegah Stale Closure.
 * 2. SEMUA nilai numerik dinormalisasi menggunakan `normalizeInteger()`
 *    untuk mencegah string concatenation dan NaN propagation.
 * 3. `remainingCups` SELALU diturunkan (derived) dari state, TIDAK pernah
 *    disimpan sebagai state independen — mencegah state drift.
 * 4. Setelah Partial Submit berhasil, `draftQuantity` WAJIB di-reset ke 0.
 */
export function useProductionAllocation() {
  const [activeBatch, setActiveBatch] = useState<ProductionBatch | null>(null);
  const [allocations, setAllocations] = useState<ProductCounterItem[]>([]);
  const [defectCups, setDefectCups] = useState<number>(0);
  const [lockStatus, setLockStatus] = useState<ProductionLockStatus>({ isLockedByOther: false });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [clampingToast, setClampingToast] = useState<string | null>(null);

  const { saveDebouncedDraft, discardDraft } = useProductionDraft();

  // ============================================================
  // DERIVED STATE (bukan state tersimpan — mencegah drift)
  // ============================================================

  /**
   * MENGAPA `useMemo` BUKAN `useState`:
   * `rawReceived` diturunkan dari `activeBatch`. Jika disimpan sebagai state
   * terpisah, nilainya bisa tidak sinkron dengan `activeBatch` saat batch berubah.
   */
  const rawReceived = useMemo(
    () => normalizeInteger(activeBatch?.raw_cups_given),
    [activeBatch]
  );

  const balanceResult: BalanceReconciliationResult = useMemo(
    () => validateProductionInvariant(rawReceived, allocations, defectCups),
    [rawReceived, allocations, defectCups]
  );

  /**
   * MENGAPA `remainingCups` DERIVED DAN BUKAN STATE:
   * Remaining = Raw - (Draft + Submitted + Defect).
   * Jika Remaining disimpan sebagai `useState`, dia bisa menjadi stale
   * saat `allocations` atau `defectCups` berubah tapi Remaining belum ter-update.
   * Dengan `useMemo`, Remaining SELALU sinkron dengan state terbaru.
   */
  const remainingCups = useMemo(
    () => calculateRemainingCups(rawReceived, allocations, defectCups),
    [rawReceived, allocations, defectCups]
  );

  // ============================================================
  // AUTO-SAVE DRAFT (debounced)
  // ============================================================

  const triggerAutoSave = useCallback(
    (batch: ProductionBatch, currentAllocations: ProductCounterItem[], currentDefects: number) => {
      const draftPayload: ProductionDraftState = {
        batchId: batch.id,
        batchNumber: batch.batch_number,
        rawCupsReceived: normalizeInteger(batch.raw_cups_given),
        allocations: currentAllocations,
        defectCups: normalizeInteger(currentDefects),
        lastUpdated: new Date().toISOString(),
        version: 1
      };
      saveDebouncedDraft(draftPayload);
    },
    [saveDebouncedDraft]
  );

  // ============================================================
  // START / RESUME BATCH PRODUCTION
  // ============================================================

  /**
   * Mulai produksi: Acquire lock & inisialisasi workstation dari katalog.
   * Hydrate `submittedQuantity` dari `batch_items` di database (untuk Resume).
   */
  const startBatchProduction = useCallback(
    async (
      batch: ProductionBatch,
      baristaId: string = "barista-current",
      baristaName: string = "Crew Barista",
      catalog?: ReadonlyArray<{ product_id: number; product_name: string; sku?: string; category: string; unit?: string; image?: string; status?: string }>
    ) => {
      const acquiredLock = await acquireProductionLock(batch.id, baristaId, baristaName);
      setLockStatus(acquiredLock);

      if (acquiredLock.isLockedByOther) {
        return { success: false, message: acquiredLock.message };
      }

      const initialCounters = getDefaultProductCounters(catalog as any);
      const { defectCups: dbDefectCups, items: dbItems } = await fetchBatchDetailsAndItems(batch.id);

      /**
       * HYDRATE dari database (`batch_items`):
       * Setiap kartu produk dicocokkan dengan record `batch_items`.
       * Jika ada record yang cocok, `submittedQuantity` diisi dari `quantity_produced`
       * dan `draftQuantity` di-reset ke 0 (karena draft sebelumnya sudah disetor).
       *
       * MENGAPA `normalizeInteger()`:
       * Data dari Supabase bisa berupa `string` tergantung tipe kolom.
       * Normalisasi memastikan operasi aritmatika di React selalu integer.
       */
      const hydratedAllocations: ProductCounterItem[] = initialCounters.map((card) => {
        const matchedItem = dbItems.find(
          (bi) =>
            bi.product_id === card.product_id ||
            String(bi.product_id) === String(card.id.replace("prod-", ""))
        );
        const qtyProduced = matchedItem ? normalizeInteger(matchedItem.quantity_produced) : 0;
        return {
          ...card,
          quantity: 0,
          draftQuantity: 0,
          submittedQuantity: qtyProduced
        };
      });

      const activeDefects = normalizeInteger(dbDefectCups) > 0
        ? normalizeInteger(dbDefectCups)
        : normalizeInteger(batch.defect_cups);

      const activeBatchObj: ProductionBatch = {
        ...batch,
        defect_cups: activeDefects
      };

      setActiveBatch(activeBatchObj);
      setAllocations(hydratedAllocations);
      setDefectCups(activeDefects);

      triggerAutoSave(activeBatchObj, hydratedAllocations, activeDefects);
      return { success: true };
    },
    [triggerAutoSave]
  );

  /**
   * Resume dari draft tersimpan (localStorage auto-save).
   * Tetap hydrate `submittedQuantity` dari database sebagai source of truth.
   */
  const resumeFromDraft = useCallback(
    async (draft: ProductionDraftState, baristaId: string = "barista-current", baristaName: string = "Crew Barista") => {
      const acquiredLock = await acquireProductionLock(draft.batchId, baristaId, baristaName);
      setLockStatus(acquiredLock);

      if (acquiredLock.isLockedByOther) {
        return { success: false, message: acquiredLock.message };
      }

      const { defectCups: dbDefectCups, items: dbItems } = await fetchBatchDetailsAndItems(draft.batchId);

      /**
       * MENGAPA `Math.max(dbSub, draftSub)`:
       * Database adalah source of truth (lebih terpercaya), tetapi draft lokal
       * mungkin memiliki data yang lebih baru jika Supabase belum sinkron.
       * Kita mengambil nilai terbesar agar tidak kehilangan data penyetoran.
       */
      const hydratedDraftAllocations: ProductCounterItem[] = draft.allocations.map((card) => {
        const matchedItem = dbItems.find(
          (bi) =>
            bi.product_id === card.product_id ||
            String(bi.product_id) === String(card.id.replace("prod-", ""))
        );
        const dbSub = matchedItem ? normalizeInteger(matchedItem.quantity_produced) : 0;
        const draftSub = normalizeInteger(card.submittedQuantity);
        return {
          ...card,
          draftQuantity: normalizeInteger(card.draftQuantity),
          submittedQuantity: Math.max(dbSub, draftSub)
        };
      });

      const activeDefects = Math.max(
        normalizeInteger(dbDefectCups),
        normalizeInteger(draft.defectCups)
      );

      const mockBatch: ProductionBatch = {
        id: draft.batchId,
        batch_number: draft.batchNumber,
        raw_cups_given: normalizeInteger(draft.rawCupsReceived),
        defect_cups: activeDefects,
        status: "PENDING_BARISTA",
        created_at: draft.lastUpdated
      };

      setActiveBatch(mockBatch);
      setAllocations(hydratedDraftAllocations);
      setDefectCups(activeDefects);
      return { success: true };
    },
    []
  );

  // ============================================================
  // ALLOCATION QUANTITY UPDATES (Functional State Updates)
  // ============================================================

  /**
   * Update kuantitas draft untuk satu produk dengan clamping ketat.
   *
   * MENGAPA FUNCTIONAL UPDATE (`setAllocations((prev) => ...)`):
   * Di React, jika kita menggunakan `allocations` dari closure luar di dalam
   * `setAllocations(newValue)`, kita bisa mendapatkan "stale closure" — yaitu
   * versi `allocations` yang sudah kedaluwarsa karena React belum re-render.
   * Dengan functional update, React memberikan nilai `prev` yang PASTI terbaru.
   */
  const updateAllocationQuantity = useCallback(
    (productId: string, desiredVal: number) => {
      if (!activeBatch || lockStatus.isLockedByOther) return;

      setAllocations((prev) => {
        const targetItem = prev.find((item) => item.id === productId);
        if (!targetItem) return prev;

        const currentQty = normalizeInteger(
          targetItem.draftQuantity !== undefined ? targetItem.draftQuantity : targetItem.quantity
        );
        const clampRes = clampQuantityInput(normalizeInteger(desiredVal), currentQty, remainingCups);

        if (clampRes.wasClamped && clampRes.explanation) {
          setClampingToast(clampRes.explanation);
          setTimeout(() => setClampingToast(null), 4000);
        }

        const nextAllocations = prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: clampRes.clampedQuantity, draftQuantity: clampRes.clampedQuantity }
            : item
        );

        triggerAutoSave(activeBatch, nextAllocations, defectCups);
        return nextAllocations;
      });
    },
    [activeBatch, lockStatus.isLockedByOther, remainingCups, defectCups, triggerAutoSave]
  );

  /**
   * Quick increment (+1, +5, +10) dengan pengecekan sisa gelas.
   */
  const incrementAllocation = useCallback(
    (productId: string, delta: number) => {
      if (!activeBatch || lockStatus.isLockedByOther || !canIncrement(remainingCups)) return;

      const safeDelta = normalizeInteger(delta);

      setAllocations((prev) => {
        const targetItem = prev.find((item) => item.id === productId);
        if (!targetItem) return prev;

        const currentQty = normalizeInteger(
          targetItem.draftQuantity !== undefined ? targetItem.draftQuantity : targetItem.quantity
        );
        // Clamp delta agar tidak melebihi sisa gelas yang tersedia
        const actualDelta = Math.min(safeDelta, remainingCups);
        const nextQty = currentQty + actualDelta;

        const nextAllocations = prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: nextQty, draftQuantity: nextQty }
            : item
        );

        triggerAutoSave(activeBatch, nextAllocations, defectCups);
        return nextAllocations;
      });
    },
    [activeBatch, lockStatus.isLockedByOther, remainingCups, defectCups, triggerAutoSave]
  );

  /**
   * Update jumlah gelas cacat (defect) dengan clamping.
   */
  const updateDefectCups = useCallback(
    (desiredVal: number) => {
      if (!activeBatch || lockStatus.isLockedByOther) return;

      const clampRes = clampQuantityInput(normalizeInteger(desiredVal), defectCups, remainingCups);
      if (clampRes.wasClamped && clampRes.explanation) {
        setClampingToast(clampRes.explanation);
        setTimeout(() => setClampingToast(null), 4000);
      }

      setDefectCups(clampRes.clampedQuantity);
      triggerAutoSave(activeBatch, allocations, clampRes.clampedQuantity);
    },
    [activeBatch, lockStatus.isLockedByOther, defectCups, remainingCups, allocations, triggerAutoSave]
  );

  /**
   * Tambah kartu produk kustom.
   */
  const addCustomProduct = useCallback(
    (productName: string, category: "Coffee" | "Non-Coffee" | "Custom" = "Custom") => {
      if (!activeBatch || !productName.trim() || lockStatus.isLockedByOther) return;

      setAllocations((prev) => {
        const customNumericId = Math.floor(100000 + Math.random() * 900000);
        const newItem: ProductCounterItem = {
          id: `custom-${Date.now()}`,
          product_id: customNumericId,
          product_name: productName.trim(),
          quantity: 0,
          draftQuantity: 0,
          submittedQuantity: 0,
          category,
          unit: "Cup",
          sku: `SRN-CUST-${customNumericId}`,
          iconName: "Sparkles"
        };
        const nextAllocations = [...prev, newItem];
        triggerAutoSave(activeBatch, nextAllocations, defectCups);
        return nextAllocations;
      });
    },
    [activeBatch, lockStatus.isLockedByOther, defectCups, triggerAutoSave]
  );

  // ============================================================
  // PARTIAL SUBMIT ("Setor Bertahap")
  // ============================================================

  /**
   * Setor bertahap untuk satu produk spesifik.
   *
   * MENGAPA FUNCTIONAL UPDATE DI handlePartialSubmit:
   * 1. `handlePartialSubmit` adalah fungsi async yang memanggil Supabase.
   *    Selama menunggu response jaringan, React mungkin sudah me-render ulang
   *    dan mengubah state `allocations`. Jika kita membaca `allocations` dari
   *    closure luar (stale closure), kita bisa menimpa (overwrite) perubahan
   *    yang terjadi selama menunggu response.
   * 2. Functional update `setAllocations((prev) => ...)` memastikan kita
   *    SELALU bekerja dengan data terbaru (`prev`), bukan snapshot lama.
   *
   * MENGAPA RESET `draftQuantity` KE 0:
   * Setelah penyetoran berhasil, gelas yang sudah disetor berpindah dari
   * "sedang diracik" (draft) ke "sudah disetor" (submitted). Draft WAJIB
   * di-reset agar Barista tidak menghitung gelas yang sama dua kali.
   *
   * MENGAPA `Number(item.submittedQuantity ?? 0) + Number(draft)`:
   * Mencegah string concatenation. Jika `submittedQuantity` berisi "10"
   * dan `draft` berisi 5, tanpa `Number()` hasilnya "105" bukan 15.
   */
  const handlePartialSubmit = useCallback(
    async (productId: string, baristaId?: string, baristaName?: string) => {
      if (!activeBatch || lockStatus.isLockedByOther) {
        return { success: false, error: "Sesi tidak valid atau terkunci." };
      }

      // Baca draft dari state terkini menggunakan functional pattern
      // MENGAPA TIDAK `allocations.find(...)` LANGSUNG:
      // `allocations` dari closure bisa stale (kedaluwarsa) jika user
      // mengklik Setor dua kali berturut-turut sebelum re-render selesai.
      let capturedDraft = 0;
      let capturedProductId = 0;
      let capturedProductName = "";
      let capturedItemId = "";

      // Ambil snapshot dari current state secara sinkron
      setAllocations((prev) => {
        const targetItem = prev.find(
          (item) => item.id === productId || String(item.product_id) === productId
        );
        if (targetItem) {
          capturedDraft = normalizeInteger(
            targetItem.draftQuantity !== undefined ? targetItem.draftQuantity : targetItem.quantity
          );
          capturedProductId = targetItem.product_id || normalizeInteger(targetItem.id.replace("prod-", ""));
          capturedProductName = targetItem.product_name || "";
          capturedItemId = targetItem.id;
        }
        return prev; // Tidak mengubah state — hanya membaca
      });

      if (capturedDraft <= 0) {
        return { success: false, error: "Belum ada kuantitas racikan untuk disetor." };
      }

      setSubmitting(true);
      try {
        // Session check removed as per instruction. Use parameter or fallback.
        const validBaristaId = baristaId || "BARISTA_UNKNOWN";

        const res = await submitPartialFulfillment(
          activeBatch.id,
          capturedProductId,
          capturedProductName,
          capturedDraft,
          validBaristaId,
          baristaName
        );

        if (res.success) {
          /**
           * FUNCTIONAL STATE UPDATE — Anti Stale Closure:
           * Menggunakan `prev` untuk mendapatkan state terbaru, bukan
           * `allocations` dari closure yang mungkin sudah kedaluwarsa
           * setelah menunggu response async dari `submitPartialFulfillment()`.
           */
          setAllocations((prev) => {
            const nextAllocations = prev.map((item) => {
              if (item.id === capturedItemId) {
                // STRICT INTEGER ARITHMETIC:
                // `normalizeInteger()` memastikan kedua operand adalah integer.
                // Mencegah: "10" + 5 = "105" (string concatenation)
                // Menjamin: 10 + 5 = 15 (numeric addition)
                const currentSubmitted = normalizeInteger(item.submittedQuantity);
                const draftToAdd = normalizeInteger(capturedDraft);
                return {
                  ...item,
                  quantity: 0,
                  draftQuantity: 0,
                  submittedQuantity: currentSubmitted + draftToAdd
                };
              }
              return item;
            });
            triggerAutoSave(activeBatch, nextAllocations, defectCups);
            return nextAllocations;
          });
        }
        return res;
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || "Gagal menyimpan data setor bertahap ke database."
        };
      } finally {
        setSubmitting(false);
      }
    },
    [activeBatch, lockStatus.isLockedByOther, defectCups, triggerAutoSave]
  );

  // ============================================================
  // EXIT & SUBMIT BATCH
  // ============================================================

  const exitWorkspace = useCallback(async () => {
    if (activeBatch) {
      await releaseProductionLock(activeBatch.id);
    }
    setActiveBatch(null);
    setAllocations([]);
    setDefectCups(0);
  }, [activeBatch]);

  const submitCurrentBatch = useCallback(
    async (baristaId?: string, baristaName?: string) => {
      if (!activeBatch || !balanceResult.isValid || balanceResult.remaining !== 0) {
        return {
          success: false,
          error: "Sisa gelas harus persis 0 cup sebelum produksi dikunci."
        };
      }

      setSubmitting(true);
      try {
        // Session check removed as per instruction. Use parameter or fallback.
        const validBaristaId = baristaId || "BARISTA_UNKNOWN";

        const res = await submitEnterpriseConversion(
          {
            batchId: activeBatch.id,
            defectCups,
            allocations,
            baristaId: validBaristaId,
            baristaName
          },
          rawReceived
        );

        if (res.success) {
          await discardDraft(activeBatch.id);
          setActiveBatch(null);
          setAllocations([]);
          setDefectCups(0);
        }
        return res;
      } finally {
        setSubmitting(false);
      }
    },
    [activeBatch, balanceResult, defectCups, allocations, rawReceived, discardDraft]
  );

  return {
    activeBatch,
    allocations,
    defectCups,
    lockStatus,
    balanceResult,
    remainingCups,
    submitting,
    clampingToast,
    startBatchProduction,
    resumeFromDraft,
    updateAllocationQuantity,
    incrementAllocation,
    updateDefectCups,
    addCustomProduct,
    handlePartialSubmit,
    exitWorkspace,
    submitCurrentBatch,
    setClampingToast
  };
}
