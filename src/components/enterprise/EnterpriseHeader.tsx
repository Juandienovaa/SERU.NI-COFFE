"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, User, Sparkles } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCenter } from "./NotificationCenter";

interface EnterpriseHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBackClick?: () => void;
  backLabel?: string;
  crewName?: string;
  roleLabel?: string;
  rightActions?: React.ReactNode;
}

export const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({
  title,
  subtitle = "Enterprise Production Console",
  backHref,
  onBackClick,
  backLabel = "Kembali",
  crewName = "Crew Barista",
  roleLabel = "Active Shift",
  rightActions
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const {
    notifications,
    filteredNotifications,
    unreadCount,
    activeCategory,
    setActiveCategory,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotifications();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#09090B]/90 backdrop-blur-2xl border-b border-white/[0.06] px-6 sm:px-10 py-4 transition-all">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          {/* Left Navigation Breadcrumb & Brand */}
          <div className="flex items-center gap-4">
            {(backHref || onBackClick) && (
              backHref ? (
                <Link
                  href={backHref}
                  className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#18181B] hover:bg-neutral-800 border border-white/[0.06] text-neutral-300 hover:text-white flex items-center gap-2 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">{backLabel}</span>
                </Link>
              ) : (
                <button
                  onClick={onBackClick}
                  className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#18181B] hover:bg-neutral-800 border border-white/[0.06] text-neutral-300 hover:text-white flex items-center gap-2 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">{backLabel}</span>
                </button>
              )
            )}

            {(backHref || onBackClick) && <div className="h-6 w-px bg-white/[0.06] hidden sm:block" />}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-[#F97316] uppercase tracking-wider">
                  Seruni ERP
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-neutral-300 font-mono hidden md:inline-block">
                  {subtitle}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                {title}
              </h1>
            </div>
          </div>

          {/* Right Action Bar & Notifications */}
          <div className="flex items-center gap-3">
            {rightActions && <div className="flex items-center gap-2">{rightActions}</div>}

            {/* Shift Role Pill */}
            <div className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#18181B] border border-white/[0.06] text-xs font-bold text-neutral-300 shadow-md">
              <div className="w-6 h-6 rounded-xl bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center text-[#F97316]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-mono tracking-wider leading-none mb-0.5">
                  {roleLabel}
                </span>
                <span className="text-white font-bold block leading-tight">{crewName}</span>
              </div>
            </div>

            {/* Notification Bell Trigger */}
            <button
              onClick={() => setIsNotifOpen(true)}
              aria-label="Buka Notification Center"
              className="relative p-3 rounded-2xl bg-[#18181B] hover:bg-neutral-800 border border-white/[0.06] text-neutral-300 hover:text-white transition-all active:scale-95 shadow-lg"
            >
              <Bell className="w-5 h-5 text-neutral-300 group-hover:text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-[#F97316] text-black font-black font-mono text-[10px] flex items-center justify-center border-2 border-[#09090B] animate-bounce">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Integrated Slide-over Notification Center */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        filteredNotifications={filteredNotifications}
        unreadCount={unreadCount}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAll}
      />
    </>
  );
};
