"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, Loader2 } from "lucide-react";
import { bukaShiftKasirPusatAction } from "@/app/actions/shiftActions";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface ModalAwalKasirDialogProps {
  isOpen: boolean;
  userId: string;
  userName: string;
  onShiftOpened: (shift: any) => void;
}

export function ModalAwalKasirDialog({ isOpen, userId, userName, onShiftOpened }: ModalAwalKasirDialogProps) {
  const [modalAwalStr, setModalAwalStr] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCurrency = (val: string) => {
    const numeric = val.replace(/\D/g, "");
    if (!numeric) return "";
    return new Intl.NumberFormat("id-ID").format(Number(numeric));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModalAwalStr(formatCurrency(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const modalAwal = Number(modalAwalStr.replace(/\D/g, ""));
    if (modalAwal < 0) {
      MySwal.fire({
        icon: "warning",
        title: "Nominal Kosong",
        text: "Silakan masukkan nominal modal awal kasir.",
        background: "#18181b",
        color: "#ffffff"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await bukaShiftKasirPusatAction(userId, userName, modalAwal);
      if (!res.success) {
        throw new Error(res.message);
      }
      MySwal.fire({
        icon: "success",
        title: "Shift Dimulai",
        text: "Modal awal berhasil dicatat.",
        background: "#18181b",
        color: "#ffffff",
        timer: 1500,
        showConfirmButton: false
      });
      onShiftOpened(res.data);
    } catch (err: any) {
      MySwal.fire({
        icon: "error",
        title: "Gagal Buka Shift",
        text: err.message || "Terjadi kesalahan saat memulai shift.",
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] shadow-2xl p-8 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-orange-500/20 blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                <Wallet className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Masukkan Modal Awal</h2>
              <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
                Anda belum memiliki shift aktif hari ini. Masukkan jumlah uang fisik di laci kasir saat ini untuk memulai POS.
              </p>

              <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">Rp</span>
                  <input
                    type="text"
                    value={modalAwalStr}
                    onChange={handleInputChange}
                    placeholder="0"
                    disabled={loading}
                    className="w-full bg-[#111111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-black text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-neutral-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !modalAwalStr}
                  className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white font-black text-sm transition-all flex items-center justify-center shadow-lg shadow-orange-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Mulai Shift & Buka POS"}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
