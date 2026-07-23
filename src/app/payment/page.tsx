"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PaymentPage() {
  const router = useRouter();
  
  // State untuk timer 5 menit (300 detik)
  const [timeLeft, setTimeLeft] = useState(300);

  // Kurangi timer setiap detik
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isTimeUp = timeLeft === 0;

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6 selection:bg-orange-500/30 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-[#121217]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        <div className="p-8 flex flex-col items-center text-center">
          
          <h1 className="text-2xl font-bold text-white mb-2">Pembayaran QRIS</h1>
          <p className="text-neutral-400 text-sm mb-6">
            Scan QR Code di bawah menggunakan aplikasi M-Banking atau e-Wallet Anda.
          </p>

          {/* QRIS Image */}
          <div className="bg-white p-4 rounded-2xl w-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] relative mb-6">
            <Image 
              src="/qris.jpeg" 
              alt="QRIS Seru.ni Kopi"
              width={400}
              height={400}
              className="w-full max-w-sm h-auto object-contain rounded-xl mx-auto shadow-md"
              priority
            />
          </div>

          {/* Countdown Timer Warning */}
          <div className="mb-8">
            <p className={`text-lg font-bold ${isTimeUp ? 'text-neutral-500' : 'text-orange-500'}`}>
              {isTimeUp 
                ? "Waktu pembayaran telah habis" 
                : `Selesaikan pembayaran dalam ${formatTime(timeLeft)}`}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push('/live-tracking')}
            disabled={isTimeUp}
            className={`w-full md:w-auto py-3 px-6 rounded-lg font-bold text-white transition-all shadow-lg active:scale-95 ${
              isTimeUp 
                ? "bg-neutral-600 cursor-not-allowed opacity-70 shadow-none text-neutral-300" 
                : "bg-orange-600 hover:bg-orange-500 shadow-orange-500/20"
            }`}
          >
            {isTimeUp ? "Waktu Habis" : "Konfirmasi Pembayaran"}
          </button>

        </div>
      </div>
    </div>
  );
}
