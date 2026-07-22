"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/components/auth-pin/types";
import { ProfileGrid } from "@/components/auth-pin/ProfileGrid";
import { PinEntryScreen } from "@/components/auth-pin/PinEntryScreen";

export default function CashierLoginPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loadingLogin, setLoadingLogin] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const fetchCashiers = useCallback(async () => {
    setLoadingUsers(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("status_aktif", true)
        .in("role", ["kasir", "central_cashier"])
        .order("nama", { ascending: true });

      if (error) throw error;
      
      setUsers((data as UserProfile[]) || []);
    } catch (err: any) {
      console.error("Fetch kasir error:", err);
      setFetchError("Tidak dapat mengambil data kasir.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchCashiers();
  }, [fetchCashiers]);

  const handlePinSubmit = async (inputPin: string): Promise<boolean> => {
    if (!selectedUser) return false;
    setLoadingLogin(true);
    setLoginError(null);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", selectedUser.id)
        .eq("pin", inputPin)
        .maybeSingle();

      if (!data || error) {
        setLoginError("PIN salah.");
        return false;
      }

      // 5. Create Local Session
      const userToStore = {
        id: data.id,
        name: data.nama || data.full_name || "Kasir Pusat",
        role: data.role,
        avatar_url: data.avatar_url,
      };

      localStorage.setItem("current_user", JSON.stringify(userToStore));
      localStorage.setItem("user_id", data.id);
      localStorage.setItem("user_role", data.role);
      localStorage.setItem("login_time", new Date().toISOString());

      router.replace("/kasir/dashboard");
      return true;
    } catch (err: any) {
      console.error("Login error:", err);
      setLoginError("Gagal membuat sesi login.");
      return false;
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] font-sans overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Ornamen */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-orange-500/10 to-transparent" />
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-orange-600/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col min-h-screen">
        <AnimatePresence mode="wait">
          {!selectedUser ? (
            <motion.div
              key="step-select-profile"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col"
            >
              <header className="flex justify-between items-start mb-12">
                <div>
                  <Link href="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6 group">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Kembali ke Portal</span>
                  </Link>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
                    Pilih Profil <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Kasir</span>
                  </h1>
                  <p className="text-neutral-400 max-w-lg leading-relaxed">
                    Pilih profil Anda untuk masuk ke sistem Central Cashier.
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-sm font-bold text-white tracking-widest uppercase">System Online</span>
                </div>
              </header>

              <div className="flex-1">
                <ProfileGrid 
                  users={users} 
                  loading={loadingUsers} 
                  error={fetchError} 
                  onSelectUser={(u) => {
                    setSelectedUser(u);
                    setLoginError(null);
                  }} 
                  emptyMessage="Belum ada akun Kasir."
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-pin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex items-center justify-center py-10"
            >
              <div className="w-full max-w-md">
                <PinEntryScreen 
                  user={selectedUser} 
                  onBack={() => {
                    setSelectedUser(null);
                    setLoginError(null);
                  }}
                  onPinSubmit={handlePinSubmit}
                  isLoading={loadingLogin}
                  errorMsg={loginError}
                  onClearError={() => setLoginError(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center text-xs font-medium text-neutral-600 uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} Seru.ni Coffee</p>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span>Central Cashier System</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
