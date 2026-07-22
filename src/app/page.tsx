"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturesBento from "@/components/FeaturesBento";
import StatsCountUp from "@/components/StatsCountUp";
import SeriesGallery from "@/components/SeriesGallery";
import Footer from "@/components/Footer";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <Preloader onComplete={() => setIsLoaded(true)} />

      <div className={`relative w-full ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-700`}>
        
        <Navbar />
        
        <Hero />

        <div className="relative z-20 !bg-white shadow-none drop-shadow-none rounded-t-[32px] sm:rounded-t-[48px] overflow-hidden border-t border-neutral-100">
          
          <FeaturesBento />

          {/* --- EVENT STAND SECTION (RESPONSIVE: Stack di HP, Full Background di PC) --- */}
          <section className="relative w-full flex flex-col md:block md:min-h-[85vh] overflow-hidden bg-gradient-to-b from-white to-[#FAFAFA] md:bg-white pt-16 md:pt-0">
            
            {/* 1. Gambar Stand KHUSUS PC (Sembunyi pas di HP) */}
            <div className="hidden md:block absolute inset-0 z-0 pointer-events-none">
              <div className="absolute right-0 bottom-0 w-full md:w-[65%] h-[90%]">
                <Image
                  src="/stand-event.png" 
                  alt="Seruni Stand Event Take It & Go"
                  fill
                  className="object-contain object-bottom md:object-right-bottom mix-blend-multiply pr-16"
                  priority
                />
              </div>
            </div>
            
            {/* Gradient Overlay dari kiri ke kanan biar teksnya kebaca jelas di PC */}
            <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent z-10 w-full md:w-2/3" />
            
            {/* 2. Konten Teks (Di atas pas di HP, Di Kiri pas di PC) */}
            <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 md:px-16 w-full h-full flex flex-col justify-center">
              <motion.div
                initial={isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: isMobile ? 0 : 0.8, ease: "easeOut" }}
                className="max-w-xl flex flex-col justify-center text-left md:py-32"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <span className="w-8 h-[2px] bg-[#EA580C]" />
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#EA580C] uppercase drop-shadow-sm">
                    Seru.ni Event & Catering
                  </span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl lg:text-[4rem] font-black tracking-tighter text-neutral-900 mb-4 sm:mb-6 leading-[1.1]">
                  BAWA KESERUAN <br />
                  <span className="text-[#EA580C]">KE ACARAMU.</span>
                </h2>
                
                <p className="text-sm sm:text-base lg:text-lg text-neutral-700 font-medium leading-relaxed mb-8">
                  Dari resepsi pernikahan yang syahdu, gathering kantor, sampai festival musik meriah! Stand <span className="font-black text-neutral-900">Take It & Go</span> kami siap menyajikan kesegaran kopi premium Seru.ni langsung di lokasimu.
                </p>
                
                <a 
                  href="https://wa.me/6283125525115?text=Halo%2C%20saya%20ingin%20pesan%20stand%20nya%20dan%20ingin%20liat%20info%20lebih%20lanjut." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-neutral-900 hover:bg-[#EA580C] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs transition-colors self-start shadow-lg hover:shadow-orange-500/30 active:scale-95"
                >
                  Booking Stand Sekarang
                </a>
              </motion.div>
            </div>

            {/* 3. Gambar Stand KHUSUS HP (Sembunyi di PC, muncul di bawah teks pas di HP) */}
            <div className="relative md:hidden w-full h-[280px] sm:h-[350px] mt-0 overflow-hidden flex items-end justify-center">
              
              {/* Latar Belakang Estetik (Aura & Teks Besar) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Lingkaran Aura Oranye */}
                <div className="w-[80vw] h-[80vw] rounded-full bg-[#EA580C]/10 blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                
                {/* Teks Latar Belakang Raksasa */}
                <div className="absolute top-4 flex flex-col items-center">
                  <span className="text-[18vw] font-black leading-none text-neutral-200 uppercase tracking-tighter whitespace-nowrap z-0">
                    TAKE IT
                  </span>
                  <span className="text-[18vw] font-black leading-none text-neutral-100 uppercase tracking-tighter whitespace-nowrap z-0 -mt-2">
                    & GO
                  </span>
                </div>
              </div>

              {/* Gambar Cart Utama */}
              <div className="relative w-[100%] h-full z-10">
                <Image
                  src="/stand-event.png" 
                  alt="Seruni Stand Event Take It & Go"
                  fill
                  className="object-contain object-bottom mix-blend-multiply md:mix-blend-normal shadow-none md:shadow-lg hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Floating Badge Kiri (Lokasi) */}
              <div className="absolute top-[30%] left-4 sm:left-8 bg-white/90 backdrop-blur-sm border border-neutral-200 px-3 py-1.5 rounded-full shadow-lg shadow-black/5 z-20 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-black text-neutral-800 uppercase tracking-widest">Tanjungpinang</span>
              </div>

              {/* Floating Badge Atas Kanan (Promo) */}
              <div className="absolute top-4 right-4 sm:right-8 bg-white/80 backdrop-blur-md border border-[#EA580C]/30 text-[#EA580C] px-3 py-1.5 rounded-full shadow-md z-20 flex items-center justify-center">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Siap Meluncur</span>
              </div>

            </div>
          </section>

          <StatsCountUp />

          <SeriesGallery />

          <Footer />

        </div>
      </div>
    </>
  );
}