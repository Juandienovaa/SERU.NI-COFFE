/**
 * Enterprise POS Shift Auth & DB Service
 * 
 * Mengelola verifikasi dan pengambilan data shift dari Supabase sebagai Single Source of Truth.
 * Dioptimalkan untuk kompatibilitas Row Level Security (RLS) dan efisiensi payload (tanpa duplikasi query).
 */

import { supabase } from "@/lib/supabase";
import { ActiveShiftCache, saveActiveShift } from "./shiftStorageService";

export interface SupabaseShiftRecord {
  id: string;
  user_id?: string | null;
  crew_name?: string | null;
  outlet_id: string;
  shift_type?: "pagi" | "malam";
  status: string;
  created_at?: string;
  opened_at?: string;
  inventory_data?: any[];
  total_sales?: number;
  omset_tunai?: number;
  omset_qris?: number;
}

/**
 * Memeriksa apakah seorang kasir (berdasarkan ID user atau nama crew) memiliki shift aktif (OPEN) di Supabase.
 * 
 * @param userId - ID user dari tabel users (atau ID otentikasi)
 * @param cashierName - Nama crew kasir sebagai fallback yang resilien terhadap sesi PIN RLS
 * @returns SupabaseShiftRecord jika ada shift aktif, null jika tidak ada atau error.
 */
export async function checkActiveShiftInSupabase(
  userId: string,
  cashierName?: string
): Promise<SupabaseShiftRecord | null> {
  try {
    // 1. Query kolom esensial dari tabel shifts, urutkan berdasarkan waktu buat terbaru, limit 1
    let query = supabase
      .from("shifts")
      .select("id, user_id, crew_name, outlet_id, shift_type, status, created_at, inventory_data, total_sales, omset_tunai, omset_qris")
      .in("status", ["OPEN", "open", "aktif", "Aktif"]);

    // 2. Resilient filtering: prioritaskan user_id, fallback ke crew_name jika user_id null atau mock
    if (userId && !userId.startsWith("mock-")) {
      if (cashierName) {
        query = query.or(`user_id.eq.${userId},crew_name.eq.${cashierName}`);
      } else {
        query = query.eq("user_id", userId);
      }
    } else if (cashierName) {
      query = query.eq("crew_name", cashierName);
    } else {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.warn("[checkActiveShiftInSupabase] Query error (kemungkinan RLS atau koneksi):", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    return data && data.length > 0 ? (data[0] as SupabaseShiftRecord) : null;
  } catch (err) {
    console.error("[checkActiveShiftInSupabase] Unexpected error:", err);
    return null;
  }
}

/**
 * Sinkronisasi cepat dari record Supabase ke dalam cache localStorage (ActiveShiftCache).
 */
export function syncRecordToStorageCache(
  record: SupabaseShiftRecord, 
  fallbackUserId: string, 
  fallbackName: string, 
  fallbackRole: string = "crew"
): ActiveShiftCache {
  const cachePayload: ActiveShiftCache = {
    active_shift_id: record.id,
    location_id: record.outlet_id || "Seruling Pasar",
    location_name: record.outlet_id || "Seruling Pasar",
    cashier_id: record.user_id || fallbackUserId,
    cashier_name: record.crew_name || fallbackName,
    role: fallbackRole,
    status: "OPEN",
    opened_at: record.opened_at || record.created_at || new Date().toISOString(),
    shift_type: record.shift_type || "pagi",
  };

  saveActiveShift(cachePayload);
  return cachePayload;
}
