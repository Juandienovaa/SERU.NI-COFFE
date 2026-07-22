"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Minus, Plus } from "lucide-react";

interface DefectCounterCardProps {
  defectCups: number;
  canIncrement: boolean;
  onChangeDefect: (quantity: number) => void;
}

export const DefectCounterCard: React.FC<DefectCounterCardProps> = ({
  defectCups,
  canIncrement,
  onChangeDefect
}) => {
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [tempTextValue, setTempTextValue] = useState<string>(String(defectCups || 0));

  const handleMinus = () => {
    const nextVal = Math.max(0, (Number(defectCups) || 0) - 1);
    onChangeDefect(nextVal);
  };

  const handlePlus = () => {
    if (!canIncrement) return;
    onChangeDefect((Number(defectCups) || 0) + 1);
  };

  const handleFocus = () => {
    setIsEditingText(true);
    setTempTextValue(defectCups === 0 ? "" : String(defectCups));
  };

  const handleBlur = () => {
    setIsEditingText(false);
    const parsed = parseInt(tempTextValue, 10);
    const safeVal = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    onChangeDefect(safeVal);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setTempTextValue(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChangeDefect(parsed);
    } else if (raw === "") {
      onChangeDefect(0);
    }
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.004 }}
      className={`relative rounded-3xl p-6 sm:p-7 border transition-all flex flex-col sm:flex-row items-center justify-between gap-6 ${
        defectCups > 0
          ? "bg-[#18181B] border-amber-500/50 shadow-2xl shadow-amber-500/10"
          : "bg-[#18181B] border-white/[0.06] hover:border-white/[0.15]"
      }`}
    >
      {/* Left Info Column */}
      <div className="flex items-start gap-4 w-full sm:w-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
              Audit Cacat & Kerusakan
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-extrabold text-amber-400">
              NON-PRODUCIBLE
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-white leading-tight mt-1">
            Gelas Mentah Cacat / Tumpah / Pecah
          </h4>
          <p className="text-xs text-neutral-300 mt-1 max-w-md font-light leading-relaxed">
            Catat jumlah gelas mentah yang rusak sebelum atau saat produksi agar akuntansi stok mentah dan jadi seimbang 100%.
          </p>
        </div>
      </div>

      {/* Right Counter Controls */}
      <div className="flex items-center gap-3 bg-[#111113] rounded-2xl p-2.5 border border-white/[0.06] w-full sm:w-80 shrink-0">
        {/* Minus Button */}
        <button
          onClick={handleMinus}
          disabled={defectCups <= 0}
          aria-label="Kurangi cacat"
          className="w-14 h-14 rounded-xl bg-[#18181B] hover:bg-neutral-800 active:scale-90 text-amber-400 flex items-center justify-center transition-all disabled:opacity-25 border border-white/[0.06] shrink-0"
        >
          <Minus className="w-6 h-6" />
        </button>

        {/* Numeric Input */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <input
            type="text"
            inputMode="numeric"
            value={isEditingText ? tempTextValue : defectCups || 0}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleTextChange}
            className="w-full bg-transparent text-center text-3xl font-black font-mono text-amber-400 focus:outline-none transition-colors"
          />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-[-2px]">
            CUP RUSAK
          </span>
        </div>

        {/* Plus Button */}
        <button
          onClick={handlePlus}
          disabled={!canIncrement}
          aria-label="Tambah cacat"
          className="w-14 h-14 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-90 text-black font-black flex items-center justify-center transition-all disabled:opacity-25 shadow-lg shrink-0"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
};
