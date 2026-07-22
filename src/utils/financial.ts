/**
 * Enterprise POS Shift Closing System - Financial Calculation Engine
 * 
 * Mesin kalkulasi finansial murni (*Pure Utilities*) untuk menjamin tidak ada
 * salah hitung atau input manual pada setoran kasir dan perhitungan bonus.
 */

import { InventoryItemSnapshot } from "@/types/shift";

export interface ShiftFinancialInput {
  cashRevenue: number;
  qrisRevenue: number;
  totalCupsSold: number;
  totalTransactions: number;
}

export interface ShiftFinancialResult {
  totalRevenue: number;
  avgCupsPerTx: number;
  avgRevenuePerTx: number;
  bonusAchieved: boolean;
  bonusAmount: number;
  cashDeposit: number;
}

export const TARGET_CUPS_BONUS = 100;
export const BONUS_AMOUNT_IDR = 50000;

/**
 * Menghitung seluruh metrik finansial, kelayakan bonus, dan setoran tunai bersih
 * secara atomik dari data penjualan.
 */
export function calculateShiftClosingFinancials(input: ShiftFinancialInput): ShiftFinancialResult {
  const { cashRevenue = 0, qrisRevenue = 0, totalCupsSold = 0, totalTransactions = 0 } = input;

  const totalRevenue = cashRevenue + qrisRevenue;
  const avgCupsPerTx = totalTransactions > 0 ? Number((totalCupsSold / totalTransactions).toFixed(1)) : 0;
  const avgRevenuePerTx = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  // Aturan Bisnis Bonus 100 Cup
  const bonusAchieved = totalCupsSold >= TARGET_CUPS_BONUS;
  const bonusAmount = bonusAchieved ? BONUS_AMOUNT_IDR : 0;

  // Setoran Tunai Bersih = Omset Tunai dikurangi Bonus yang diambil kasir langsung dari laci kasir
  const cashDeposit = Math.max(0, cashRevenue - bonusAmount);

  return {
    totalRevenue,
    avgCupsPerTx,
    avgRevenuePerTx,
    bonusAchieved,
    bonusAmount,
    cashDeposit,
  };
}

/**
 * Helper untuk menghitung total cup terjual dan sisa stok fisik dari snapshot inventory.
 */
export function calculateInventoryTotals(inventory: InventoryItemSnapshot[]) {
  const totalCupsSold = inventory.reduce((acc, item) => acc + (Number(item.terjual) || 0), 0);
  const totalRemainingStock = inventory.reduce((acc, item) => acc + (Number(item.sisa) || 0), 0);
  const totalInitialStock = inventory.reduce((acc, item) => acc + (Number(item.stok_awal) || 0), 0);

  return {
    totalCupsSold,
    totalRemainingStock,
    totalInitialStock,
  };
}

/**
 * Format angka menjadi mata uang Rupiah standar IDR (contoh: Rp 1.250.000).
 */
export function formatRupiah(num: number): string {
  const cleanNum = Number(num) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(cleanNum);
}
