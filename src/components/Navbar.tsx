"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Phone, Mail, MapPin, LogIn, ArrowRight } from "lucide-react";
import Image from "next/image";
import CinematicLoader from "@/components/CinematicLoader";

// 3 MENU UTAMA
const navLinks = [
  { name: "BERANDA", href: "/" },
  { name: "MENU", href: "/produk" },
  { name: "KONTAK", href: "/contact" },
];

const Instagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPastSequence, setIsPastSequence] = useState(false);
  const [navigatingLogin, setNavigatingLogin] = useState(false);
  const router = useRouter();
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const splitTextTransition = { duration: 0.8, ease: [0.215, 0.61, 0.355, 1] } as const;

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setNavigatingLogin(true);
    router.push('/login');
  };

  useEffect(() => {
    const handleScroll = () => {
      const isHome = window.location.pathname === "/";
      const threshold = isHome ? window.innerHeight * 2.5 : 50;
      setIsPastSequence(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* GARIS BORDER DIHAPUS TOTAL DI SINI. MURNI CLEAN. */}
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 flex items-center ${
          isPastSequence 
            ? "bg-neutral-950 shadow-xl h-[80px]" // Fixed height
            : "bg-transparent h-[100px] md:h-[120px]"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 md:px-16 flex justify-between items-center">
          
         {/* LOGO */}
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileTap={{ scale: 0.9 }}
            className="block flex-shrink-0 cursor-pointer" 
          >
            <div className={`relative transition-all duration-500 flex items-center ${
              isPastSequence ? "h-12" : "h-16 md:h-24"
            }`}>
              <img src="/logo-brand.png" alt="Seruni" className="h-10 sm:h-12 w-auto object-contain" />
            </div>
          </motion.a>
          {/* BURGER ICON (ALWAYS VISIBLE) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex items-center"
          >
            <motion.button
              onClick={toggleMenu}
              whileTap={{ scale: 0.85 }}
              className="flex items-center justify-center p-2 text-white hover:text-[#DC7331] transition-colors"
            >
              <Menu className="w-8 h-8" />
            </motion.button>
          </motion.div>

        </div>
      </header>

      {/* OVERLAY MENU (BURGER MENU) DENGAN CIRCLE REVEAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[200] bg-neutral-950 text-white overflow-y-auto"
          >
            <div className="min-h-[100dvh] flex flex-col p-6 sm:p-10 md:p-16">
              
              <div className="flex justify-between items-center w-full shrink-0">
                <motion.span 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-[10px] md:text-xs tracking-widest font-semibold text-neutral-400 uppercase"
                >
                  SERU.NI — MENU
                </motion.span>
                <motion.button
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  whileTap={{ scale: 0.8, rotate: 90 }}
                  onClick={toggleMenu}
                  className="cursor-pointer w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-neutral-900/60 border border-neutral-800 rounded-full hover:bg-white hover:text-neutral-950 transition-colors"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </motion.button>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center py-4 lg:py-0">
                
                <div className="lg:col-span-7 flex flex-col justify-center items-start">
                  <ul className="flex flex-col items-start gap-4 sm:gap-6 lg:gap-8 group mt-8 lg:mt-0 w-full m-0 p-0">
                    {navLinks.map((link, idx) => (
                      <li key={link.href} className="group/item relative overflow-visible py-2 w-full flex justify-start m-0 p-0">
                        <a
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="inline-block text-[13vw] sm:text-7xl lg:text-[4.5rem] xl:text-[5.5rem] font-black tracking-tighter uppercase leading-[0.9] text-white transition-all duration-500 transform active:scale-95 active:text-[#DC7331] md:hover:translate-x-5 md:hover:text-[#DC7331] md:hover:tracking-[0.05em] md:group-hover:blur-[4px] md:group-hover:opacity-30 md:hover:!blur-none md:hover:!opacity-100 m-0 p-0 origin-left"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-neutral-800 pt-6 lg:pt-0 lg:pl-12">
                  <div className="flex flex-col gap-5">
                    {/* TOMBOL LOGIN CUMA ADA DI SINI SEKARANG */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="pt-2 lg:pt-4 pb-6 lg:pb-8 border-b border-neutral-800"
                    >
                      <motion.a 
                        href="/login"
                        onClick={handleLoginClick}
                        whileTap={{ scale: 0.95 }} 
                        className="group flex items-center justify-between border border-neutral-700 bg-neutral-900/50 hover:bg-[#DC7331] hover:border-[#DC7331] text-white px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl font-bold text-xs tracking-widest uppercase shadow-lg transition-all duration-300 w-full md:w-auto"
                      >
                        <span className="flex items-center gap-3">
                          <LogIn className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" /> 
                          LOGIN KE AKUN
                        </span>
                        <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </motion.a>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className="flex flex-col gap-3 text-sm text-neutral-400"
                    >
                      <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-neutral-500" /><span>+62 831-2552-5115</span></div>
                      <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-neutral-500" /><span>halo@seru.ni</span></div>
                      <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-neutral-500" /><span>Jl. Yos Sudarso, Jakarta Utara</span></div>
                    </motion.div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Cinematic Loader for Login Navigation */}
      {navigatingLogin && <CinematicLoader />}
    </>
  );
}