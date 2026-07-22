"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full h-screen min-h-[800px] flex flex-col md:flex-row overflow-hidden bg-white">
      
      {/* Background Split */}
      <div className="absolute inset-0 flex flex-col md:flex-row z-0 pointer-events-none">
        {/* Left: White */}
        <div className="w-full md:w-[55%] h-[50%] md:h-full bg-white"></div>
        {/* Right: Orange */}
        <div className="w-full md:w-[45%] h-[50%] md:h-full bg-orange-500 rounded-t-[40px] md:rounded-t-none md:rounded-l-[40px]"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row container mx-auto px-6 md:px-12 lg:px-24">
        
        {/* Left Column: Text & CTA */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full md:w-[55%] h-[50%] md:h-full flex flex-col justify-center pt-24 md:pt-0 md:pr-20"
        >
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <Image
              src="/images/hero-section-logo.PNG"
              alt="Seru.ni Coffee Logo"
              width={28}
              height={28}
              className="w-7 h-7 object-contain drop-shadow-sm"
            />
            <span className="text-sm font-bold text-neutral-800 tracking-wider uppercase">
              Seru.ni Coffee
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 text-neutral-900">
            Nikmati Kopi <br />
            Terbaik <span className="text-orange-500">Tanpa<br />Harus Keluar</span> <br />
            Rumah.
          </h1>

          {/* Sub-headline */}
          <p className="text-lg md:text-xl text-neutral-500 max-w-[420px] leading-relaxed mb-10">
            Pengalaman menikmati kopi premium dengan layanan Delivery yang cepat, praktis, dan berkualitas langsung ke meja Anda.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/menu-online"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-full font-semibold text-lg transition-all hover:bg-black hover:scale-105 active:scale-95 w-full sm:w-auto shadow-xl"
            >
              <ShoppingBag className="w-5 h-5" />
              Pesan Online
            </Link>
            
            <button 
              onClick={() => {
                window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
              }}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-neutral-200 text-neutral-900 rounded-full font-semibold text-lg transition-all hover:border-orange-500 hover:text-orange-500 w-full sm:w-auto"
            >
              Lihat Menu
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Right Column: Details & Vertical Menu */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full md:w-[45%] h-[50%] md:h-full flex flex-col justify-center items-end text-white pb-12 md:pb-0 pt-32 md:pt-0 relative"
        >
          <div className="flex flex-col items-end gap-1 mb-12">
            <span className="text-sm font-medium text-orange-200 uppercase tracking-widest">Start From</span>
            <span className="text-5xl font-black drop-shadow-md">Rp 15.000</span>
          </div>

          {/* Vertical Features List (Inspired by the Starbucks reference) */}
          <div className="flex relative mt-4">
            {/* The Text List */}
            <div className="flex flex-col gap-6 text-right pr-8">
              {[
                { name: "Delivery Cepat", active: true },
                { name: "QRIS Payment", active: false },
                { name: "Freshly Brewed", active: false },
                { name: "Live Order Tracking", active: false },
                { name: "Premium Beans", active: false }
              ].map((item, i) => (
                <span 
                  key={i} 
                  className={`text-lg font-medium transition-colors ${item.active ? 'text-white' : 'text-orange-200 hover:text-white cursor-pointer'}`}
                >
                  {item.name}
                </span>
              ))}
            </div>

            {/* The Vertical Line & Dots */}
            <div className="relative flex flex-col items-center">
              {/* Line */}
              <div className="absolute top-2 bottom-2 w-[2px] bg-orange-300/50"></div>
              {/* Dots */}
              <div className="flex flex-col justify-between h-full relative z-10 py-2">
                {[true, false, false, false, false].map((active, i) => (
                  <div 
                    key={i} 
                    className={`w-3 h-3 rounded-full border-2 ${active ? 'bg-white border-white' : 'bg-orange-500 border-orange-200'}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Center Overlapping Image */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-[45%] md:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[85vw] max-w-[400px] md:max-w-[500px] lg:max-w-[600px] aspect-square pointer-events-none drop-shadow-2xl"
      >
        <Image
          src="/images/kopi-hero.png"
          alt="Seru.ni Premium Coffee"
          fill
          priority
          className="object-contain"
          sizes="(max-width: 768px) 85vw, 50vw"
        />
      </motion.div>

    </section>
  );
}
