/**
 * Enterprise POS Shift Storage Service
 * 
 * Mengatur penyimpanan cache lokal (localStorage) dengan skema minimalis dan terstandarisasi.
 * Catatan Aturan Bisnis POS:
 * localStorage di sini HANYA bertindak sebagai cache cepat untuk meningkatkan UX (fast initial render).
 * Supabase tetap menjadi Single Source of Truth yang otentik.
 */

export interface ActiveShiftCache {
  active_shift_id: string;
  location_id: string;
  location_name: string;
  cashier_id: string;
  cashier_name: string;
  role?: string;
  status: "OPEN";
  opened_at: string;
  shift_type?: "pagi" | "malam";
}

const STORAGE_KEY_ACTIVE_SHIFT = "pos_active_shift_cache";
const LEGACY_KEY_SESSION = "session";
const LEGACY_KEY_POS_SESSION = "pos_shift_session";

/**
 * Menyimpan data shift aktif yang sedang berjalan ke localStorage.
 * Hanya menyimpan properti minimalis yang diperlukan oleh antarmuka POS.
 */
export function saveActiveShift(shift: ActiveShiftCache): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Simpan ke key cache utama yang terspesialisasi
    localStorage.setItem(STORAGE_KEY_ACTIVE_SHIFT, JSON.stringify(shift));

    // 2. Simpan juga ke key legacy (`session` & `pos_shift_session`) untuk kompatibilitas penuh dengan komponen eksisting
    const legacySessionPayload = {
      id: shift.cashier_id,
      nama: shift.cashier_name,
      role: shift.role || "crew",
      lokasi: shift.location_name || shift.location_id,
      shift_id: shift.active_shift_id,
      shiftType: shift.shift_type || "pagi",
      loginTime: shift.opened_at || new Date().toISOString(),
    };

    localStorage.setItem(LEGACY_KEY_SESSION, JSON.stringify(legacySessionPayload));
    localStorage.setItem(LEGACY_KEY_POS_SESSION, JSON.stringify(legacySessionPayload));
  } catch (err) {
    console.warn("Gagal menyimpan active shift ke localStorage:", err);
  }
}

/**
 * Mengambil data shift aktif dari localStorage (jika ada).
 * Mengembalikan null jika cache kosong atau rusak.
 */
export function getActiveShift(): ActiveShiftCache | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_SHIFT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.active_shift_id && parsed.status === "OPEN") {
        return parsed as ActiveShiftCache;
      }
    }

    // Fallback: Jika key utama kosong, coba periksa key legacy dan normalisasikan jika ada shift_id
    const legacyRaw = localStorage.getItem(LEGACY_KEY_SESSION) || localStorage.getItem(LEGACY_KEY_POS_SESSION);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (legacy && legacy.shift_id) {
        const normalized: ActiveShiftCache = {
          active_shift_id: legacy.shift_id,
          location_id: legacy.lokasi || "Seruling Pasar",
          location_name: legacy.lokasi || "Seruling Pasar",
          cashier_id: legacy.id || "mock-1",
          cashier_name: legacy.nama || "Crew Member",
          role: legacy.role || "crew",
          status: "OPEN",
          opened_at: legacy.loginTime || new Date().toISOString(),
          shift_type: legacy.shiftType || "pagi",
        };
        // Auto-heal cache utama
        localStorage.setItem(STORAGE_KEY_ACTIVE_SHIFT, JSON.stringify(normalized));
        return normalized;
      }
    }

    return null;
  } catch (err) {
    console.warn("Gagal membaca active shift dari localStorage:", err);
    return null;
  }
}

/**
 * Menghapus seluruh data sesi shift dari cache browser saat shift ditutup (CLOSED) atau logout.
 */
export function clearActiveShift(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_SHIFT);
    localStorage.removeItem(LEGACY_KEY_SESSION);
    localStorage.removeItem(LEGACY_KEY_POS_SESSION);
  } catch (err) {
    console.warn("Gagal membersihkan cache active shift dari localStorage:", err);
  }
}
