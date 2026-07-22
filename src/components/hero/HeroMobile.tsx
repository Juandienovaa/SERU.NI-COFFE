"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ShoppingBag, ArrowDown, Check } from "lucide-react";

const STAGGER = 0.1;
const DURATION = 0.5;

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: DURATION,
      ease: "easeOut"
    }
  }
};

export default function HeroMobile() {
  return (
    <section className="relative w-full min-h-[100dvh] flex flex-col overflow-hidden bg-white">
      
      {/* Background Enhancements */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/50 to-neutral-100 z-0 pointer-events-none" />
      
      {/* Subtle Noise */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Soft Radial Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] h-[150vw] bg-white rounded-full blur-[100px] z-0 pointer-events-none opacity-80" />

      {/* Main Content Container (Stacked) */}
      <motion.div 
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: STAGGER }}
        className="relative z-10 w-full flex-1 flex flex-col px-6 pt-[120px]"
      >
        
        {/* Headline */}
        <motion.h1 
          variants={itemVariants}
          className="text-[40px] leading-[1.05] font-[900] text-neutral-900 tracking-tight text-center"
        >
          Nikmati Kopi <br />
          Terbaik
        </motion.h1>
        
        <motion.h1
          variants={itemVariants}
          className="text-[40px] leading-[1.05] font-[900] text-orange-500 tracking-tight mt-1 text-center"
        >
          Tanpa Harus <br />
          Keluar Rumah.
        </motion.h1>

        {/* Description */}
        <motion.p 
          variants={itemVariants}
          className="text-neutral-500 text-[15px] leading-[1.4] mt-5 mb-8 text-center max-w-[280px] mx-auto font-medium"
        >
          Rasakan pengalaman kopi premium Seru.ni langsung di tempat Anda.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-row items-center justify-between gap-3 w-full"
        >
          <Link
            href="/menu-online"
            className="flex-1 flex items-center justify-center gap-2 h-[52px] bg-neutral-900 text-white rounded-full font-semibold text-[15px] shadow-[0_10px_30px_rgba(0,0,0,0.15)] active:scale-95 transition-transform"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            Pesan Online
          </Link>
          
          <button 
            onClick={() => {
              window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
            }}
            className="flex-1 flex items-center justify-center gap-2 h-[52px] bg-transparent border-[1.5px] border-neutral-200 text-neutral-900 rounded-full font-semibold text-[15px] active:scale-95 transition-transform"
          >
            Lihat Menu
            <ArrowDown className="w-[18px] h-[18px]" />
          </button>
        </motion.div>

        {/* Floating Coffee Image */}
        <motion.div 
          variants={itemVariants}
          className="relative w-full flex items-center justify-center mt-10 mb-6 z-20"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut" // floating is typically easeInOut for a smooth loop, user said easeOut for entry animation but floating should loop
            }}
            className="relative w-[200px] h-[200px] drop-shadow-2xl"
          >
            {/* Subtle glow behind coffee */}
            <div className="absolute inset-0 bg-orange-500/20 blur-[30px] rounded-full scale-75 z-0" />
            <Image
              src="/images/kopi-hero.png"
              alt="Seru.ni Premium Coffee"
              fill
              priority
              className="object-contain relative z-10"
              sizes="200px"
            />
          </motion.div>
        </motion.div>

      </motion.div>

      {/* Orange Feature Card (Bottom) */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: STAGGER * 5, duration: DURATION, ease: "easeOut" }}
        className="relative z-10 w-full mt-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-t-[40px] pt-8 pb-10 px-8 shadow-[0_-10px_40px_rgba(249,115,22,0.2)]"
      >
        <div className="flex flex-col items-center text-center">
          <p className="text-orange-200 text-xs font-bold uppercase tracking-widest mb-1">Start From</p>
          <p className="text-white text-[32px] font-black tracking-tight mb-8 drop-shadow-sm">Rp15.000</p>
          
          <div className="flex flex-col gap-3 w-full max-w-[240px]">
            {[
              "Delivery Cepat",
              "QRIS Payment",
              "Freshly Brewed",
              "Live Tracking",
              "Premium Beans"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-white font-medium text-[15px]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </section>
  );
}
