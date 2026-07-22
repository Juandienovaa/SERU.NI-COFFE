import React from "react";
import { Settings, Shield, Bell, Key } from "lucide-react";

export default function ManagerSettingsPage() {
  return (
    <div className="p-8 md:p-12 w-full max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Pengaturan Sistem
        </h1>
        <p className="text-neutral-400 mt-2 text-sm md:text-base max-w-xl leading-relaxed">
          Konfigurasi akses keamanan, notifikasi, dan preferensi akun Manajer.
        </p>
      </header>

      <div className="space-y-6">
        {/* Keamanan Akun */}
        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-8 hover:border-white/[0.1] transition-colors group">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">Keamanan & Autentikasi</h3>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                Kelola kata sandi, otentikasi dua langkah (2FA), dan sesi perangkat yang aktif.
              </p>
              <button className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.1] border border-white/[0.06] rounded-xl text-sm font-bold text-white transition-all">
                Kelola Keamanan
              </button>
            </div>
          </div>
        </div>

        {/* Notifikasi */}
        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-8 hover:border-white/[0.1] transition-colors group">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Preferensi Notifikasi</h3>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                Atur pemberitahuan untuk peringatan stok habis, laporan akhir shift, dan aktivitas anomali POS.
              </p>
              <button className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.1] border border-white/[0.06] rounded-xl text-sm font-bold text-white transition-all">
                Atur Notifikasi
              </button>
            </div>
          </div>
        </div>

        {/* Akses API */}
        <div className="bg-[#111113] border border-white/[0.05] rounded-3xl p-8 hover:border-white/[0.1] transition-colors group">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">Kunci API & Webhook</h3>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                Konfigurasi token otorisasi untuk integrasi mesin kasir eksternal atau sistem ERP pihak ketiga.
              </p>
              <button className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.1] border border-white/[0.06] rounded-xl text-sm font-bold text-white transition-all">
                Lihat API Keys
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
