"use client";

import React from "react";
import { ProductionBatch } from "@/types/productionBatch";
import { Loader2, RefreshCcw, Eye, Archive } from "lucide-react";

interface ProductionHistoryTableProps {
  batches: ProductionBatch[];
  loading: boolean;
  onAuditClick: (batch: ProductionBatch) => void;
  onRefresh?: () => void;
}

export const ProductionHistoryTable = ({ batches, loading, onAuditClick, onRefresh }: ProductionHistoryTableProps) => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col h-full shadow-2xl overflow-hidden">
      
      {/* 1. HEADER KOMPONEN */}
      <div className="p-6 md:p-8 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-zinc-900/30">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">Riwayat Sesi Produksi</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
              {batches.length} Batch
            </span>
          </div>
          <p className="text-sm text-zinc-400 font-medium mt-2 leading-relaxed max-w-2xl">
            Daftar sesi yang telah didistribusikan dari manajer ke tim barista (Newest First). Klik baris atau tombol laporan untuk audit detail.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors self-start shrink-0"
          title="Segarkan Data"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2 & 3. TABEL AREA */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-sm font-medium">Memuat riwayat produksi...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <Archive className="w-6 h-6 text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Belum ada sesi produksi.</h3>
            <p className="text-sm text-zinc-400 max-w-xs">
              Sesi produksi yang dibuat akan muncul di sini.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Jam</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Batch Number</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Raw Cups</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="py-4 px-6 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-right whitespace-nowrap">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {batches.map((batch) => {
                const dateObj = batch.created_at ? new Date(batch.created_at) : new Date();
                const dateStr = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(dateObj);
                const timeStr = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(dateObj).replace(".", ":") + " WIB";
                const formattedCups = new Intl.NumberFormat("id-ID").format(Number(batch.raw_cups_given) || 0);

                const isCompleted = batch.status === "COMPLETED";

                return (
                  <tr 
                    key={batch.id} 
                    onClick={() => onAuditClick(batch)}
                    className="hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-sm font-bold text-zinc-300">{dateStr}</span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-xs font-medium text-zinc-400">{timeStr}</span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-mono text-xs font-medium text-zinc-400">
                        {batch.batch_number}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-white">{formattedCups}</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CUP</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                        isCompleted 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      }`}>
                        {isCompleted ? "COMPLETED" : "PENDING BARISTA"}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAuditClick(batch);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent hover:border-orange-500/20 text-xs font-bold text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                      >
                        <Eye className="w-4 h-4 text-orange-500" />
                        <span>Lihat Laporan</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. FOOTER KOMPONEN */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-zinc-500">
        <span>Single Source of Truth: production_batches</span>
        <span>Historical data is immutable & auditable</span>
      </div>
    </div>
  );
};
