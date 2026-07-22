/**
 * Enterprise POS Shift Closing System - Type Definitions
 * 
 * Kontrak data tipe ketat (Production-Ready TypeScript tanpa any) untuk memastikan
 * keakuratan audit finansial, penghitungan stok fisik, dan riwayat penutupan shift.
 */

export interface InventoryItemSnapshot {
  product_id: number;
  nama: string;
  stok_awal: number;
  terjual: number;
  sisa: number;
  unit?: string;
  added_stock?: number;
}

export interface ShiftClosingSummary {
  shift_id: string;
  shift_name: string;
  cashier_name: string;
  location_name: string;
  opened_at: string;
  closed_at: string;
  cash_revenue: number;
  qris_revenue: number;
  total_revenue: number;
  total_cups_sold: number;
  total_transactions: number;
  avg_cups_per_tx: number;
  avg_revenue_per_tx: number;
  bonus_achieved: boolean;
  bonus_amount: number;
  cash_deposit: number;
  inventory_snapshot: InventoryItemSnapshot[];
}

export interface CloseShiftPayload {
  shift_id: string;
  closed_at: string;
  cash_revenue: number;
  qris_revenue: number;
  total_sales: number;
  total_cups: number;
  bonus_amount: number;
  is_bonus_achieved: boolean;
  cash_deposit: number;
  inventory_data: InventoryItemSnapshot[];
  status: "CLOSED";
}
