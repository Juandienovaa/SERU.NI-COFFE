import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PackagePlus, Loader2, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { warehouseService } from "@/services/warehouseService";

export const RawMaterialCard = () => {
  const [quantity, setQuantity] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Confirmation Dialog State
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmClick = () => {
    if (typeof quantity !== "number" || quantity <= 0) return;
    setErrorMsg(null);
    setShowConfirm(true);
  };

  const handleSave = async () => {
    if (typeof quantity !== "number" || quantity <= 0) return;
    
    setShowConfirm(false);
    setIsSaving(true);
    setErrorMsg(null);
    
    // Add raw material cup stock (Product ID 9999)
    const success = await warehouseService.addRawMaterialStock(9999, "Cup Mentah (Raw)", quantity);

    setIsSaving(false);

    if (success) {
      setIsSuccess(true);
      setQuantity("");
      setTimeout(() => setIsSuccess(false), 3000);
    } else {
      setErrorMsg("Gagal menambah stok bahan baku ke database.");
    }
  };

  return (
    <div className="bg-[#18181B] border border-white/[0.05] rounded-[24px] p-8 md:p-10 relative overflow-hidden group">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-700" />
      
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-lg shadow-orange-500/10">
              <PackagePlus className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Input Bahan Baku</h3>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed mb-6">
            Tambahkan stok bahan baku (Cup/Gelas) ke dalam gudang utama. Data ini akan dipotong secara otomatis ketika Barista melakukan penyetoran produk matang.
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <div className="bg-[#09090B] border border-white/[0.05] rounded-2xl p-2 flex items-center mb-4">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
              disabled={isSaving}
              className="w-full bg-transparent text-white text-3xl font-black px-6 py-4 focus:outline-none placeholder:text-white/20 disabled:opacity-50"
            />
            <div className="pr-6 font-bold text-neutral-500 uppercase tracking-widest text-sm">
              Cup
            </div>
          </div>

          {/* Error Message Toast */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-red-500">Penambahan Stok Gagal</span>
                </div>
                <p className="text-xs text-red-400 leading-relaxed ml-6">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleConfirmClick}
            disabled={isSaving || typeof quantity !== "number" || quantity <= 0}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-4
              ${
                isSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              }
            `}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Data...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Stok Berhasil Ditambah</span>
              </>
            ) : (
              <span>Tambah Stok ke Gudang</span>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#18181B] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Konfirmasi Penambahan Stok</h3>
                  <p className="text-sm text-neutral-400">Tindakan ini akan menambah stok master inventory.</p>
                </div>
              </div>
              
              <div className="bg-black/50 border border-white/5 rounded-xl p-4 mb-6 text-sm text-neutral-300">
                Apakah Anda yakin ingin menambahkan <strong className="text-white">{quantity} Cup</strong> ke Gudang Bahan Baku?
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all"
                >
                  Ya, Tambah Stok
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
