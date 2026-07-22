"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/components/auth-pin/types";
import { ProfileGrid } from "@/components/auth-pin/ProfileGrid";
import { PinEntryScreen } from "@/components/auth-pin/PinEntryScreen";
import { ShiftLocationSelector } from "@/components/auth-pin/ShiftLocationSelector";
import { getActiveShift } from "@/services/shiftStorageService";
import { checkActiveShiftInSupabase, syncRecordToStorageCache } from "@/services/shiftAuthService";

export default function AuthPinPage() {
  const router = useRouter();

  // State Profil & Users
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State Alur Otentikasi (Step By Step)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loadingLogin, setLoadingLogin] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Auto-Redirect jika session shift aktif sudah ada sebelumnya (Fast Cache Check)
  useEffect(() => {
    const activeShift = getActiveShift();
    if (activeShift && activeShift.active_shift_id) {
      const role = (activeShift.role || "").toLowerCase();
      const targetPath = role === "barista" || role === "produksi" ? "/pekerja/produksi" : "/pekerja";
      router.replace(targetPath);
    }
  }, [router]);

  // Fetch seluruh crew dari Supabase tabel users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setFetchError(null);
    try {
      // Query HANYA memanggil kolom yang pasti ada: id, nama, role dan filter status_aktif = true
      const { data, error } = await supabase
        .from("users")
        .select("id, nama, role")
        .eq("status_aktif", true)
        .order("nama", { ascending: true });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setUsers(data as UserProfile[]);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error("Fetch users error:", err);
      setUsers([]);
      setFetchError(err.message || "Gagal memuat data crew dari database Supabase.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Pengecekan PIN untuk profil yang dipilih SAJA
  const handlePinSubmit = async (inputPin: string): Promise<boolean> => {
    if (!selectedUser) return false;
    setLoadingLogin(true);
    setLoginError(null);

    try {
      // Query hanya memvalidasi terhadap id user yang dipilih dengan kolom yang pasti ada
      const { data, error } = await supabase
        .from("users")
        .select("id, nama, role")
        .eq("id", selectedUser.id)
        .eq("pin", inputPin)
        .maybeSingle();

      if (data) {
        // Simpan role ke selectedUser agar konsisten
        const userRole = (data.role || selectedUser.role || "crew").toLowerCase();
        selectedUser.role = userRole;
        const displayName = selectedUser.nama || selectedUser.full_name || "Crew Member";

        // 1. CEK ROLE USER: JIKA BARISTA / PRODUKSI
        // Barista tidak perlu memilih titik outlet gerobak. Langsung redirect ke MES Portal.
        if (userRole === "barista" || userRole === "produksi") {
          const sessionData = {
            id: selectedUser.id,
            nama: displayName,
            role: userRole,
            lokasi: "Pusat Produksi MES",
            loginTime: new Date().toISOString(),
          };
          localStorage.setItem("session", JSON.stringify(sessionData));
          localStorage.setItem("pos_shift_session", JSON.stringify(sessionData));

          try {
            const activeShiftRecord = await checkActiveShiftInSupabase(selectedUser.id, displayName);
            if (activeShiftRecord && activeShiftRecord.id) {
              syncRecordToStorageCache(activeShiftRecord, selectedUser.id, displayName, userRole);
            }
          } catch (sErr) {
            console.warn("Gagal sinkronisasi shift barista:", sErr);
          }

          router.push("/pekerja/produksi");
          return true;
        }

        // 2. CEK ROLE USER: JIKA MANAGER / ADMIN / OWNER
        if (userRole === "manager" || userRole === "admin" || userRole === "owner") {
          const sessionData = {
            id: selectedUser.id,
            nama: displayName,
            role: userRole,
            lokasi: "Kantor Manajemen",
            loginTime: new Date().toISOString(),
          };
          localStorage.setItem("session", JSON.stringify(sessionData));
          localStorage.setItem("pos_shift_session", JSON.stringify(sessionData));

          router.push(userRole === "manager" ? "/manager/distribusi-gelas" : "/admin");
          return true;
        }

        // 3. CEK ROLE USER: JIKA CREW / KASIR GEROBAK
        // Untuk crew, periksa apakah sudah memiliki shift aktif di Supabase (Single Source of Truth)
        try {
          const activeShiftRecord = await checkActiveShiftInSupabase(selectedUser.id, displayName);

          if (activeShiftRecord && activeShiftRecord.id) {
            // JIKA ADA SHIFT AKTIF: Sinkronisasikan cache lokal, lalu redirect langsung ke /pekerja (POS Cashier)
            syncRecordToStorageCache(activeShiftRecord, selectedUser.id, displayName, userRole);
            setLoadingLogin(false);
            router.push("/pekerja");
            return true;
          }
        } catch (sErr) {
          console.warn("Gagal mengecek shift aktif, melanjutkan ke pemilihan gerobak:", sErr);
        }

        // JIKA TIDAK ADA SHIFT AKTIF (khusus Crew): Lanjut ke halaman Pilih Gerobak / Buka Shift
        setIsAuthenticated(true);
        setLoadingLogin(false);
        return true;
      }

      setLoginError("PIN yang Anda masukkan salah untuk akun ini.");
      setLoadingLogin(false);
      return false;
    } catch (err: any) {
      console.error("PIN validation error:", err);
      setLoginError("Terjadi kesalahan sistem saat memverifikasi PIN.");
      setLoadingLogin(false);
      return false;
    }
  };

  const handleSelectLocation = (lokasi: string) => {
    if (!selectedUser) return;
    setLoadingLogin(true);

    const displayName = selectedUser.nama || selectedUser.full_name || "Crew Member";
    const userRole = (selectedUser.role || "crew").toLowerCase();
    const sessionData = {
      id: selectedUser.id,
      nama: displayName,
      role: userRole,
      lokasi: lokasi,
      loginTime: new Date().toISOString(),
    };

    // Simpan ke session terstandar sebelum proses redirect dieksekusi
    localStorage.setItem("session", JSON.stringify(sessionData));
    localStorage.setItem("pos_shift_session", JSON.stringify(sessionData));

    const targetPath = userRole === "barista" || userRole === "produksi" ? "/pekerja/produksi" : "/pekerja";
    router.push(targetPath);
  };

  const handleBackToGrid = () => {
    setSelectedUser(null);
    setIsAuthenticated(false);
    setLoginError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-neutral-100 font-body relative flex flex-col justify-between overflow-x-hidden selection:bg-[#EA580C] selection:text-white">
      {/* Import Custom Fonts Khusus */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@700;800;900&display=swap');
        .font-heading { font-family: 'Poppins', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `,
        }}
      />

      {/* Cinematic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#EA580C]/15 via-[#EA580C]/5 to-transparent rounded-full blur-3xl opacity-60 sm:opacity-80" />
        <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-20 w-full px-6 sm:px-10 py-6 flex items-center justify-between">
        <Link
          href="/login"
          className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors duration-200 group"
        >
          <div className="w-9 h-9 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center group-hover:bg-[#EA580C] group-hover:border-[#EA580C] transition-all duration-300">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">
            Login Admin / Owner
          </span>
        </Link>

        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="relative h-8 sm:h-10 w-28 sm:w-36">
            <Image
              src="/logo-brand.png"
              alt="Logo Seruni"
              fill
              className="object-contain object-right invert opacity-95"
              priority
            />
          </div>
        </div>
      </header>

      {/* Main Content Area — Netflix Flow Screen Orchestration */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <AnimatePresence mode="wait">
          {!selectedUser ? (
            <motion.div
              key="step-profile-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center"
            >
              {/* Cinematic Section Title */}
              <div className="text-center mb-8 sm:mb-12 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EA580C]/10 border border-[#EA580C]/20 text-[#EA580C] text-[11px] font-bold tracking-widest uppercase mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" /> POS Profile Selection
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
                  Siapa yang Sedang Bertugas?
                </h1>
                <p className="text-neutral-400 text-sm sm:text-base font-light leading-relaxed">
                  Pilih profil crew Anda dari daftar aktif di bawah untuk mulai mengotorisasi shift dan mengakses sistem kasir gerobak.
                </p>
              </div>

              {/* Profile Grid Container */}
              <ProfileGrid
                users={users}
                loading={loadingUsers}
                error={fetchError}
                onSelectUser={(user) => setSelectedUser(user)}
                onRefresh={fetchUsers}
              />
            </motion.div>
          ) : !isAuthenticated ? (
            <PinEntryScreen
              key="step-pin-entry"
              user={selectedUser}
              onBack={handleBackToGrid}
              onPinSubmit={handlePinSubmit}
              isLoading={loadingLogin}
              errorMsg={loginError}
              onClearError={() => setLoginError(null)}
            />
          ) : (
            <ShiftLocationSelector
              key="step-shift-location"
              user={selectedUser}
              onSelectLocation={handleSelectLocation}
              onBack={() => setIsAuthenticated(false)}
              isLoading={loadingLogin}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer Minimalis & Profesional */}
      <footer className="relative z-20 w-full px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left border-t border-white/5 text-xs text-neutral-500 font-medium">
        <p>
          Copyright &copy; {new Date().getFullYear()} Seru.ni Coffee POS. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            System Secure V.3.1 (Netflix Flow)
          </span>
        </div>
      </footer>
    </div>
  );
}
