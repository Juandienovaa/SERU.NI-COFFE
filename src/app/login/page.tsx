"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CinematicLoader from "@/components/CinematicLoader";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successLoading, setSuccessLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Email dan kata sandi tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Khusus penanganan akun manager@seruni.com
      if (email.toLowerCase() === "manager@seruni.com" && password === "kopienakcumaseruni") {
        try {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInErr) {
            // Jika akun manager belum terdaftar di Supabase Auth, daftarkan otomatis (signUp)
            await supabase.auth.signUp({
              email,
              password,
            });
            // Coba login sekali lagi setelah signUp
            await supabase.auth.signInWithPassword({ email, password });
          }
        } catch (authErr) {
          console.warn("Supabase auth check untuk manager:", authErr);
        }

        // Simpan ke localStorage agar sesi pos_shift_session siap untuk service layer
        if (typeof window !== "undefined") {
          localStorage.setItem("pos_shift_session", JSON.stringify({
            id: "MGR-SERUNI-001",
            email: "manager@seruni.com",
            role: "manager",
            name: "Production Manager Seru.ni"
          }));
        }

        setSuccessLoading(true);
        router.push("/manager");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Berhasil login, arahkan berdasarkan peran
      setSuccessLoading(true);
      if (email === "admin@seruni.com") {
        router.push("/admin");
      } else if (email.toLowerCase().includes("manager")) {
        router.push("/manager");
      } else {
        router.push("/pekerja");
      }
    } catch (error: any) {
      // Menangkap pesan error dari Supabase dan menampilkannya dengan rapi
      setErrorMsg(error.message || "Gagal masuk. Periksa kembali kredensial Anda.");
      setLoading(false);
    }
  };

  if (successLoading) {
    return <CinematicLoader />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#0a0a0a] overflow-hidden font-body relative selection:bg-[#EA580C] selection:text-white">
      {/* Import Custom Fonts Khusus Halaman Ini */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Poppins:wght@700;800;900&display=swap');
        .font-heading { font-family: 'Poppins', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}} />

      {/* Tombol Kembali Floating */}
      <Link href="/" className="absolute top-6 left-6 md:top-10 md:left-10 z-50 flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-[#EA580C] group-hover:border-[#EA580C] transition-all duration-300">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">Kembali</span>
      </Link>

      {/* ================= PANEL KIRI (INFO/BRANDING) ================= */}
      <div className="relative w-full md:w-2/5 lg:w-[45%] min-h-[40vh] md:min-h-screen flex flex-col justify-center items-center md:items-start p-8 md:p-12 lg:p-20 z-0 bg-neutral-900">
        
        {/* Background Image Premium dengan Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/hero-menu.jpeg" 
            alt="Seru.ni Coffee Vibe" 
            fill 
            className="object-cover opacity-30 mix-blend-luminosity" 
            priority 
          />
          {/* Gradient Overlay untuk meredupkan gambar dan transisi halus ke hitam */}
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-br from-black/80 via-black/50 to-[#0a0a0a]/90" />
        </div>
        
        {/* Konten Kiri */}
        <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left w-full h-full">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-auto w-full flex justify-center md:justify-start"
          >
            {/* Logo Invert */}
            <div className="relative block w-32 h-10 md:w-44 md:h-14 hover:scale-105 transition-transform duration-500">
              <Image 
                src="/logo-brand.png" 
                alt="Logo Seruni" 
                fill
                className="object-contain object-center md:object-left invert opacity-95 drop-shadow-2xl" 
                priority
              />
            </div>
          </motion.div>

          <div className="mt-12 md:mt-0 flex flex-col items-center md:items-start">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="flex items-center gap-3 mb-4"
            >
              <span className="w-8 h-[2px] bg-[#EA580C]" />
              <h2 className="font-heading text-xs md:text-sm tracking-[0.2em] text-[#EA580C] uppercase drop-shadow-md">
                Portal Sistem
              </h2>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white font-black leading-[1.1] tracking-tight mb-6 drop-shadow-xl"
            >
              SELAMAT DATANG <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">KEMBALI.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="text-neutral-400 text-sm md:text-base max-w-sm font-light leading-relaxed drop-shadow-md"
            >
              Masukkan kredensial Anda untuk mengakses dashboard manajemen dan kasir Portal Seru.ni.
            </motion.p>
          </div>

          <div className="mt-auto hidden md:block pt-12">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="text-[10px] text-neutral-500 tracking-widest uppercase font-semibold"
            >
              System V.2.0.4 — Secured
            </motion.p>
          </div>
        </div>
      </div>

      {/* ================= PANEL KANAN (FORM LOGIN) ================= */}
      <div className="relative w-full md:w-3/5 lg:w-[55%] flex flex-col justify-center items-center p-8 sm:p-12 md:p-16 lg:p-24 bg-[#0d0d0d] z-10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        
        {/* SVG Wave Vertical (Desktop) */}
        <svg className="absolute top-0 right-full h-full w-16 lg:w-24 text-[#0d0d0d] fill-current hidden md:block translate-x-[1px]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M100 0H0C50 30 50 70 0 100H100Z" />
        </svg>

        {/* SVG Wave Horizontal (Mobile) */}
        <svg className="absolute bottom-full left-0 w-full h-10 text-[#0d0d0d] fill-current md:hidden translate-y-[1px]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 100V0C30 50 70 50 100 0V100H0Z" />
        </svg>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center md:text-left mb-10">
            <h3 className="font-heading text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
              MASUK KE AKUN ANDA
            </h3>
            <p className="text-neutral-500 text-sm">Otorisasi sistem diperlukan untuk melanjutkan.</p>
          </div>

          {/* Alert Error Messages */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />
                  <p className="font-medium">{errorMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Login */}
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            
            {/* Input Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-neutral-400 tracking-wider uppercase ml-1">
                Alamat Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-[#EA580C] transition-colors duration-300" />
                <input 
                  type="email" 
                  required
                  placeholder="email.anda@seruni.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white placeholder-neutral-600 rounded-2xl px-12 py-4 focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all duration-300 hover:bg-neutral-900"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-neutral-400 tracking-wider uppercase">
                  Kata Sandi
                </label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-[#EA580C] transition-colors duration-300" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white placeholder-neutral-600 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-all duration-300 hover:bg-neutral-900 font-medium tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>


            {/* Tombol Login */}
            <button 
              type="submit" 
              disabled={loading}
              className="group relative mt-4 w-full bg-[#EA580C] hover:bg-[#d04e0a] text-white font-heading font-bold tracking-widest uppercase text-sm py-4 md:py-5 rounded-2xl shadow-xl shadow-[#EA580C]/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] overflow-hidden flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  MEMPROSES...
                </>
              ) : (
                <>
                  MASUK SEKARANG
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Link ke PIN Login Kasir */}
          <div className="mt-8 text-center relative z-20 space-y-3">
            <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wider">Atau akses sistem POS?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href="/masuk-kasir" 
                className="flex-1 inline-flex items-center justify-center py-4 px-4 rounded-2xl border-2 border-orange-500/30 text-orange-400 font-bold tracking-widest text-[10px] sm:text-xs hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-lg shadow-orange-500/10"
              >
                CENTRAL CASHIER
              </Link>
              <Link 
                href="/kasir" 
                className="flex-1 inline-flex items-center justify-center py-4 px-4 rounded-2xl border-2 border-neutral-800 text-neutral-400 font-bold tracking-widest text-[10px] sm:text-xs hover:bg-neutral-800 hover:text-white transition-all duration-300"
              >
                CREW / BARISTA
              </Link>
            </div>
          </div>

          {/* Copyright Mobile */}
          <div className="mt-16 text-center md:hidden">
            <p className="text-[10px] text-neutral-600 font-medium">
              Copyright &copy; {new Date().getFullYear()} Seru.ni Coffee.<br/>All rights reserved.
            </p>
          </div>
        </motion.div>
        
        {/* Copyright Desktop */}
        <div className="absolute bottom-8 right-8 hidden md:block">
          <p className="text-[10px] text-neutral-600 font-medium tracking-wide">
            Copyright &copy; {new Date().getFullYear()} Seru.ni Coffee. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
