import { AllocationItem, BalanceCalculationResult } from "@/types/productionStage2";

/**
 * Mesin kalkulasi murni (Pure Mathematical Engine) untuk Stage 2 MES.
 * Menjamin hukum kekekalan barang (Conservation of Cups):
 * RAW CUPS RECEIVED = TOTAL FINISHED PRODUCTS + TOTAL DEFECT CUPS.
 */

/**
 * Menghitung total seluruh produk jadi yang dialokasikan oleh barista.
 */
export function calculateTotalProduced(allocations: AllocationItem[]): number {
  if (!Array.isArray(allocations)) return 0;
  return allocations.reduce((acc, item) => {
    const qty = Number(item.quantity);
    return acc + (isNaN(qty) || qty < 0 ? 0 : qty);
  }, 0);
}

/**
 * Menghitung sisa kuota gelas yang belum dipertanggungjawabkan (Remaining Allocation).
 * Rumus: Raw Cups Received - (Total Finished Products + Defect Cups)
 */
export function calculateRemaining(rawCups: number, totalProduced: number, defectCups: number): number {
  const safeRaw = isNaN(Number(rawCups)) ? 0 : Math.max(0, Number(rawCups));
  const safeProduced = isNaN(Number(totalProduced)) ? 0 : Math.max(0, Number(totalProduced));
  const safeDefect = isNaN(Number(defectCups)) ? 0 : Math.max(0, Number(defectCups));

  return safeRaw - (safeProduced + safeDefect);
}

/**
 * Menganalisis dan memvalidasi persamaan pertanggungjawaban gelas secara komprehensif.
 * Mengembalikan status visual (success/warning/danger) dan pesan audit yang jelas.
 */
export function validateProductionBalance(
  rawCups: number,
  allocations: AllocationItem[],
  defectCups: number
): BalanceCalculationResult {
  const safeRaw = Math.max(0, Number(rawCups) || 0);
  const safeDefect = Math.max(0, Number(defectCups) || 0);
  const totalProduced = calculateTotalProduced(allocations);
  const remaining = calculateRemaining(safeRaw, totalProduced, safeDefect);

  // Skenario 1: Masih ada sisa kuota gelas yang belum dialokasikan (Remaining > 0)
  if (remaining > 0) {
    return {
      rawReceived: safeRaw,
      totalProduced,
      defectCups: safeDefect,
      remaining,
      isValid: false,
      statusType: "warning",
      message: `${remaining} cup masih belum dialokasikan ke produk jadi atau catatan cacat.`
    };
  }

  // Skenario 2: Alokasi melebihi modal gelas yang diterima (Remaining < 0)
  if (remaining < 0) {
    const excess = Math.abs(remaining);
    return {
      rawReceived: safeRaw,
      totalProduced,
      defectCups: safeDefect,
      remaining,
      isValid: false,
      statusType: "danger",
      message: `Alokasi melebihi jumlah gelas yang diterima dari manajer sebanyak ${excess} cup!`
    };
  }

  // Skenario 3: Remaining === 0, namun semua nilai adalah 0 atau belum ada produk yang dihasilkan
  if (totalProduced === 0 && safeDefect === 0) {
    return {
      rawReceived: safeRaw,
      totalProduced,
      defectCups: safeDefect,
      remaining,
      isValid: false,
      statusType: "warning",
      message: "Masukkan jumlah alokasi produk atau catatan gelas rusak terlebih dahulu."
    };
  }

  // Skenario 4: Seimbang sempurna dan siap diselesaikan (Remaining === 0)
  return {
    rawReceived: safeRaw,
    totalProduced,
    defectCups: safeDefect,
    remaining,
    isValid: true,
    statusType: "success",
    message: "Produksi seimbang dengan sempurna. Sesi siap untuk dikunci dan diselesaikan."
  };
}
