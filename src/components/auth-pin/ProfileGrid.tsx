"use client";

import React from "react";
import { motion } from "motion/react";
import { UserProfile } from "./types";
import { ProfileCard } from "./ProfileCard";
import { AlertCircle, Users, RefreshCw } from "lucide-react";

interface ProfileGridProps {
  users: UserProfile[];
  loading: boolean;
  error?: string | null;
  onSelectUser: (user: UserProfile) => void;
  onRefresh?: () => void;
  emptyMessage?: string;
}

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  users,
  loading,
  error,
  onSelectUser,
  onRefresh,
  emptyMessage,
}) => {
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-6 bg-neutral-900/40 border border-white/5 rounded-2xl animate-pulse"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-neutral-800 mb-4" />
              <div className="w-24 h-4 bg-neutral-800 rounded-md mb-2" />
              <div className="w-16 h-3 bg-neutral-800/60 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center flex flex-col items-center gap-4 my-8"
      >
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-white text-base mb-1">Gagal Memuat Profil Crew</h3>
          <p className="text-sm text-red-300/80 font-light leading-relaxed">{error}</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs tracking-wider uppercase transition-colors active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        )}
      </motion.div>
    );
  }

  if (users.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto p-10 bg-neutral-900/50 border border-white/5 rounded-3xl text-center flex flex-col items-center gap-4 my-8 backdrop-blur-xl"
      >
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 mb-2">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-white text-lg mb-1.5">Tidak Ada Profil Crew</h3>
          <p className="text-sm text-neutral-400 font-light leading-relaxed">
            {emptyMessage || "Belum ada akun crew yang aktif di dalam sistem. Pastikan data crew sudah didaftarkan pada tabel users di Supabase."}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-2 flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#EA580C] hover:bg-[#d04e0a] text-white font-bold text-xs tracking-wider uppercase transition-all active:scale-95 shadow-lg shadow-[#EA580C]/20"
          >
            <RefreshCw className="w-4 h-4" /> Muat Ulang Data
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8"
      >
        {users.map((user) => (
          <ProfileCard key={user.id} user={user} onSelect={onSelectUser} />
        ))}
      </motion.div>
    </div>
  );
};
