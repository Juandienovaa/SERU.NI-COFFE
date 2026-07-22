"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getActiveShift, clearActiveShift, ActiveShiftCache } from "@/services/shiftStorageService";
import { checkActiveShiftInSupabase, syncRecordToStorageCache, SupabaseShiftRecord } from "@/services/shiftAuthService";

export type ShiftGuardMode = "block_open_shift_when_active" | "require_active_shift";

export interface UseShiftGuardOptions {
  mode: ShiftGuardMode;
  userId?: string | null;
  cashierName?: string | null;
  redirectToWhenActive?: string;
  redirectToWhenInactive?: string;
  onActiveShiftFound?: (shift: SupabaseShiftRecord | ActiveShiftCache) => void;
  onNoActiveShift?: () => void;
}

export interface ShiftGuardResult {
  isCheckingGuard: boolean;
  activeShift: SupabaseShiftRecord | ActiveShiftCache | null;
  guardError: string | null;
}

/**
 * Production-grade Shift Guard Hook
 * 
 * Melindungi alur POS dari double-shift, race condition, atau ketidaksinkronan sesi saat refresh browser.
 * Aturan Kerja:
 * 1. Periksa localStorage sebagai fast cache.
 * 2. Periksa Supabase sebagai Single Source of Truth.
 * 3. Jika localStorage dan Supabase berbeda (misal localStorage ada tapi di DB sudah CLOSED), percayai Supabase.
 */
export function useShiftGuard({
  mode,
  userId,
  cashierName,
  redirectToWhenActive = "/pekerja",
  redirectToWhenInactive = "/kasir",
  onActiveShiftFound,
  onNoActiveShift,
}: UseShiftGuardOptions): ShiftGuardResult {
  const router = useRouter();
  const [isCheckingGuard, setIsCheckingGuard] = useState<boolean>(true);
  const [activeShift, setActiveShift] = useState<SupabaseShiftRecord | ActiveShiftCache | null>(null);
  const [guardError, setGuardError] = useState<string | null>(null);
  const isGuardExecutedRef = useRef<boolean>(false);

  const executeGuard = useCallback(async () => {
    // Hindari eksekusi berulang dalam render loop yang sama
    if (isGuardExecutedRef.current) return;
    isGuardExecutedRef.current = true;

    setIsCheckingGuard(true);
    setGuardError(null);

    try {
      // 1. Cek fast cache lokal dari localStorage
      const localCache = getActiveShift();
      const targetUserId = userId || localCache?.cashier_id || "mock-1";
      const targetName = cashierName || localCache?.cashier_name || "Crew Member";

      if (mode === "block_open_shift_when_active") {
        // Jika fast cache mendeteksi shift aktif, nativisasi proteksi agar layar Open Shift tidak ter-render
        if (localCache && localCache.active_shift_id) {
          setActiveShift(localCache);
          if (onActiveShiftFound) onActiveShiftFound(localCache);
          const role = (localCache.role || "").toLowerCase();
          const targetPath = role === "barista" || role === "produksi" ? "/pekerja/produksi" : redirectToWhenActive;
          router.replace(targetPath);
          return;
        }
      }

      // 2. Cek ke Supabase (Single Source of Truth)
      const dbRecord = await checkActiveShiftInSupabase(targetUserId, targetName);

      if (dbRecord && dbRecord.id) {
        // --- SHIFT AKTIF DITEMUKAN DI SUPABASE ---
        const syncedCache = syncRecordToStorageCache(dbRecord, targetUserId, targetName);
        setActiveShift(syncedCache);
        if (onActiveShiftFound) onActiveShiftFound(syncedCache);

        if (mode === "block_open_shift_when_active") {
          // Cegah user melihat halaman buka shift jika shift sudah terbuka
          const role = (syncedCache.role || "").toLowerCase();
          const targetPath = role === "barista" || role === "produksi" ? "/pekerja/produksi" : redirectToWhenActive;
          router.replace(targetPath);
          return;
        }
      } else {
        // --- TIDAK ADA SHIFT AKTIF DI SUPABASE ---
        // Jika di localStorage masih ada cache lama padahal di DB sudah tidak aktif, bersihkan cache stale tsb
        if (localCache) {
          console.warn("[ShiftGuard] Stale cache terdeteksi. Membersihkan localStorage karena DB menunjukkan tidak ada shift OPEN.");
          clearActiveShift();
        }

        setActiveShift(null);
        if (onNoActiveShift) onNoActiveShift();

        if (mode === "require_active_shift") {
          // Jika mode mengharuskan shift aktif (misal layar kasir live) tapi belum ada, biarkan UI me-render form Buka Shift atau redirect ke Pilih Gerobak
          if (redirectToWhenInactive && redirectToWhenInactive !== "/pekerja") {
            router.replace(redirectToWhenInactive);
            return;
          }
        }
      }
    } catch (err: any) {
      console.error("[ShiftGuard] Execution error:", err);
      setGuardError(err.message || "Terjadi kesalahan saat memvalidasi sesi shift.");
    } finally {
      setIsCheckingGuard(false);
    }
  }, [mode, userId, cashierName, redirectToWhenActive, redirectToWhenInactive, onActiveShiftFound, onNoActiveShift, router]);

  useEffect(() => {
    executeGuard();
  }, [executeGuard]);

  return { isCheckingGuard, activeShift, guardError };
}
