"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { AppModal } from "@/components/ui/AppModal";
import { supabase } from "@/lib/supabase";

/**
 * Enterprise standard Logout flow.
 * Standalone component that handles its own dialog state, ensuring minimal re-renders.
 */
export const LogoutConfirmationDialog = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      
      // Clear all local traces
      localStorage.clear();
      sessionStorage.clear();
      
      router.replace("/auth-pin");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        aria-label="Logout"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout Session</span>
      </button>

      <AppModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="sm"
        showCloseButton={false}
        closeOnEsc={!isLoggingOut}
        closeOnBackdrop={!isLoggingOut}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          
          <h3 className="text-xl font-black text-white mb-2">Keluar dari Dashboard Manager?</h3>
          <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
            Anda akan mengakhiri sesi aktif. Anda perlu memasukkan PIN rahasia untuk kembali ke dalam Command Center.
          </p>

          <div className="flex w-full gap-3">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isLoggingOut}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-white/5 hover:bg-white/10 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Ya, Logout Sekarang</span>
              )}
            </button>
          </div>
        </div>
      </AppModal>
    </>
  );
});

LogoutConfirmationDialog.displayName = "LogoutConfirmationDialog";
