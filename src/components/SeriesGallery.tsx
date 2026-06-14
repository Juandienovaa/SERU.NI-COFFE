"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface DrinkItem {
  name: string;
  category: string;
  price: string;
  description: string;
  image: string;
  headingColor: string;
}

const drinks: DrinkItem[] = [
  {
    name: "Kopi Susu Seru.ni",
    category: "SIGNATURE SERIES",
    price: "Rp 15.000",
    description: "Perpaduan espresso blend pilihan dengan susu segar dan rahasia manisnya gula aren asli Seru.ni.",
    image: "/produk/kopi susu.png",
    headingColor: "text-amber-500"
  },
  {
    name: "Coklat Seru.ni",
    category: "MILK SERIES",
    price: "Rp 18.000",
    description: "Premium chocolate yang di-blend dengan susu creamy, menghadirkan rasa manis-pahit yang pas dan mewah.",
    image: "/produk/coklat.png",
    headingColor: "text-orange-400"
  },
  {
    name: "Lychea Tea",
    category: "FUSION SERIES",
    price: "Rp 19.000",
    description: "Kesegaran teh premium yang dipadukan dengan sirup leci dan buah leci asli yang manis segar.",
    image: "/produk/lychea tea.png",
    headingColor: "text-emerald-500"
  },
  {
    name: "Matcha Tea",
    category: "DESSERT SERIES",
    price: "Rp 20.000",
    description: "Otentik Japanese matcha dengan racikan susu khusus yang super smooth di setiap sesapan.",
    image: "/produk/matcha.png",
    headingColor: "text-yellow-500"
  }
];

export default function SeriesGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State untuk melacak item yang diklik di HP
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  
  // State untuk melacak hover di PC (buat nampilin kursor melayang)
  const [cursorIdx, setCursorIdx] = useState<number | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section 
      id="seri" 
      ref={containerRef}
      // Diberikan h-[140vh] di HP biar ruang mekarnya sangat lega dan slow
      className="relative w-full h-[140vh] md:h-screen bg-neutral-950 flex flex-col cursor-auto md:cursor-none"
    >
      {/* --- JUDUL SECTION (DIJAMIN GAK NABRAK LOGO NAVBAR) --- */}
      {/* Pakai 'relative' dan padding pt-32 biar dia turun jauh dari batas atas layar */}
      <div className="relative w-full pt-32 md:pt-32 pb-8 px-6 sm:px-12 md:px-16 flex flex-col gap-2 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-6 md:w-8 h-[1px] bg-neutral-500" />
          <span className="text-[10px] md:text-xs font-semibold tracking-widest text-neutral-400 uppercase">
            SERI HIGHLIGHTS
          </span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter-custom text-white leading-tight">
          Pilihan Menu <br className="md:hidden"/> Terbaik Kami
        </h2>
      </div>

      {/* --- KARTU KOPI --- */}
      <div className="w-full flex-1 flex flex-col md:flex-row items-stretch select-none border-t border-neutral-900/50">
        {drinks.map((drink, idx) => {
          const isMobileActive = activeIdx === idx;

          return (
            <div
              key={idx}
              // KLIK DI HP: Toggle state activeIdx
              onClick={() => setActiveIdx(isMobileActive ? null : idx)}
              
              // HOVER DI PC: Set state buat kursor box aja
              onPointerEnter={(e) => { if (e.pointerType === 'mouse') setCursorIdx(idx); }}
              onPointerLeave={(e) => { if (e.pointerType === 'mouse') setCursorIdx(null); }}
              
              // DURASI ANIMASI 1000ms (SANGAT SLOW & SMOOTH)
              className={`relative flex-1 group overflow-hidden transition-all duration-1000 ease-in-out border-b md:border-b-0 md:border-r border-neutral-900/50 
                ${isMobileActive ? 'flex-[3]' : ''} 
                md:hover:flex-[3.5]
              `}
            >
              {/* Gambar Kopi */}
              <Image
                src={drink.image}
                alt={drink.name}
                fill
                className={`object-cover transition-all duration-1000 ease-in-out
                  ${isMobileActive ? 'grayscale-0 scale-100' : 'grayscale scale-110'}
                  md:group-hover:grayscale-0 md:group-hover:scale-100
                `}
                sizes="(max-width: 768px) 100vw, 25vw"
              />

              {/* Shading Gelap */}
              <div className={`absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent transition-opacity duration-1000
                ${isMobileActive ? 'opacity-90' : 'opacity-100'}
                md:group-hover:opacity-60
              `} />

              {/* Judul Minuman (Slide naik pelan pas aktif) */}
              <div className={`absolute left-6 sm:left-10 z-10 flex flex-col gap-1 pointer-events-none transition-all duration-1000
                ${isMobileActive ? 'bottom-28' : 'bottom-6'}
                md:bottom-10 md:group-hover:bottom-32
              `}>
                <span className="text-[10px] md:text-xs tracking-wider text-[#DC7331] font-semibold uppercase drop-shadow-md">
                  {drink.category}
                </span>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                  {drink.name}
                </h3>
              </div>

              {/* DESKRIPSI (FADE IN + SLIDE UP DENGAN DELAY SANGAT SMOOTH) */}
              <div className={`absolute bottom-6 left-6 right-6 sm:left-10 sm:right-10 z-10 flex flex-col gap-2 transition-all duration-1000
                ${isMobileActive ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-8 pointer-events-none'}
                md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:delay-200 md:opacity-0 md:translate-y-8
              `}>
                <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  {drink.description}
                </p>
                <span className="text-sm sm:text-base font-extrabold text-[#DC7331] leading-none">
                  {drink.price}
                </span>
              </div>

              {/* Nomor Index */}
              <div className="absolute top-6 right-6 md:top-8 md:right-8 z-10 pointer-events-none text-xl md:text-2xl font-bold text-white/30 transition-colors duration-1000 md:group-hover:text-white/60">
                {String(idx + 1).padStart(2, "0")}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- KURSOR CUSTOM PC (Sembunyi di layar HP) --- */}
      {cursorIdx !== null && (
        <motion.div
          style={{ x: springX, y: springY, translateX: "-50%", translateY: "-110%" }}
          className="hidden md:flex fixed pointer-events-none z-50 w-72 backdrop-blur-md bg-white/95 border border-neutral-200/60 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex-col gap-3"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-[9px] font-bold tracking-widest text-neutral-400 uppercase">
              {drinks[cursorIdx].category}
            </span>
            <div className="flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
              <span>INFO</span>
              <ArrowUpRight className="w-2.5 h-2.5" />
            </div>
          </div>
          <h4 className={`text-lg font-bold tracking-tight leading-none ${drinks[cursorIdx].headingColor} transition-colors duration-300`}>
            {drinks[cursorIdx].name}
          </h4>
          <span className="text-base font-extrabold text-neutral-900 leading-none">
            {drinks[cursorIdx].price}
          </span>
          <hr className="border-neutral-100" />
          <p className="text-xs text-neutral-600 font-light leading-relaxed">
            {drinks[cursorIdx].description}
          </p>
        </motion.div>
      )}
    </section>
  );
}