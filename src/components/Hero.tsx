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
      staggerChildren: 0.15,
    },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const FEATURES = [
  "Delivery Cepat",
  "QRIS Payment",
  "Freshly Brewed",
  "Live Order Tracking"
];

export default function Hero() {
  const scrollToMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const menuSection = document.getElementById("menu-section");
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-[#09090B] flex items-center justify-center pt-20 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Text & CTA */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start text-left max-w-2xl"
          >
            {/* Badge */}
            <motion.div variants={slideUp} className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <div className="w-5 h-5 relative rounded-full overflow-hidden">
                <Image 
                  src="/images/hero-section-logo.PNG" 
                  alt="Seru.ni Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="text-xs font-semibold tracking-wide text-white/90">Seru.ni Coffee</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={slideUp} className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white mb-6">
              Nikmati Kopi Terbaik<br />
              <span className="text-orange-500">Tanpa Harus Keluar</span><br />
              Rumah.
            </motion.h1>

            {/* Sub-headline */}
            <motion.p variants={slideUp} className="text-base sm:text-lg text-gray-400 mb-10 max-w-xl leading-relaxed">
              Seru.ni Coffee menghadirkan pengalaman menikmati kopi premium dengan layanan Delivery yang cepat, praktis, dan berkualitas.
            </motion.p>

            {/* Buttons */}
            <motion.div variants={slideUp} className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
              <Link 
                href="/menu-online" 
                className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Pesan Online</span>
              </Link>
              
              <a 
                href="#menu-section"
                onClick={scrollToMenu}
                className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300"
              >
                <span>Lihat Menu</span>
                <ArrowDown className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
              </a>
            </motion.div>

            {/* Features List */}
            <motion.div variants={slideUp} className="grid grid-cols-2 gap-3 sm:gap-4 w-full sm:w-auto">
              {FEATURES.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-300">{feature}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN: Hero Image */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center"
          >
            {/* Subtle Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none" />
            
            {/* Hero Image */}
            <div className="relative w-full h-full z-10">
              <Image
                src="/images/kopi-hero.png"
                alt="Seru.ni Coffee Cup"
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
