"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag, ArrowDown } from "lucide-react";

const Hero = () => {
  // Stagger variants for sequential animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] as const }
    },
  };

  const floatingAnimation = {
    y: [0, -12, 0],
    transition: {
      duration: 5,
      ease: "easeInOut" as const,
      repeat: Infinity,
    },
  };

  return (
    <section className="relative w-full min-h-[100dvh] bg-[#09090B] flex items-center justify-center overflow-hidden pt-24 pb-12 md:pt-0 md:pb-0">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Radial Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[150px]" />
        
        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" 
          style={{ maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 10%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 10%, transparent 100%)" }}
        />
        
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 md:px-16 relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-20 h-full">
        
        {/* Left Side: Content (45%) */}
        <motion.div 
          className="w-full md:w-[45%] flex flex-col items-center md:items-start text-center md:text-left mt-10 md:mt-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo Branding */}
          <motion.div variants={itemVariants} className="mb-8 relative">
            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
            <div className="relative bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 backdrop-blur-md">
              <Image 
                src="/images/hero-section-logo.PNG" 
                alt="Seru.ni Logo" 
                width={24} 
                height={24} 
                className="object-contain"
              />
              <span className="text-xs font-bold text-white tracking-widest uppercase">SERU.NI COFFEE</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6"
          >
            Enjoy Premium Coffee, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Delivered Fresh
            </span>{" "}
            <br className="hidden md:block" />
            to Your Door.
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-10 max-w-lg mx-auto md:mx-0"
          >
            Seru.ni Coffee menghadirkan kopi berkualitas premium dengan pelayanan cepat. Kini kamu bisa memesan langsung dari website resmi tanpa aplikasi pihak ketiga.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12"
          >
            <Link 
              href="/menu-online" 
              aria-label="Pesan Online"
              className="group relative flex items-center justify-center gap-3 w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-full font-bold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:scale-[1.03]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pesan Online</span>
            </Link>
            
            <a 
              href="#menu"
              aria-label="Lihat Menu"
              onClick={(e) => {
                e.preventDefault();
                const menuSection = document.getElementById('menu') || document.querySelector('.menu-section') || document.querySelector('section:nth-of-type(2)');
                if (menuSection) {
                  menuSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group flex items-center justify-center gap-3 w-full sm:w-auto bg-transparent border border-orange-500 hover:border-orange-500 hover:bg-orange-500 hover:text-white text-white px-8 py-4 rounded-full font-bold text-sm transition-all duration-300"
            >
              <span>Lihat Menu</span>
              <ArrowDown className="w-4 h-4 group-hover:fill-orange-500" />
            </a>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-y-3 gap-x-4 w-full max-w-md mx-auto md:mx-0"
          >
            {[
              "Fresh Everyday",
              "Delivery Available",
              "QRIS Payment",
              "Made by Barista"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full py-1.5 px-3 backdrop-blur-md">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-orange-500" />
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-neutral-300 tracking-wide">{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side: Image (55%) */}
        <motion.div 
          className="w-full md:w-[55%] h-full flex items-center justify-center relative mt-12 md:mt-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.215, 0.61, 0.355, 1] as const }}
        >
          {/* Glow Behind Image */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-orange-500/20 blur-[100px] rounded-full" />
          
          <motion.div 
            animate={floatingAnimation}
            className="relative w-full max-w-lg aspect-square drop-shadow-2xl z-10"
          >
            <Image 
              src="/images/kopi-hero.png"
              alt="Seru.ni Premium Coffee Cup"
              fill
              priority
              className="object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              sizes="(max-width: 768px) 100vw, 55vw"
            />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
