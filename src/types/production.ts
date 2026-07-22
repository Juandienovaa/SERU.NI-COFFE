/**
 * Strict TypeScript Interfaces for Enterprise Manufacturing Console (Stage 2 MES).
 * Adheres to Shopify POS, Square POS, Toast POS, and Starbucks Production System standards.
 */

export type ProductionBatchStatus = "PENDING_BARISTA" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | string;

export interface ProductionBatch {
  id: string;
  batch_number: string;
  raw_cups_given: number;
  defect_cups: number;
  status: ProductionBatchStatus;
  created_at?: string;
  manager_id?: string;
  locked_by?: string | null;
  locked_at?: string | null;
}

export interface ProductCounterItem {
  id: string; // unique card element id, e.g., `prod-1` or `custom-1`
  product_id: number;
  product_name: string;
  quantity: number; // active draft quantity (or fallback total)
  draftQuantity?: number; // active mixing count
  submittedQuantity?: number; // total count already submitted to cashier/fridge
  category: "Coffee" | "Non-Coffee" | "Custom";
  unit: string;
  image?: string;
  sku?: string;
  iconName?: string;
}

export interface BatchItemPayload {
  batch_id: string;
  product_id: number;
  product_name: string;
  quantity_produced: number;
  created_at?: string;
}

export interface ProductionConversionPayload {
  batchId: string;
  defectCups: number;
  allocations: ProductCounterItem[];
  baristaId?: string;
  baristaName?: string;
}

export interface BalanceReconciliationResult {
  rawReceived: number;
  totalProduced: number;
  defectCups: number;
  remaining: number;
  isValid: boolean;
  canSubmit: boolean;
  statusType: "success" | "warning" | "danger";
  statusText: string;
  message: string;
}

export interface ProductionDraftState {
  batchId: string;
  batchNumber: string;
  rawCupsReceived: number;
  allocations: ProductCounterItem[];
  defectCups: number;
  lastUpdated: string;
  version: number;
  baristaId?: string;
  baristaName?: string;
}

export interface ProductionLockStatus {
  isLockedByOther: boolean;
  lockedBy?: string | null;
  lockedAt?: string | null;
  message?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T | null;
  error?: string | null;
}
