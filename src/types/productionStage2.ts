/**
 * Definisi tipe data ketat (Strict TypeScript Interfaces) untuk Stage 2
 * Enterprise Production Tracking System (Barista Production Conversion).
 * Mengadopsi standar akuntansi MES (Manufacturing Execution System) dan ERP.
 */

export interface ProductionBatchStage2 {
  id: string;
  batch_number: string;
  raw_cups_given: number;
  defect_cups: number;
  status: "PENDING_BARISTA" | "COMPLETED" | "CANCELLED" | string;
  created_at?: string;
  manager_id?: string;
}

/**
 * Representasi item alokasi di antarmuka workspace barista.
 */
export interface AllocationItem {
  id: string;
  productName: string;
  quantity: number;
  category?: "Coffee" | "Non-Coffee" | "Custom";
}

/**
 * Payload penulisan untuk tabel `batch_items` (ketat sesuai spesifikasi database).
 */
export interface BatchItemPayload {
  batch_id: string;
  product_name: string;
  quantity_produced: number;
}

/**
 * Payload pengiriman konversi produksi dari Barista ke database.
 */
export interface ProductionConversionPayload {
  batchId: string;
  defectCups: number;
  allocations: AllocationItem[];
}

/**
 * Hasil kalkulasi dan validasi real-time dari persamaan pertanggungjawaban gelas.
 */
export interface BalanceCalculationResult {
  rawReceived: number;
  totalProduced: number;
  defectCups: number;
  remaining: number;
  isValid: boolean;
  statusType: "success" | "warning" | "danger";
  message: string;
}

/**
 * Respon standar dari service layer Stage 2.
 */
export interface Stage2ServiceResponse<T = any> {
  success: boolean;
  data?: T | null;
  error?: string | null;
}
