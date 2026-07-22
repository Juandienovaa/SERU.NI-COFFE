import React, { useEffect } from "react";
import { Receipt, CheckCircle2 } from "lucide-react";
import { LedgerItem } from "./LedgerTable";
import { AppModal } from "@/components/ui/AppModal";

interface LedgerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: LedgerItem | null;
}

export const LedgerDetailModal: React.FC<LedgerDetailModalProps> = ({ isOpen, onClose, item }) => {
  if (!item) return null;

  const modalTitle = (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
        <Receipt className="w-5 h-5 text-orange-500" />
      </div>
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Detail Shift</h2>
        <p className="text-sm font-mono text-neutral-500">{item.id}</p>
      </div>
    </div>
  );

  return (
    <AppModal
      open={isOpen}
      onClose={onClose}
      size="md"
      title={modalTitle}
      footer={
        <button
          onClick={onClose}
          className="w-full py-4 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
        >
          Tutup Detail
        </button>
      }
    >
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Meta Data */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">Informasi Outlet</h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Lokasi</p>
                <p className="text-sm font-bold text-white">{item.outlet}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Tanggal & Shift</p>
                <p className="text-sm font-mono text-white">{item.date} • <span className="text-neutral-400">{item.shift}</span></p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Total Produk Terjual</p>
                <p className="text-sm font-mono text-white">{item.cupSold} Cup</p>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">Rincian Keuangan</h4>
            <div className="space-y-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Total Cash</span>
                <span className="text-sm font-mono font-bold text-emerald-400">Rp {item.cash.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Total QRIS</span>
                <span className="text-sm font-mono font-bold text-cyan-400">Rp {item.qris.toLocaleString("id-ID")}</span>
              </div>
              <div className="w-full h-px bg-white/[0.05] my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">Grand Total</span>
                <span className="text-lg font-black font-mono text-white">Rp {item.total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="bg-[#18181B] border border-white/[0.05] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Status Validasi Kasir</h4>
            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
              Setoran fisik kasir dan bukti transfer QRIS telah dicocokkan dengan pencatatan sistem POS.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Valid & Selesai</span>
          </div>
        </div>
      </div>
    </AppModal>
  );
};
