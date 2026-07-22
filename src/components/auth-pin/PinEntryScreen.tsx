"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowLeft, Delete, Lock, AlertCircle } from "lucide-react";
import { UserProfile } from "./types";

interface PinEntryScreenProps {
  user: UserProfile;
  onBack: () => void;
  onPinSubmit: (pin: string) => Promise<boolean>;
  isLoading: boolean;
  errorMsg?: string | null;
  onClearError: () => void;
}

export const PinEntryScreen: React.FC<PinEntryScreenProps> = ({
  user,
  onBack,
  onPinSubmit,
  isLoading,
  errorMsg,
  onClearError,
}) => {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const displayName = user.nama || user.full_name || "Crew Member";

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [displayName]);

  const avatarColors = useMemo(() => {
    const colors = [
      "from-orange-600 to-amber-600",
      "from-blue-600 to-cyan-600",
      "from-emerald-600 to-teal-600",
      "from-purple-600 to-indigo-600",
      "from-rose-600 to-pink-600",
    ];
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) {
      hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, [user.id]);

  // Brute force cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleNumpad = (num: string) => {
    if (cooldown > 0 || isLoading) return;
    if (errorMsg) onClearError();
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (cooldown > 0 || isLoading) return;
    if (errorMsg) onClearError();
    setPin((prev) => prev.slice(0, -1));
  };

  // Auto-Submit on 4th digit
  useEffect(() => {
    if (pin.length === 4 && !isLoading && cooldown === 0) {
      handleVerify(pin);
    }
  }, [pin]);

  const handleVerify = async (inputPin: string) => {
    const success = await onPinSubmit(inputPin);
    if (!success) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 3) {
        setCooldown(60);
        setFailedAttempts(0);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto flex flex-col items-center justify-center py-6 px-4 select-none relative z-10"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={isLoading}
        className="self-start mb-6 flex items-center gap-2.5 text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 rounded-2xl px-4 py-2.5 transition-all duration-200 text-xs font-bold uppercase tracking-widest active:scale-95 disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      {/* Large Avatar */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-4 border-2 border-[#EA580C] shadow-[0_0_35px_rgba(234,88,12,0.35)] bg-neutral-800 shrink-0">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={displayName}
            fill
            sizes="112px"
            className="object-cover"
            priority
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${avatarColors} flex items-center justify-center text-white font-heading font-black text-3xl tracking-wider select-none`}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Crew Name */}
      <h2 className="font-heading text-xl sm:text-2xl font-black text-white tracking-tight text-center mb-1">
        {displayName}
      </h2>
      <p className="text-xs text-neutral-400 uppercase tracking-widest font-medium mb-6">
        Masukkan PIN Anda
      </p>

      {/* PIN Dots Display with Error Shake */}
      <motion.div
        animate={shake ? { x: [-12, 12, -12, 12, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex justify-center gap-5 sm:gap-6 py-3 mb-4"
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              pin.length > i
                ? "bg-[#EA580C] scale-125 shadow-[0_0_16px_rgba(234,88,12,0.6)]"
                : "bg-neutral-800 border border-neutral-700"
            } ${errorMsg ? "bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.6)] border-red-500" : ""}`}
          />
        ))}
      </motion.div>

      {/* Error & Cooldown Alerts */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2 text-center text-xs font-medium w-full justify-center mb-4 animate-pulse"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {cooldown > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-center text-xs w-full mb-4">
          Terlalu banyak percobaan salah. Silakan tunggu <span className="font-bold">{cooldown}s</span>
        </div>
      )}

      {/* On-Screen Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full mt-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumpad(num.toString())}
            disabled={cooldown > 0 || isLoading}
            className="aspect-square sm:aspect-[5/4] bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-neutral-700 rounded-2xl text-2xl font-heading font-bold text-white flex items-center justify-center transition-all duration-150 disabled:opacity-40 active:scale-95 shadow-md hover:shadow-lg"
          >
            {num}
          </button>
        ))}
        <div className="col-start-2">
          <button
            onClick={() => handleNumpad("0")}
            disabled={cooldown > 0 || isLoading}
            className="w-full aspect-square sm:aspect-[5/4] bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-neutral-700 rounded-2xl text-2xl font-heading font-bold text-white flex items-center justify-center transition-all duration-150 disabled:opacity-40 active:scale-95 shadow-md hover:shadow-lg"
          >
            0
          </button>
        </div>
        <div className="col-start-3">
          <button
            onClick={handleDelete}
            disabled={cooldown > 0 || isLoading || pin.length === 0}
            className="w-full aspect-square sm:aspect-[5/4] bg-neutral-900/40 hover:bg-neutral-800/80 border border-white/5 hover:border-neutral-700 rounded-2xl text-xl font-medium flex items-center justify-center transition-all duration-150 text-neutral-400 hover:text-white disabled:opacity-30 active:scale-95"
            aria-label="Hapus digit terakhir"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-xs text-[#EA580C] font-bold tracking-widest uppercase animate-pulse">
          <div className="w-3 h-3 rounded-full border-2 border-[#EA580C] border-t-transparent animate-spin" />
          Memverifikasi Otorisasi...
        </div>
      )}
    </motion.div>
  );
};
