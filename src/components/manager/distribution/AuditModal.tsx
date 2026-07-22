"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { AppModal } from "@/components/ui/AppModal";
import { ProductionBatch } from "@/types/productionBatch";
import { ProductionIntelligenceData } from "@/types/productionIntelligence";
import { fetchBatchIntelligence } from "@/services/productionIntelligenceService";
import { X, FileSpreadsheet, Activity, Package, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AuditModalProps {
  batch: ProductionBatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal = ({ batch, isOpen, onClose }: AuditModalProps) => {
  const [data, setData] = useState<ProductionIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !batch) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchBatchIntelligence(batch).then((result) => {
      if (isMounted) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, batch]);

  if (!isOpen) return null;

  const rawCups = data?.validation.rawCups || 0;
  const finishedCups = data?.validation.finishedCups || 0;
  const defectCups = data?.validation.defectCups || 0;
  
  // Progress = (total produk + defect) / raw_cups_given
  const progressPercent = rawCups > 0 ? Math.min(100, Math.round(((finishedCups + defectCups) / rawCups) * 100)) : 0;
  
  const totalAccounted = finishedCups + defectCups;
  const balance = rawCups - totalAccounted;
  const isBalanced = balance === 0;

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
        <FileSpreadsheet className="w-5 h-5 text-orange-500" />
      </div>
      <div>
        <h3 className="text-lg font-black text-white leading-tight">Laporan Audit Produksi</h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">Batch Number:</span>
          <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{batch?.batch_number}</span>
        </div>
      </div>
    </div>
  );

  return (
    <AppModal
      open={isOpen}
      onClose={onClose}
      size="md"
      title={modalTitle}
      showCloseButton={true}
      loading={loading}
      footer={
        !loading && data ? (
          <div className={`w-full p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${isBalanced ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isBalanced ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                {isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <h4 className={`text-sm font-black ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isBalanced ? "Audit Passed: Balanced" : "Audit Warning: Variance Detected"}
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {isBalanced ? "Akuntansi bahan baku dan produk jadi seimbang 100%." : "Terdapat selisih tidak wajar antara modal awal dengan output."}
                </p>
              </div>
            </div>
            <div className="flex gap-4 shrink-0">
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-neutral-500 tracking-widest">Total Cup (Out)</span>
                <span className="text-lg font-black font-mono text-white">{totalAccounted}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-neutral-500 tracking-widest">Balance</span>
                <span className={`text-lg font-black font-mono ${isBalanced ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {balance > 0 ? `-${balance}` : balance < 0 ? `+${Math.abs(balance)}` : '0'}
                </span>
              </div>
            </div>
          </div>
        ) : null
      }
    >
      {/* BODY */}
      <div className="w-full">
        {!data && !loading ? (
          <div className="text-center py-12 text-neutral-500">Gagal memuat data laporan.</div>
        ) : data ? (
          <div className="space-y-4">
                
                {/* Progress Produksi */}
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Activity className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-bold">Progress Produksi</span>
                    </div>
                    <span className="text-lg font-black font-mono text-white">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-amber-400"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-mono text-neutral-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Grid Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Raw Cups (Modal)</span>
                    <span className="text-2xl font-black font-mono text-white">{rawCups}</span>
                  </div>
                  <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Defect Cup</span>
                    <span className="text-2xl font-black font-mono text-rose-500">{defectCups}</span>
                  </div>
                </div>

                {/* Produk Yang Diproduksi */}
                <div>
                  <h4 className="text-sm font-bold text-neutral-300 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-500" />
                    Produk Yang Dihasilkan
                  </h4>
                  {data.items.length === 0 ? (
                    <div className="p-4 border border-dashed border-white/10 rounded-xl text-center text-sm text-neutral-500">
                      Belum ada produk yang disetor.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {data.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#111111] border border-white/5">
                          <span className="text-xs font-bold text-white">{item.product_name}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black font-mono text-emerald-400">{item.quantity_produced}</span>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">Cup</span>
                          </div>
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
};
