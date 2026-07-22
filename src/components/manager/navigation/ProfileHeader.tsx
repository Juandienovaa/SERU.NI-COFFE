"use client";

import React from "react";
import { m } from "motion/react";
import { User } from "lucide-react";

/**
 * Mobile-first responsive header.
 * Horizontal row layout as requested: Avatar, Name, Role, Online Status.
 */
interface ProfileHeaderProps {
  isMobile?: boolean;
}

export const ProfileHeader = React.memo(({ isMobile = false }: ProfileHeaderProps) => {
  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex items-center gap-4 w-full`}
    >
      {/* Avatar (48px mobile, 64px desktop) */}
      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <User className="w-5 h-5 md:w-6 md:h-6 text-white/70" />
      </div>

      {/* Metadata */}
      <div className="flex flex-col justify-center">
        <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none mb-1">
          Admin Manager
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-medium text-neutral-400">
            Seruni Enterprise
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">Online</span>
          </div>
        </div>
      </div>
    </m.div>
  );
});

ProfileHeader.displayName = "ProfileHeader";
