import { ProductCounterItem } from "@/types/production";
import { ProductCatalogItem } from "@/types/product";

/**
 * Enterprise Production Allocation Utilities.
 *
 * PRINSIP ARSITEKTUR:
 * Semua fungsi kalkulasi di file ini adalah PURE FUNCTIONS tanpa side-effect.
 * Setiap nilai numerik dikonversi secara eksplisit menggunakan `normalizeInteger()`
 * untuk mencegah string concatenation (`"10" + 5 = "105"`) dan menjamin
 * deterministic integer arithmetic di seluruh Manufacturing Accounting System.
 */

// ============================================================
// STRICT NUMERIC NORMALIZATION ENGINE
// ============================================================

/**
 * Mengonversi nilai apapun menjadi integer non-negatif yang aman.
 *
 * MENGAPA FUNGSI INI DIPERLUKAN:
 * 1. HTML `<input>` mengembalikan `string`, bukan `number`.
 *    Tanpa konversi eksplisit, operator `+` di JavaScript melakukan
 *    string concatenation: `"10" + 5 = "105"` (BUKAN 15).
 * 2. Data dari Supabase bisa berupa `null`, `undefined`, atau `string`
 *    tergantung pada tipe kolom dan mapping ORM.
 * 3. `NaN`, `Infinity`, dan angka negatif HARUS ditolak karena
 *    kuantitas produksi fisik selalu berupa bilangan bulat positif.
 *
 * @param val - Nilai mentah dari input, database, atau state React
 * @returns Integer non-negatif (>= 0), hasil pembulatan ke bawah (floor)
 */
export function normalizeInteger(val: unknown): number {
  // Konversi ke Number terlebih dahulu
  const num = Number(val);

  // Tolak NaN, Infinity, dan nilai negatif — fallback ke 0
  if (!Number.isFinite(num) || num < 0) return 0;

  // Bulatkan ke bawah untuk mencegah desimal (0.5 Cup tidak valid)
  return Math.floor(num);
}

// ============================================================
// PRODUCTION ALLOCATION CALCULATORS
// ============================================================

/**
 * Menghitung total draft (sedang diracik) dari seluruh kartu produk.
 *
 * MENGAPA MENGGUNAKAN `normalizeInteger()` DI SETIAP ITEM:
 * React state bisa menyimpan nilai string jika terjadi kesalahan
 * di boundary input handler. Normalisasi di titik kalkulasi
 * menjamin akurasi aritmatika terlepas dari tipe data yang masuk.
 */
export function calculateTotalDraft(allocations: ReadonlyArray<ProductCounterItem>): number {
  if (!allocations || allocations.length === 0) return 0;
  return allocations.reduce((sum, item) => {
    const draft = normalizeInteger(
      item.draftQuantity !== undefined ? item.draftQuantity : item.quantity
    );
    return sum + draft;
  }, 0);
}

/**
 * Menghitung total submitted (sudah disetor ke Kasir/Kulkas) dari seluruh kartu produk.
 */
export function calculateTotalSubmitted(allocations: ReadonlyArray<ProductCounterItem>): number {
  if (!allocations || allocations.length === 0) return 0;
  return allocations.reduce((sum, item) => {
    return sum + normalizeInteger(item.submittedQuantity);
  }, 0);
}

/**
 * Menghitung total alokasi (draft + submitted) dari seluruh kartu produk.
 *
 * RUMUS AKUNTANSI PRODUKSI:
 * Total Allocated = Σ(draftQuantity[i] + submittedQuantity[i])
 *
 * Fungsi ini digunakan oleh `calculateRemainingCups()` dan `validateProductionInvariant()`.
 */
export function calculateTotalAllocated(allocations: ReadonlyArray<ProductCounterItem>): number {
  return calculateTotalDraft(allocations) + calculateTotalSubmitted(allocations);
}

/**
 * Menghitung sisa gelas mentah yang belum dialokasikan.
 *
 * RUMUS AKUNTANSI:
 * Remaining = Raw Received - (Total Allocated + Defect Cups)
 *
 * MENGAPA `Math.max(0, ...)`:
 * Mencegah nilai negatif yang bisa terjadi jika ada race condition
 * antara penyetoran dan perubahan alokasi. Stok fisik tidak bisa negatif.
 *
 * PENTING: Remaining SELALU diturunkan (derived), BUKAN disimpan sebagai state.
 * Menyimpan Remaining sebagai state independen menyebabkan state drift
 * (nilai Remaining tidak sinkron dengan draft/submitted yang sebenarnya).
 */
export function calculateRemainingCups(
  rawReceived: number,
  allocations: ReadonlyArray<ProductCounterItem>,
  defectCups: number
): number {
  const safeRaw = normalizeInteger(rawReceived);
  const totalAllocated = calculateTotalAllocated(allocations);
  const safeDefect = normalizeInteger(defectCups);
  return Math.max(0, safeRaw - (totalAllocated + safeDefect));
}

/**
 * Menghitung persentase progres produksi (0 - 100%).
 */
export function calculateProgressPercentage(
  rawReceived: number,
  allocations: ReadonlyArray<ProductCounterItem>,
  defectCups: number
): number {
  const safeRaw = normalizeInteger(rawReceived);
  if (safeRaw <= 0) return 0;
  const totalUsed = calculateTotalAllocated(allocations) + normalizeInteger(defectCups);
  const percentage = (totalUsed / safeRaw) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

// ============================================================
// PRODUCT COUNTER INITIALIZATION
// ============================================================

/**
 * Membuat daftar kartu penghitung produk dari katalog resmi.
 *
 * PRINSIP ENTERPRISE:
 * - Katalog HARUS diberikan dari luar (parameter `catalog`).
 * - TIDAK ADA fallback ke array hardcoded atau dummy products.
 * - Jika katalog kosong, kembalikan array kosong — UI akan menampilkan
 *   pesan "Tidak ada produk" yang akurat sesuai kondisi database.
 * - Semua nilai numerik diinisialisasi sebagai integer `0` (bukan string "0").
 */
export function getDefaultProductCounters(
  catalog?: ReadonlyArray<ProductCatalogItem>
): ProductCounterItem[] {
  // MENGAPA TIDAK ADA FALLBACK DUMMY:
  // Dalam sistem Enterprise MES (SAP, Oracle, Shopify POS), produk yang muncul
  // di workstation produksi harus 100% sesuai dengan master database.
  // Menampilkan produk palsu menyebabkan Barista mengalokasikan gelas
  // ke menu yang tidak ada, dan merusak akuntansi inventaris.
  if (!catalog || catalog.length === 0) {
    return [];
  }

  return catalog.map((item): ProductCounterItem => ({
    id: `prod-${item.product_id}`,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: 0,
    draftQuantity: 0,
    submittedQuantity: 0,
    category: item.category,
    unit: item.unit || "Cup",
    image: item.image,
    sku: item.sku,
    iconName: item.category === "Non-Coffee" ? "Sparkles" : "Coffee"
  }));
}
