"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowDown, CheckCircle2 } from "lucide-react";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen bg-[#09090B] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 w-full h-full">
        
        {/* Desktop: Grid 2 Columns | Mobile: Flex Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center w-full h-full">
          
          {/* Kolom Kiri: Teks & CTA */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start justify-center order-2 md:order-1 z-10 w-full"
          >
            
            {/* Badge Atas */}
            <motion.div variants={slideUp} className="mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                <Image
                  src="/images/hero-section-logo.PNG"
                  alt="Seru.ni Coffee Logo"
                  width={24}
                  height={24}
                  className="w-5 h-5 object-contain"
                />
                <span className="text-sm font-medium text-white tracking-wide">
                  Seru.ni Coffee
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={slideUp} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 text-white">
              Nikmati Kopi Terbaik <br />
              <span className="text-orange-500">Tanpa Harus Keluar</span> <br />
              Rumah.
            </motion.h1>

            {/* Sub-headline */}
            <motion.p variants={slideUp} className="text-lg md:text-xl text-neutral-400 max-w-[480px] leading-relaxed mb-10">
              Seru.ni Coffee menghadirkan pengalaman menikmati kopi premium dengan layanan Delivery yang cepat, praktis, dan berkualitas.
            </motion.p>

            {/* Tombol CTA */}
            <motion.div variants={slideUp} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
              <Link
                href="/menu-online"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-full font-semibold text-lg transition-all hover:bg-orange-600 hover:scale-105 active:scale-95 w-full sm:w-auto shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                <ShoppingBag className="w-5 h-5" />
                Pesan Online
              </Link>
              
              <button 
                onClick={() => {
                  window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
                }}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-semibold text-lg transition-all hover:bg-white/10 w-full sm:w-auto"
              >
                Lihat Menu
                <ArrowDown className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Features List (Grid 2x2) */}
            <motion.div variants={slideUp} className="grid grid-cols-2 gap-4 w-full max-w-[400px]">
              {[
                "Delivery Cepat",
                "QRIS Payment",
                "Freshly Brewed",
                "Live Order Tracking"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-sm font-medium text-white whitespace-nowrap">{feature}</span>
                </div>
              ))}
            </motion.div>

          </motion.div>

          {/* Kolom Kanan: Gambar Hero */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative order-1 md:order-2 flex items-center justify-center w-full h-full min-h-[40vh]"
          >
            {/* Subtle Radial Glow Behind Image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none" />
            
            {/* Hero Image */}
            <div className="relative w-full max-w-[500px] aspect-square z-10">
              <Image
                src="/images/kopi-hero.png"
                alt="Seru.ni Premium Coffee"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
