import { ProductionBatch, ProductionBatchStatus } from "./production";

export type BatchStatus = ProductionBatchStatus;
export type { ProductionBatch };

/**
 * Payload untuk pembuatan batch baru oleh Manajer.
 * Hanya memerlukan jumlah gelas mentah dan data auth/batch yang di-generate sistem.
 */
export interface CreateProductionBatchPayload {
  batch_number: string;
  manager_id?: string;
  raw_cups_given: number;
  defect_cups: number;
  status: BatchStatus;
  created_at?: string;
}

/**
 * Struktur respon standar dari `productionBatchService`.
 */
export interface ProductionBatchServiceResponse<T> {
  data: T | null;
  error: string | null;
}
