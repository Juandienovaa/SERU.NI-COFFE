"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CheckCircle2, ShoppingBag, ArrowDown } from "lucide-react";

// Helper component for floating particles
const Particle = ({ x, y, size, duration, delay }: { x: string, y: string, size: number, duration: number, delay: number }) => (
  <motion.div
    className="absolute rounded-full bg-orange-500/30 blur-[1px]"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      opacity: [0.2, 0.6, 0.2]
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

const Hero = () => {
  const [mounted, setMounted] = useState(false);
  
  // Mouse parallax setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const parallaxX = useTransform(smoothX, [-1000, 1000], [-30, 30]);
  const parallaxY = useTransform(smoothY, [-1000, 1000], [-30, 30]);

  const parallaxXInverse = useTransform(smoothX, [-1000, 1000], [20, -20]);
  const parallaxYInverse = useTransform(smoothY, [-1000, 1000], [20, -20]);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = e.clientX - innerWidth / 2;
      const y = e.clientY - innerHeight / 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

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
    hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
    },
  };

  const floatingAnimation = {
    y: [0, -15, 0],
    transition: {
      duration: 5,
      ease: "easeInOut" as const,
      repeat: Infinity,
    },
  };

  return (
    <section className="relative w-full min-h-[100dvh] bg-[#09090B] flex items-center justify-center overflow-hidden pt-24 pb-12 md:pt-0 md:pb-0">
      {/* Deep Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Mesh Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#EA580C]/10 blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#C2410C]/10 blur-[160px]" />
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full bg-[#F97316]/5 blur-[120px]" />
        
        {/* Subtle Premium Grid Pattern */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem]" 
          style={{ maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 10%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 10%, transparent 100%)" }}
        />
        
        {/* High-End Noise Texture */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-screen" />
      </div>

      {/* Floating Particles (Soft Depth) */}
      {mounted && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <Particle x="15%" y="25%" size={4} duration={4} delay={0} />
          <Particle x="80%" y="15%" size={6} duration={5} delay={1} />
          <Particle x="60%" y="85%" size={5} duration={3} delay={2} />
          <Particle x="20%" y="75%" size={3} duration={6} delay={0.5} />
          <Particle x="40%" y="45%" size={7} duration={7} delay={1.5} />
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 md:px-16 relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-20 h-full">
        
        {/* Left Side: Content (45%) */}
        <motion.div 
          className="w-full md:w-[45%] flex flex-col items-center md:items-start text-center md:text-left mt-10 md:mt-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo Branding */}
          <motion.div variants={itemVariants} className="mb-8 relative group">
            <div className="absolute inset-0 bg-[#F97316]/20 blur-xl rounded-full group-hover:bg-[#F97316]/30 transition-colors duration-500" />
            <div className="relative bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 backdrop-blur-xl shadow-lg">
              <Image 
                src="/images/hero-section-logo.PNG" 
                alt="Seru.ni Logo" 
                width={24} 
                height={24} 
                className="object-contain"
              />
              <span className="text-[11px] font-bold text-white tracking-[0.2em] uppercase">SERU.NI COFFEE</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6"
          >
            Nikmati Kopi Terbaik <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#FB923C] drop-shadow-sm">
              Tanpa Harus Keluar
            </span>{" "}
            <br className="hidden md:block" />
            Rumah.
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-10 max-w-lg mx-auto md:mx-0 font-medium"
          >
            Seru.ni Coffee menghadirkan pengalaman menikmati kopi premium dengan layanan Delivery yang cepat, praktis, dan berkualitas.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12"
          >
            <Link 
              href="/menu-online" 
              aria-label="Pesan Online"
              className="group relative flex items-center justify-center gap-3 w-full sm:w-auto bg-[#F97316] hover:bg-[#EA580C] text-white px-8 py-4 rounded-full font-bold text-sm transition-all duration-300 shadow-[0_8px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.5)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <ShoppingBag className="w-4 h-4 relative z-10" />
              <span className="relative z-10 tracking-wide">Pesan Online</span>
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
              className="group flex items-center justify-center gap-3 w-full sm:w-auto bg-transparent border border-white/10 hover:border-[#F97316] hover:bg-[#F97316]/5 text-white px-8 py-4 rounded-full font-bold text-sm transition-all duration-300 active:scale-[0.98]"
            >
              <span className="tracking-wide">Lihat Menu</span>
              <ArrowDown className="w-4 h-4 text-neutral-400 group-hover:text-[#F97316] group-hover:translate-y-1 transition-all" />
            </a>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-y-3 gap-x-4 w-full max-w-md mx-auto md:mx-0"
          >
            {[
              "Delivery Cepat",
              "QRIS Payment",
              "Freshly Brewed",
              "Live Order Tracking"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-colors rounded-full py-2 px-3.5 backdrop-blur-md">
                <div className="w-5 h-5 rounded-full bg-[#F97316]/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F97316]" />
                </div>
                <span className="text-[11px] font-semibold text-neutral-300 tracking-wide">{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side: Parallax Image (55%) */}
        <motion.div 
          className="w-full md:w-[55%] h-full flex items-center justify-center relative mt-16 md:mt-0 perspective-1000"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {/* Huge Orange Glow Behind Product */}
          <motion.div 
            style={{ x: parallaxXInverse, y: parallaxYInverse }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] max-w-md bg-[#EA580C]/30 blur-[120px] rounded-full mix-blend-screen pointer-events-none" 
          />
          
          <motion.div 
            animate={floatingAnimation}
            style={{ x: parallaxX, y: parallaxY }}
            className="relative w-full max-w-lg aspect-square drop-shadow-2xl z-10 group"
          >
            <Image 
              src="/images/kopi-hero.png"
              alt="Seru.ni Premium Coffee Cup"
              fill
              priority
              className="object-contain filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-2"
              sizes="(max-width: 768px) 100vw, 55vw"
            />
            
            {/* Premium Glass Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.07] to-white/0 rounded-full blur-[2px] pointer-events-none mix-blend-overlay opacity-50" />
          </motion.div>

          {/* Floating Coffee Beans (Abstract Decorative Elements) */}
          <motion.div 
            style={{ x: parallaxX, y: parallaxYInverse }}
            className="absolute top-[10%] right-[10%] w-16 h-16 bg-[#C2410C]/40 rounded-[40%_60%_70%_30%] blur-xl pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            style={{ x: parallaxXInverse, y: parallaxY }}
            className="absolute bottom-[20%] left-[5%] w-24 h-24 bg-[#F97316]/30 rounded-[60%_40%_30%_70%] blur-2xl pointer-events-none"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
