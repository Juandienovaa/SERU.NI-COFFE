"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AppModal } from "@/components/ui/AppModal";
import { InventoryItemSnapshot, CloseShiftPayload } from "@/types/shift";
import { calculateShiftClosingFinancials, calculateInventoryTotals } from "@/utils/financial";
import { tutupShift } from "@/services/backendService";
import { getShiftCheckoutSummary } from "@/services/shiftSummary";
import { fetchAllProducts } from "@/services/productService";

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessClose: () => void;
  shiftId: string;
  shiftName?: string;
  cashierName: string;
  locationName: string;
  openTime: string;
  cashRevenue: number;
  qrisRevenue: number;
  totalTransactions?: number;
  inventoryData: InventoryItemSnapshot[];
}

export default function CloseShiftModal({
  isOpen,
  onClose,
  onSuccessClose,
  shiftId,
  cashRevenue,
  qrisRevenue,
  totalTransactions = 0,
  inventoryData,
}: CloseShiftModalProps) {
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStockDetails, setShowStockDetails] = useState<boolean>(false);

  // Secure data loaded from backend
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [productNames, setProductNames] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen && shiftId) {
      setLoadingSummary(true);
      setErrorMessage(null);
      
      Promise.all([
        getShiftCheckoutSummary(shiftId),
        fetchAllProducts()
      ])
        .then(([summary, productsRes]) => {
          setSummaryData(summary);
          if (productsRes.success && productsRes.data) {
            const namesMap: Record<number, string> = {};
            productsRes.data.forEach(p => {
              namesMap[p.product_id] = p.product_name;
            });
            setProductNames(namesMap);
          }
        })
        .catch((err) => {
          console.error("Gagal memuat ringkasan shift:", err);
          setErrorMessage("Gagal memuat ringkasan shift dari database.");
        })
        .finally(() => setLoadingSummary(false));
    } else {
      setSummaryData(null);
    }
  }, [isOpen, shiftId]);

  // Keyboard support: Escape to close when not loading
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing, onClose]);

  if (!isOpen) return null;

  const totalPhysicalStock = summaryData?.totalPhysicalStock || 0;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  const handleConfirmClose = async () => {
    if (!shiftId) {
      setErrorMessage("ID Shift tidak valid atau sesi aktif hilang.");
      return;
    }

    try {
      setIsClosing(true);
      setErrorMessage(null);

      const closePayload: CloseShiftPayload = {
        shift_id: shiftId,
        closed_at: new Date().toISOString(),
        cash_revenue: summaryData?.cashRevenue || 0,
        qris_revenue: summaryData?.qrisRevenue || 0,
        total_sales: summaryData?.totalRevenue || 0,
        total_cups: summaryData?.totalCupsSold || 0,
        bonus_amount: summaryData?.bonusAmount || 0,
        is_bonus_achieved: summaryData?.isBonusAchieved || false,
        cash_deposit: summaryData?.cashDeposit || 0,
        inventory_data: inventoryData || [], // Legacy fallback
        status: "CLOSED",
      };

      await tutupShift(closePayload);
      onSuccessClose();
    } catch (err: any) {
      console.error("Gagal menutup shift:", err);
      setErrorMessage(
        err?.message || "Terjadi kesalahan saat memproses penutupan shift ke database Supabase."
      );
    } finally {
      setIsClosing(false);
    }
  };

  const modalFooter = (
    <div className="flex w-full gap-3 shrink-0">
      <button
        onClick={onClose}
        disabled={isClosing}
        type="button"
        className="flex-1 py-4 rounded-2xl bg-[#1A1A1A] text-white font-bold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-40"
      >
        Batal
      </button>
      <button
        onClick={handleConfirmClose}
        disabled={isClosing}
        type="button"
        className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        {isClosing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Memproses...</span>
          </>
        ) : (
          "Konfirmasi Tutup"
        )}
      </button>
    </div>
  );

  return (
    <AppModal
      open={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={!isClosing}
      closeOnEsc={!isClosing}
      closeOnBackdrop={!isClosing}
      footer={modalFooter}
    >
      <div className="flex flex-col items-center text-center">
        {/* Top Alert Circle */}
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3 shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>

        <h3 className="text-lg font-black text-white mb-1.5">Tutup Shift Sekarang?</h3>
        <p className="text-neutral-400 text-[11px] mb-5 leading-snug">
          Data stok akhir akan dikunci dan Anda akan keluar dari mode kasir.
        </p>

          {errorMessage && (
            <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-xs text-left">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}

          {loadingSummary ? (
            <div className="flex flex-col items-center justify-center p-8 bg-[#1A1A1A] rounded-2xl border border-neutral-800 mb-6 w-full gap-3">
              <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
              <p className="text-xs font-mono text-neutral-500">Mengkalkulasi transaksi shift...</p>
            </div>
          ) : summaryData ? (
            <div className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-4 mb-6 text-left space-y-3 font-sans">
              
              {/* Total Omset */}
              <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                <span className="text-xs font-bold text-neutral-400">Total Omset</span>
                <div className="text-right">
                  <span className="text-base font-black text-[#EA580C]">
                    {formatRupiah(summaryData.totalRevenue)}
                  </span>
                  <div className="text-[10px] font-semibold text-neutral-500 mt-0.5">
                    Tunai: {formatRupiah(summaryData.cashRevenue)} | QRIS: {formatRupiah(summaryData.qrisRevenue)}
                  </div>
                </div>
              </div>

              {/* Cup Terjual & Bonus */}
              <div className="flex justify-between items-center py-3 border-b border-neutral-800">
                <span className="text-xs font-bold text-neutral-400">Cup Terjual</span>
                <div className="text-right">
                  <span className="text-sm font-black text-[#10B981]">{summaryData.totalCupsSold} Cup</span>
                  {summaryData.isBonusAchieved ? (
                    <div className="text-[10px] font-bold text-emerald-400 mt-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      🎉 Bonus 100 Cup (-Rp 50.000)
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Kurang {Math.max(0, 100 - summaryData.totalCupsSold)} Cup untuk Bonus
                    </div>
                  )}
                </div>
              </div>

              {/* Setoran Tunai Bersih */}
              <div className="flex justify-between items-center py-3 border-b border-neutral-800 bg-neutral-900/60 px-3 -mx-1 rounded-xl border border-orange-500/20">
                <div>
                  <span className="text-xs font-bold text-white block">Wajib Setor Tunai</span>
                  {summaryData.isBonusAchieved ? (
                    <span className="text-[9px] text-emerald-400 block font-semibold">
                      Omset Tunai dikurangi bonus Rp 50.000
                    </span>
                  ) : (
                    <span className="text-[9px] text-neutral-400 block">
                      Omset Tunai utuh dari laci
                    </span>
                  )}
                </div>
                <span className="text-base font-black text-white">
                  {formatRupiah(summaryData.cashDeposit)}
                </span>
              </div>

              {/* Sisa Stok Fisik */}
              <div className="pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-400">Sisa Stok Fisik</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-red-500">{summaryData.totalPhysicalStock} Item</span>
                    <button
                      type="button"
                      onClick={() => setShowStockDetails(!showStockDetails)}
                      className="text-[10px] text-neutral-400 hover:text-white underline ml-1"
                    >
                      {showStockDetails ? "Tutup" : "Rincian"}
                    </button>
                  </div>
                </div>

              {showStockDetails && (
                <div className="max-h-32 overflow-y-auto mt-2 pt-2 border-t border-neutral-800 space-y-1.5 text-left text-[11px] pr-1">
                  {(inventoryData || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-neutral-300">
                      <span className="truncate pr-2">{productNames[item.product_id] || item.nama || `Produk #${item.product_id}`}</span>
                      <span className="font-mono font-bold text-neutral-400 shrink-0">
                        {item.sisa || 0} pcs
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppModal>
  );
}
