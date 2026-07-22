"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LayoutDashboard, Wallet, Settings, LogOut, Command } from "lucide-react";

const MENU_ITEMS = [
  { name: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
  { name: "Keuangan", path: "/manager/audit", icon: Wallet },
  { name: "Pengaturan", path: "/manager/settings", icon: Settings },
];

export const ManagerSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-20 md:w-64 bg-[#09090B] border-r border-white/[0.05] flex flex-col items-center md:items-stretch py-8 z-40 transition-all duration-300">
      {/* Brand Header */}
      <div className="flex items-center justify-center md:justify-start gap-3 px-4 md:px-8 mb-12">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
          <Command className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block">
          <h1 className="text-lg font-black text-white tracking-tight leading-none">Manajer</h1>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Workspace</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 w-full px-3 md:px-4 space-y-2">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
          return (
            <Link key={item.name} href={item.path} className="relative block group">
              {/* Active Indicator (Awwwards Style) */}
              {isActive && (
                <motion.div
                  layoutId="active-indicator-manager"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316] rounded-r-full shadow-[0_0_15px_rgba(249,115,22,0.6)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div
                className={`flex items-center justify-center md:justify-start gap-4 p-3.5 md:px-5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-white/[0.04] text-white"
                    : "text-neutral-500 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${isActive ? "text-[#F97316]" : ""}`} />
                <span className={`hidden md:block text-sm font-bold transition-all duration-300 ${isActive ? "tracking-wide" : ""}`}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Action (Logout Placeholder) */}
      <div className="w-full px-3 md:px-4 mt-auto">
        <button className="w-full flex items-center justify-center md:justify-start gap-4 p-3.5 md:px-5 rounded-2xl text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 group">
          <LogOut className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="hidden md:block text-sm font-bold">Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
};
