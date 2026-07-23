"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calculator, X, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { tutupShiftKasirPusatAction } from "@/app/actions/shiftActions";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface TutupShiftKasirModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: any;
  expenses: any[];
  totalCashSales: number;
  onShiftClosed: () => void;
}

export function TutupShiftKasirModal({
  isOpen,
  onClose,
  shift,
  expenses,
  totalCashSales,
  onShiftClosed
}: TutupShiftKasirModalProps) {
  const [kasFisikStr, setKasFisikStr] = useState("");
  const [loading, setLoading] = useState(false);

  // Calculations
  const modalAwal = Number(shift?.modal_awal || 0);
  const pengeluaranOperasional = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const kasSeharusnya = modalAwal + totalCashSales - pengeluaranOperasional;

  const kasFisik = Number(kasFisikStr.replace(/\D/g, "")) || 0;
  const selisih = kasFisik - kasSeharusnya;
  const auditStatus = kasFisik === kasSeharusnya ? "SESUAI" : "SELISIH";
  
  useEffect(() => {
    if (isOpen) {
      setKasFisikStr("");
    }
  }, [isOpen]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Math.abs(val));
  };

  const handleInputKasFisik = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "");
    if (!numeric) setKasFisikStr("");
    else setKasFisikStr(new Intl.NumberFormat("id-ID").format(Number(numeric)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kasFisikStr === "") {
      MySwal.fire({
        icon: "warning",
        title: "Input Kosong",
        text: "Silakan masukkan jumlah kas fisik di laci.",
        background: "#18181b",
        color: "#ffffff"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await tutupShiftKasirPusatAction(shift.id, shift.user_id, kasSeharusnya, kasFisik, selisih, auditStatus);
      if (!res.success) {
        throw new Error(res.message);
      }
      MySwal.fire({
        icon: "success",
        title: "Shift Ditutup",
        text: "Data audit berhasil disimpan.",
        background: "#18181b",
        color: "#ffffff",
        timer: 1500,
        showConfirmButton: false
      });
      onShiftClosed();
    } catch (err: any) {
      MySwal.fire({
        icon: "error",
        title: "Gagal Tutup Shift",
        text: err.message,
        background: "#18181b",
        color: "#ffffff"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/5 relative z-10">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Calculator className="w-6 h-6 text-orange-500" /> Audit & Tutup Shift
              </h2>
              <button onClick={onClose} disabled={loading} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 overflow-y-auto max-h-[80vh]">
              {/* Left Col: Calculations */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Kalkulasi Sistem</h3>
                
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-sm font-bold text-neutral-400">Modal Awal</span>
                  <span className="font-bold text-white">{formatCurrency(modalAwal)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-sm font-bold text-neutral-400">Penjualan Tunai</span>
                  <span className="font-bold text-emerald-500">+{formatCurrency(totalCashSales)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-sm font-bold text-neutral-400">Pengeluaran</span>
                  <span className="font-bold text-red-500">-{formatCurrency(pengeluaranOperasional)}</span>
                </div>
                <div className="flex justify-between items-center py-4 bg-white/5 rounded-xl px-4 mt-4 border border-white/10">
                  <span className="text-sm font-black text-white uppercase tracking-widest">Kas Seharusnya</span>
                  <span className="text-2xl font-black text-orange-500">{formatCurrency(kasSeharusnya)}</span>
                </div>
              </div>

              {/* Right Col: Input & Result */}
              <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Validasi Kasir</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Uang Fisik di Laci</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">Rp</span>
                      <input
                        type="text"
                        value={kasFisikStr}
                        onChange={handleInputKasFisik}
                        placeholder="0"
                        disabled={loading}
                        className="w-full bg-[#111111] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-2xl font-black text-white focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {kasFisikStr !== "" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-neutral-400">Selisih</span>
                        <span className={`font-black text-lg ${selisih > 0 ? "text-emerald-500" : selisih < 0 ? "text-red-500" : "text-white"}`}>
                          {selisih > 0 ? '+' : selisih < 0 ? '-' : ''}{formatCurrency(selisih)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-neutral-400">Status Audit</span>
                        {auditStatus === "SESUAI" ? (
                          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">
                            <ShieldCheck className="w-4 h-4" /> <span className="font-black text-xs uppercase tracking-widest">Sesuai</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1 rounded-lg">
                            <ShieldAlert className="w-4 h-4" /> <span className="font-black text-xs uppercase tracking-widest">Selisih</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || kasFisikStr === ""}
                    className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-sm transition-all shadow-lg shadow-orange-500/20 flex justify-center"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Konfirmasi & Tutup Shift"}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
