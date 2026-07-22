"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ProductCounterItem } from "@/types/production";
import { normalizeInteger } from "@/utils/allocation";
import { Coffee, Sparkles, Minus, Plus, Zap, X, CheckCheck, AlertCircle } from "lucide-react";

interface ProductCounterCardProps {
  item: ProductCounterItem;
  canIncrement: boolean;
  onChangeQuantity: (productId: string, quantity: number) => void;
  onIncrement: (productId: string, delta: number) => void;
  onPartialSubmit?: (productId: string) => Promise<{ success: boolean; error?: string | null }>;
}

/**
 * Enterprise Production Counter Card.
 *
 * FITUR UX ANTI FAT-FINGER:
 * - Verifikasi 2 Langkah (Double-Step Confirmation) pada tombol "Setor ke Kasir"
 *   untuk mencegah kesalahan akibat tangan basah/kotor di dapur produksi.
 * - Toast notifikasi sukses inline setelah penyetoran berhasil.
 * - Auto-cancel konfirmasi setelah 5 detik jika Barista tidak mengklik "Konfirmasi".
 */
export const ProductCounterCard: React.FC<ProductCounterCardProps> = ({
  item,
  canIncrement,
  onChangeQuantity,
  onIncrement,
  onPartialSubmit
}) => {
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [isSubmittingPartial, setIsSubmittingPartial] = useState<boolean>(false);

  /**
   * VERIFIKASI 2 LANGKAH:
   * `isConfirming` = true berarti Barista sudah klik pertama kali,
   * tombol berubah menjadi "Konfirmasi Setor +X Cup?", menunggu klik kedua.
   */
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  /**
   * TOAST NOTIFIKASI SUKSES & ERROR:
   * Menampilkan pesan sukses atau error inline selama 3-4 detik setelah setor.
   */
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * MENGAPA `normalizeInteger()` DI SETIAP DERIVASI:
   * Props `item.draftQuantity` dan `item.submittedQuantity` bisa berisi
   * tipe campuran (`string | number | undefined`) jika ada bug di upstream.
   * Normalisasi eksplisit di titik konsumsi menjamin UI selalu menampilkan
   * integer yang valid dan mencegah rendering "NaN" atau "undefined".
   */
  const draftQty: number = normalizeInteger(
    item.draftQuantity !== undefined ? item.draftQuantity : item.quantity
  );
  const submittedQty: number = normalizeInteger(item.submittedQuantity);

  const [tempTextValue, setTempTextValue] = useState<string>(String(draftQty));

  // Auto-cancel konfirmasi setelah 5 detik (mencegah tombol "stuck" di mode konfirmasi)
  useEffect(() => {
    if (isConfirming) {
      confirmTimeoutRef.current = setTimeout(() => {
        setIsConfirming(false);
      }, 5000);
    }
    return () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, [isConfirming]);

  // Reset konfirmasi jika draftQty berubah (Barista mengubah angka setelah klik pertama)
  useEffect(() => {
    if (isConfirming) {
      setIsConfirming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQty]);

  const handleMinus = () => {
    const nextVal = Math.max(0, draftQty - 1);
    onChangeQuantity(item.id, nextVal);
  };

  const handlePlus = () => {
    if (!canIncrement) return;
    onIncrement(item.id, 1);
  };

  const handleFocus = () => {
    setIsEditingText(true);
    setTempTextValue(draftQty === 0 ? "" : String(draftQty));
  };

  const handleBlur = () => {
    setIsEditingText(false);
    const parsed = parseInt(tempTextValue, 10);
    const safeVal = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
    onChangeQuantity(item.id, safeVal);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setTempTextValue(raw);
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onChangeQuantity(item.id, Math.floor(parsed));
    } else if (raw === "") {
      onChangeQuantity(item.id, 0);
    }
  };

  /**
   * HANDLER SETOR DENGAN MODAL:
   * Klik 1 → Buka modal konfirmasi.
   * Klik 2 (pada Modal) → Eksekusi penyetoran ke database.
   */
  const handleSetorClick = () => {
    if (draftQty <= 0 || isSubmittingPartial) return;
    setIsConfirming(true);
  };

  const executeSetor = async () => {
    setIsConfirming(false);
    setIsSubmittingPartial(true);

    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }

    try {
      if (onPartialSubmit) {
        const res = await onPartialSubmit(item.id);
        if (res && res.success) {
          // Tampilkan toast sukses selama 3 detik
          const displayName = item.product_name || "Produk";
          setSuccessToast(`✅ +${draftQty} ${displayName} berhasil disetor ke Kasir`);
          setTimeout(() => setSuccessToast(null), 3000);
        } else {
          // Tampilkan toast error warna merah
          setErrorToast(`❌ Gagal menyetor: ${res?.error || "Kesalahan database Supabase"}`);
          setTimeout(() => setErrorToast(null), 4500);
        }
      }
    } catch (err: any) {
      setErrorToast(`❌ Error menyetor: ${err?.message || "Terjadi kesalahan sistem"}`);
      setTimeout(() => setErrorToast(null), 4500);
    } finally {
      setIsSubmittingPartial(false);
    }
  };

  const handleCancelConfirm = () => {
    setIsConfirming(false);
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }
  };

  const renderVisual = () => {
    if (item.image) {
      return (
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#111113] border border-white/[0.06] shrink-0 flex items-center justify-center p-1.5 shadow-md">
          <img
            src={item.image}
            alt={item.product_name}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
    if (item.iconName === "Sparkles" || item.category === "Non-Coffee") {
      return (
        <div className="w-14 h-14 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center shrink-0 shadow-md">
          <Sparkles className="w-6 h-6 text-[#F97316]" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center shrink-0 shadow-md">
        <Coffee className="w-6 h-6 text-[#F97316]" />
      </div>
    );
  };

  const displayName = item.product_name;
  const unitName = item.unit || "Cup";

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.004 }}
      className={`group relative rounded-3xl bg-[#18181B] border p-6 sm:p-7 transition-all flex flex-col justify-between gap-6 ${
        draftQty > 0 || submittedQty > 0
          ? "border-[#F97316]/40 shadow-2xl bg-gradient-to-br from-[#18181B] via-[#18181B] to-[#F97316]/[0.03]"
          : "border-white/[0.06] hover:border-white/[0.15]"
      }`}
    >
      {/* Toast Notifikasi Sukses & Error (inline, muncul di atas card) */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            key="success-toast"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-3 left-3 right-3 z-20 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/90 backdrop-blur-xl text-white text-xs font-bold shadow-2xl shadow-emerald-500/30 border border-emerald-400/40"
          >
            <CheckCheck className="w-4 h-4 shrink-0" />
            <span className="flex-1 leading-snug">{successToast}</span>
          </motion.div>
        )}

        {errorToast && (
          <motion.div
            key="error-toast"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-3 left-3 right-3 z-20 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-600/95 backdrop-blur-xl text-white text-xs font-bold shadow-2xl shadow-rose-600/40 border border-rose-400/50"
          >
            <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
            <span className="flex-1 leading-snug break-words">{errorToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header: Image/Icon & Product Details */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {renderVisual()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {item.category}
              </span>
              {item.sku && (
                <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
                  • {item.sku}
                </span>
              )}
            </div>
            <h4 className="text-lg font-bold text-white leading-tight mt-0.5 break-words">
              {displayName}
            </h4>
            {submittedQty > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold w-fit mt-2">
                <span>✓ Telah disetor: {submittedQty} Cup</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Counter Controller: Large Touch Targets */}
      <div className="flex items-center justify-between gap-3 bg-[#111113] rounded-2xl p-2.5 border border-white/[0.06]">
        {/* Minus Button */}
        <button
          onClick={handleMinus}
          disabled={draftQty <= 0}
          aria-label="Kurangi kuantitas"
          className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-[#18181B] hover:bg-neutral-800 active:scale-90 text-white flex items-center justify-center transition-all disabled:opacity-25 disabled:hover:bg-[#18181B] disabled:active:scale-100 border border-white/[0.06] shrink-0"
        >
          <Minus className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Large Numeric Input */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <input
            type="text"
            inputMode="numeric"
            value={isEditingText ? tempTextValue : draftQty}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleTextChange}
            className="w-full bg-transparent text-center text-3xl sm:text-4xl font-black font-mono text-white focus:outline-none focus:text-[#F97316] transition-colors"
          />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-[-2px]">
            {unitName.toUpperCase()} JADI
          </span>
        </div>

        {/* Plus Button */}
        <button
          onClick={handlePlus}
          disabled={!canIncrement}
          aria-label="Tambah kuantitas"
          className="w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-90 flex items-center justify-center font-black transition-all disabled:opacity-25 disabled:hover:bg-white disabled:active:scale-100 shadow-lg shrink-0"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* Quick Jump Buttons for High Speed (+1, +5, +10) */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 5, 10].map((step) => (
          <button
            key={step}
            onClick={() => onIncrement(item.id, step)}
            disabled={!canIncrement}
            className="py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 border border-white/[0.06] text-xs font-bold font-mono text-neutral-300 hover:text-white transition-all disabled:opacity-25 flex items-center justify-center gap-1"
          >
            <Zap className="w-3 h-3 text-neutral-400" />
            <span>+{step}</span>
          </button>
        ))}
      </div>

      {/* Action Button: Setor ke Kasir */}
      {onPartialSubmit && (
        <button
          onClick={handleSetorClick}
          disabled={draftQty <= 0 || isSubmittingPartial}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-md mt-4 ${
            draftQty > 0
              ? "bg-[#F97316] text-white border-[#F97316] hover:bg-[#EA580C] active:scale-[0.98] shadow-orange-500/20"
              : "bg-[#111113] text-neutral-500 border-white/[0.06] opacity-40 cursor-not-allowed"
          }`}
        >
          <span>⚡ Setor ke Kasir</span>
          {draftQty > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-black/25 text-[10px] text-white ml-1">
              +{draftQty}
            </span>
          )}
        </button>
      )}

      {/* MODAL KONFIRMASI POP-UP (PORTAL UNTUK MENCEGAH JITTER DARI MOTION.LAYOUT) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isConfirming && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm rounded-3xl bg-[#111113] border border-white/[0.08] p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
              >
                {/* Background Glow */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
                
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5 relative z-10 shadow-lg shadow-orange-500/10">
                  <CheckCheck className="w-8 h-8 text-orange-500" />
                </div>
                
                <h3 className="text-xl font-black text-white mb-2 relative z-10">Konfirmasi Penyetoran</h3>
                <p className="text-sm text-neutral-400 mb-8 relative z-10 leading-relaxed">
                  Apakah Anda yakin ingin menyetor <strong className="text-white font-mono bg-white/[0.06] px-1.5 py-0.5 rounded-md mx-0.5">{draftQty} Cup</strong> produk <strong className="text-white">{displayName}</strong> ke etalase Kasir?
                </p>
                
                <div className="flex w-full gap-3 relative z-10">
                  <button
                    onClick={handleCancelConfirm}
                    disabled={isSubmittingPartial}
                    className="flex-1 py-3.5 rounded-xl border border-white/[0.1] text-neutral-300 font-bold text-sm hover:bg-white/[0.05] active:scale-95 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeSetor}
                    disabled={isSubmittingPartial}
                    className="flex-1 py-3.5 rounded-xl bg-[#F97316] text-white font-bold text-sm hover:bg-[#EA580C] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-500/25"
                  >
                    {isSubmittingPartial ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menyetor...</span>
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-4 h-4" />
                        <span>Ya, Setor</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};
