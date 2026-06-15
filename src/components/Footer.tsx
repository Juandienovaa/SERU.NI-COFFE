"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import SeruniLogo from "@/components/SeruniLogo";

const Instagram = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function Footer() {
  const line1 = "SEDUH";
  const line2 = "CERITAMU";

  const charTransition = {
    duration: 0.8,
    ease: [0.76, 0, 0.24, 1]
  } as const;

  // === RADAR MANUAL ANTI-GAGAL ===
  const [isTriggered, setIsTriggered] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (isTriggered || !textRef.current) return;
      
      const rect = textRef.current.getBoundingClientRect();
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
      
      // Jika teks sudah masuk area layar ATAU user sudah mentok scroll di paling bawah
      if (rect.top <= window.innerHeight + 150 || isAtBottom) {
        setIsTriggered(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    setTimeout(handleScroll, 200); // Cek langsung saat pertama kali di-load
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isTriggered]);

  return (
    <footer id="kontak" className="relative w-full bg-neutral-950 text-white p-8 sm:p-16 md:p-24 overflow-hidden flex flex-col justify-between min-h-screen">
      
      {/* Top Section: Directory and contacts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 w-full mb-16 relative z-10">
        
        <div className="md:col-span-5 flex flex-col items-start gap-6">
          <div className="flex flex-col items-start gap-2 w-full pt-4">
            <SeruniLogo className="h-24 md:h-32 w-auto object-contain" /> 
            <p className="text-sm md:text-base text-white font-medium leading-relaxed max-w-sm mt-4">
              Jl. Yos Sudarso, Tanjungpinang Bar., Kec. Tanjungpinang Bar., Kota Tanjung Pinang, Kepulauan Riau 29112
            </p>
          </div>
          <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-sm mt-2">
            Menghubungkan penikmat rasa dengan biji kopi terbaik Nusantara lewat kenyamanan armada jalanan. Tanpa sekat, tanpa batas.
          </p>
        </div>

        <div className="md:col-span-3 flex flex-col gap-4">
          <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
            NAVIGASI
          </span>
          <ul className="flex flex-col gap-2.5 text-sm text-neutral-300">
            <li><a href="/" className="hover:text-[#DC7331] transition-colors">Beranda</a></li>
            <li><a href="/produk" className="hover:text-[#DC7331] transition-colors">Menu Produk</a></li>
            <li><a href="/contact" className="hover:text-[#DC7331] transition-colors">Kontak</a></li>
          </ul>
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
            HUBUNGI KAMI
          </span>
          <div className="flex flex-col gap-3 text-sm text-neutral-300">
            <p className="font-light">
              Punya pertanyaan atau ingin bermitra dengan armada gerobak seru.ni?
            </p>
            <a 
              href="https://wa.me/6283125525115"
              className="inline-flex items-center gap-2 text-[#DC7331] font-semibold group hover:text-white transition-colors mt-1"
            >
              <span>Hubungi via WhatsApp</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>
        </div>

      </div>

      {/* Center Section: Massive Staggered Scroll Reveal Text */}
      <div ref={textRef} className="my-auto py-12 flex flex-col items-center justify-center text-center select-none w-full border-t border-b border-neutral-900">
        
        {/* Line 1: SEDUH */}
        <div className="overflow-hidden h-20 sm:h-32 md:h-44 flex items-center justify-center">
          <h2 className="text-[14vw] font-black tracking-tighter leading-none flex text-white/95">
            {line1.split("").map((char, idx) => (
              <motion.span
                key={idx}
                initial={{ y: "100%" }}
                // Animasi trigger diubah menjadi pakai state manual (isTriggered)
                animate={{ y: isTriggered ? "0%" : "100%" }}
                transition={{ ...charTransition, delay: idx * 0.08 }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </h2>
        </div>

        {/* Line 2: CERITAMU */}
        <div className="overflow-hidden h-20 sm:h-32 md:h-44 flex items-center justify-center">
          <h2 className="text-[14vw] font-black tracking-tighter leading-none flex text-[#DC7331]">
            {line2.split("").map((char, idx) => (
              <motion.span
                key={idx}
                initial={{ y: "100%" }}
                animate={{ y: isTriggered ? "0%" : "100%" }}
                transition={{ ...charTransition, delay: 0.2 + idx * 0.08 }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </h2>
        </div>

      </div>

      {/* Bottom Section: Copyright and meta */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 pt-12 text-[10px] text-neutral-500 tracking-widest uppercase border-t border-neutral-900 relative z-10">
        <div className="flex gap-4">
          <a href="#" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Instagram className="w-3 h-3" />
            <span>INSTAGRAM</span>
          </a>
          <a href="https://wa.me/6283125525115" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <MessageSquare className="w-3 h-3" />
            <span>WHATSAPP</span>
          </a>
        </div>
        
        <span>Copyright © Seru.ni Coffee. All rights reserved.</span>
        
        <span>DESIGNED BY TEAM 13</span>
      </div>

      {/* Subtle bottom absolute glow background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-40 bg-[#DC7331]/5 rounded-full blur-[100px] pointer-events-none" />

    </footer>
  );
}