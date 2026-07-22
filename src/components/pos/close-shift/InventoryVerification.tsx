"use client";

import React from "react";
import { PackageCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { InventoryItemSnapshot } from "@/types/shift";

interface InventoryVerificationProps {
  inventoryData: InventoryItemSnapshot[];
}

export default function InventoryVerification({ inventoryData }: InventoryVerificationProps) {
  if (!inventoryData || inventoryData.length === 0) {
    return (
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 text-center text-neutral-400 text-xs">
        Data verifikasi stok tidak tersedia.
      </div>
    );
  }

  const totalPhysicalRemaining = inventoryData.reduce(
    (acc, item) => acc + (Number(item.sisa) || 0),
    0
  );

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-inner flex flex-col">
      {/* Sticky Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800/80 px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <span>Verifikasi Stok Akhir Fisik (Mandatory)</span>
            </h4>
            <p className="text-[11px] text-neutral-400">
              Cocokkan jumlah sisa cup di layar dengan fisik gerobak sebelum menutup shift.
            </p>
          </div>
        </div>
        <div className="bg-black/60 border border-neutral-700/60 rounded-full px-3 py-1 text-xs font-bold text-white flex items-center gap-1.5 shrink-0">
          <span className="text-neutral-400 font-normal">Total Fisik:</span>
          <span className="text-emerald-400 font-black font-mono">{totalPhysicalRemaining} pcs</span>
        </div>
      </div>

      {/* Daftar Produk */}
      <div className="max-h-60 overflow-y-auto divide-y divide-neutral-800/70 p-2 space-y-1 custom-scrollbar">
        {inventoryData.map((item, index) => {
          const sisa = Number(item.sisa) || 0;
          const isLowOrZero = sisa <= 0;

          return (
            <div
              key={item.product_id || index}
              className="flex items-center justify-between p-3 rounded-xl bg-black/30 hover:bg-black/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-8 rounded-full ${
                    isLowOrZero ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500"
                  }`}
                />
                <div>
                  <p className="text-sm font-extrabold text-white leading-tight">
                    {item.nama || `Produk #${item.product_id}`}
                  </p>
                  <p className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
                    <span>Stok Awal: {item.stok_awal}</span>
                    <span>•</span>
                    <span className="text-orange-400">Terjual: {item.terjual} pcs</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div
                  className={`px-3.5 py-1.5 rounded-xl border font-mono font-black text-sm flex items-center gap-1.5 ${
                    isLowOrZero
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  }`}
                >
                  {isLowOrZero ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span>{sisa}</span>
                  <span className="text-[11px] font-normal opacity-80">{item.unit || "pcs"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-black/80 px-4 py-2 border-t border-neutral-800/80 text-[11px] text-neutral-500 text-center italic">
        *Data stok fisik akhir ini akan dikunci dan dijadikan stok awal pada shift berikutnya.
      </div>
    </div>
  );
}
