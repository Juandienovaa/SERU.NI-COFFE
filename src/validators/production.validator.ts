import { ProductCounterItem, BalanceReconciliationResult } from "@/types/production";
import { normalizeInteger } from "@/utils/allocation";

/**
 * Enterprise Production Invariant Validator.
 *
 * PRINSIP AKUNTANSI MANUFAKTUR:
 * Setiap batch produksi harus memenuhi persamaan konservasi:
 *   Finished Products + Defect Cups == Raw Cups Received
 *
 * Validator ini memeriksa persamaan tersebut secara deterministic
 * menggunakan `normalizeInteger()` di setiap boundary numerik untuk
 * mencegah string concatenation dan floating-point drift.
 */
export function validateProductionInvariant(
  rawReceived: number,
  allocations: ReadonlyArray<ProductCounterItem>,
  defectCups: number
): BalanceReconciliationResult {
  const safeRaw = normalizeInteger(rawReceived);
  const safeDefect = normalizeInteger(defectCups);

  /**
   * MENGAPA `normalizeInteger()` DI SETIAP ITEM:
   * React state bisa berisi campuran `string | number | undefined` jika
   * terjadi kesalahan di boundary input handler. Normalisasi eksplisit
   * di titik kalkulasi menjamin aritmatika integer yang deterministik.
   */
  const totalProduced = allocations.reduce((sum, item) => {
    const draft = normalizeInteger(
      item.draftQuantity !== undefined ? item.draftQuantity : item.quantity
    );
    const submitted = normalizeInteger(item.submittedQuantity);
    return sum + draft + submitted;
  }, 0);

  const totalAllocatedAndDefect = totalProduced + safeDefect;
  const remaining = safeRaw - totalAllocatedAndDefect;

  if (remaining < 0) {
    return {
      rawReceived: safeRaw,
      totalProduced,
      defectCups: safeDefect,
      remaining,
      isValid: false,
      canSubmit: false,
      statusType: "danger",
      statusText: "🔴 Over-Allocated / Surplus",
      message: `Kelebihan Alokasi! Kurangi ${Math.abs(remaining)} Cup agar sesuai jatah modal mentah.`
    };
  }

  if (remaining === 0 && safeRaw > 0 && (totalProduced > 0 || safeDefect > 0)) {
    return {
      rawReceived: safeRaw,
      totalProduced,
      defectCups: safeDefect,
      remaining: 0,
      isValid: true,
      canSubmit: true,
      statusType: "success",
      statusText: "🟢 Production Balanced",
      message: "Alokasi Seimbang. Seluruh gelas telah didata."
    };
  }

  if (remaining === 0 && safeRaw === 0) {
    return {
      rawReceived: safeRaw,
      totalProduced,
      defectCups: safeDefect,
      remaining: 0,
      isValid: false,
      canSubmit: false,
      statusType: "warning",
      statusText: "🟡 Belum Ada Modal",
      message: "Alokasi Belum Lengkap. Sesi belum menerima modal gelas dari manajer."
    };
  }

  return {
    rawReceived: safeRaw,
    totalProduced,
    defectCups: safeDefect,
    remaining,
    isValid: false,
    canSubmit: false,
    statusType: "warning",
    statusText: "🟡 Not Balanced (Remaining Cups)",
    message: `Alokasi Belum Lengkap. Masih ada selisih ${remaining} Cup yang harus dialokasikan.`
  };
}

/**
 * Clamp input kuantitas agar tidak melebihi batas sisa gelas.
 *
 * MENGAPA DIPERLUKAN:
 * Barista bisa mengetik angka besar di input text (misal: "999").
 * Fungsi ini memastikan nilai yang diterima tidak melebihi
 * `currentQuantity + remainingCups` (batas fisik yang tersedia).
 */
export function clampQuantityInput(
  desiredQuantity: number,
  currentQuantity: number,
  remainingCups: number
): { clampedQuantity: number; wasClamped: boolean; explanation?: string } {
  const cleanDesired = normalizeInteger(desiredQuantity);
  const cleanCurrent = normalizeInteger(currentQuantity);
  const cleanRemaining = normalizeInteger(remainingCups);
  const delta = cleanDesired - cleanCurrent;

  // Jika mengurangi atau mempertahankan nilai, tidak perlu clamping
  if (delta <= 0) {
    return { clampedQuantity: cleanDesired, wasClamped: false };
  }

  // Jika delta melebihi sisa gelas yang tersedia, clamp!
  if (delta > cleanRemaining) {
    const maxPossible = cleanCurrent + cleanRemaining;
    return {
      clampedQuantity: maxPossible,
      wasClamped: true,
      explanation: `Sistem menyesuaikan input menjadi ${maxPossible} cup batas maksimal (karena sisa gelas mentah hanya ${cleanRemaining} cup).`
    };
  }

  return { clampedQuantity: cleanDesired, wasClamped: false };
}

/**
 * Memeriksa apakah tombol increment (+) masih bisa diklik.
 * Tombol disabled jika sisa gelas <= 0.
 */
export function canIncrement(remainingCups: number): boolean {
  return normalizeInteger(remainingCups) > 0;
}
