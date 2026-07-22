"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, LogIn, MapPin, CheckCircle2 } from "lucide-react";
import { UserProfile } from "./types";
import { LocationDropdown } from "./LocationDropdown";

interface ShiftLocationSelectorProps {
  user: UserProfile;
  onSelectLocation: (location: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const ShiftLocationSelector: React.FC<ShiftLocationSelectorProps> = ({
  user,
  onSelectLocation,
  onBack,
  isLoading,
}) => {
  const [selectedLokasi, setSelectedLokasi] = useState("");
  const displayName = user.nama || user.full_name || "Crew Member";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLokasi || isLoading) return;
    onSelectLocation(selectedLokasi);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-6 px-4 relative z-10 select-none"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={isLoading}
        type="button"
        className="self-start mb-6 flex items-center gap-2.5 text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 rounded-2xl px-4 py-2.5 transition-all duration-200 text-xs font-bold uppercase tracking-widest active:scale-95 disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" /> Ganti Crew
      </button>

      {/* Success Authorization Badge */}
      <div className="w-full bg-[#EA580C]/10 border border-[#EA580C]/25 rounded-3xl p-5 flex items-center gap-4 mb-8 backdrop-blur-xl shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-[#EA580C] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#EA580C]/30">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#EA580C]">
            Otorisasi PIN Valid
          </span>
          <h3 className="font-heading font-black text-white text-lg leading-tight">
            Halo, {displayName}!
          </h3>
        </div>
      </div>

      <div className="text-center md:text-left w-full mb-6">
        <h2 className="font-heading text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#EA580C]" /> Pilih Titik Outlet
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Tentukan gerobak atau lokasi outlet shift Anda saat ini.
        </p>
      </div>

      {/* Form Pilih Lokasi dengan Custom Floating Dropdown */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        <LocationDropdown
          selectedValue={selectedLokasi}
          onSelect={(val) => setSelectedLokasi(val)}
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!selectedLokasi || isLoading}
          className="group relative w-full bg-[#EA580C] hover:bg-[#d04e0a] disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-heading font-bold tracking-widest uppercase text-sm py-4 rounded-2xl shadow-xl shadow-[#EA580C]/20 transition-all duration-300 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] overflow-hidden flex items-center justify-center gap-3 mt-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>MEMBANGUN SESI...</span>
            </div>
          ) : (
            <>
              MULAI SHIFT SEKARANG
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};
