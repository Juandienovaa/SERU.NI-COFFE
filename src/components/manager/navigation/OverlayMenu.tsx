"use client";

import React, { useMemo } from "react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { ProfileHeader } from "./ProfileHeader";
import { NavigationItem } from "./NavigationItem";
import { LogoutConfirmationDialog } from "./LogoutConfirmationDialog";

interface OverlayMenuProps {
  onClose: () => void;
}

export const OverlayMenu: React.FC<OverlayMenuProps> = ({ onClose }) => {
  const NAVIGATION_ITEMS = useMemo(() => [
    { title: "Dashboard", description: "Overview operasional harian", href: "/manager/dashboard" },
    { title: "Audit Keuangan", description: "Enterprise Settlement", href: "/manager/audit" },
    { title: "Live Monitoring", description: "Realtime aktivitas gerobak", href: "/manager/monitoring" },
    { title: "Manajemen Stok", description: "Smart Inventory", href: "/manager/inventory" },
    { title: "Settings", description: "Preferensi sistem", href: "/manager/settings" },
  ], []);

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 bg-[#090909] grid will-change-transform overflow-hidden"
        style={{ gridTemplateRows: 'auto minmax(0, 1fr) auto', height: '100dvh', width: '100vw' }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-orange-500/10 rounded-full blur-[120px] mix-blend-screen" />
          <div 
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{ backgroundImage: "url('/noise.png')", backgroundSize: "128px" }} 
          />
        </div>

        {/* 1. HEADER (Approx 110px) */}
        <header className="relative z-20 w-full px-[40px] py-[32px] border-b border-white/[0.05] flex items-center justify-between">
          <ProfileHeader />
        </header>

        {/* 2. MAIN NAVIGATION (Flex: 1) */}
        <main className="relative z-10 w-full h-full flex items-center px-[40px]">
          <nav className="flex flex-col gap-2 md:gap-4 w-full max-w-[1400px] mx-auto group/nav">
            {NAVIGATION_ITEMS.map((item, index) => (
              <NavigationItem
                key={item.href}
                title={item.title}
                description={item.description}
                href={item.href}
                index={index}
                onClose={onClose}
              />
            ))}
          </nav>
        </main>

        {/* 3. FOOTER (Approx 90px) */}
        <footer className="relative z-20 w-full px-[40px] py-[24px] border-t border-white/[0.05] flex items-center justify-between mt-auto bg-[#090909]/80 backdrop-blur-md">
          <div className="text-xs text-neutral-500 font-mono">
            System Core v3.0.0
          </div>
          <LogoutConfirmationDialog />
        </footer>
      </m.div>
    </LazyMotion>
  );
};
