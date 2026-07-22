"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { UserProfile } from "./types";

interface ProfileCardProps {
  user: UserProfile;
  onSelect: (user: UserProfile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onSelect }) => {
  const displayName = user.nama || user.full_name || "Crew Member";

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
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

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(user)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(user);
        }
      }}
      aria-label={`Pilih profil ${displayName}`}
      className="group relative flex flex-col items-center justify-center p-6 bg-neutral-900/60 hover:bg-neutral-900/90 backdrop-blur-xl border border-white/5 hover:border-[#EA580C]/50 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_35px_rgba(234,88,12,0.18)] focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:ring-offset-2 focus:ring-offset-[#09090B]"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#EA580C]/0 via-transparent to-[#EA580C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Circular Avatar Container */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-4 border-2 border-white/10 group-hover:border-[#EA580C] transition-all duration-300 shadow-xl group-hover:shadow-[0_0_20px_rgba(234,88,12,0.3)] bg-neutral-800 shrink-0">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 96px, 112px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${avatarColors} flex items-center justify-center text-white font-heading font-black text-2xl sm:text-3xl tracking-wider select-none`}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Crew Name */}
      <h3 className="text-sm sm:text-base font-heading font-bold text-neutral-200 group-hover:text-white transition-colors duration-200 tracking-tight text-center truncate max-w-full px-1">
        {displayName}
      </h3>

      {/* Role / Subtitle */}
      <span className="text-[10px] font-medium tracking-widest uppercase text-neutral-500 group-hover:text-[#EA580C] transition-colors duration-200 mt-1">
        {user.role || "Barista / Crew"}
      </span>
    </motion.div>
  );
};
