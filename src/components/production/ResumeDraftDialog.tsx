"use client";

import React from "react";
import { AppModal } from "@/components/ui/AppModal";
import { ProductionDraftState } from "@/types/production";
import { RotateCcw, Trash2, Clock, Factory, ShieldAlert } from "lucide-react";

interface ResumeDraftDialogProps {
  draft: ProductionDraftState | null;
  isOpen: boolean;
  onResume: (draft: ProductionDraftState) => void;
  onDiscard: (batchId: string) => void;
}

export const ResumeDraftDialog: React.FC<ResumeDraftDialogProps> = ({
  draft,
  isOpen,
  onResume,
  onDiscard
}) => {
  if (!isOpen || !draft) return null;

  const totalAllocated = draft.allocations.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const formattedTime = draft.lastUpdated
    ? new Date(draft.lastUpdated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "Beberapa saat lalu";

  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button
        onClick={() => onDiscard(draft.batchId)}
        className="px-5 py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all"
      >
        <Trash2 className="w-4 h-4 text-rose-400" />
        <span>Hapus & Mulai Baru</span>
      </button>

      <button
        onClick={() => onResume(draft)}
        className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-[#EA580C] hover:bg-[#EA580C]/90 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#EA580C]/25"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Lanjutkan Draf Terakhir</span>
      </button>
    </div>
  );

  return (
    <AppModal
      open={isOpen}
      onClose={() => onDiscard(draft.batchId)}
      size="sm"
      showCloseButton={false}
      closeOnEsc={false}
      closeOnBackdrop={false}
      footer={modalFooter}
    >
      <div className="flex flex-col gap-6">
        {/* Top Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EA580C]/20 border border-[#EA580C]/40 flex items-center justify-center text-[#EA580C] shrink-0 shadow-lg shadow-[#EA580C]/10">
            <RotateCcw className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wider text-[#EA580C] uppercase block">
              Session Recovery System
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Lanjutkan Draft Produksi?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed mt-1">
              Sistem mendeteksi adanya draf alokasi produksi yang belum dikunci sejak kunjungan atau sesi browser terakhir.
            </p>
          </div>
        </div>

        {/* Draft Summary Box */}
        <div className="rounded-2xl bg-neutral-950/80 border border-white/10 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-neutral-400 font-medium">Nomor Batch:</span>
            <span className="font-mono font-bold text-white flex items-center gap-1.5">
              <Factory className="w-4 h-4 text-[#EA580C]" /> {draft.batchNumber}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-neutral-400 font-medium">Terakhir Diedit:</span>
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#EA580C]" /> {formattedTime}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-white/10">
            <span className="text-neutral-400 font-medium">Progres Terakhir:</span>
            <span className="font-black text-cyan-400 font-mono">
              {totalAllocated} / {draft.rawCupsReceived} Cup Dialokasikan
            </span>
          </div>
        </div>
      </div>
    </AppModal>
  );
};
