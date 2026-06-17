"use client";

import { useState, useRef, useEffect } from "react";
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

  useEffect(() => {
    // Custom cursor logic removed as requested to avoid framer-motion
  }, []);

  return (
    <section 
      id="seri" 
      ref={containerRef}
      className="relative w-full h-[60vh] md:h-screen bg-neutral-950 flex flex-col cursor-auto"
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
      <div className="w-full flex-1 flex flex-row items-stretch select-none border-t border-neutral-900/50">
        {drinks.map((drink, idx) => {
          const isMobileActive = activeIdx === idx;

          return (
            <div
              key={idx}
              onClick={() => setActiveIdx(isMobileActive ? null : idx)}
              onPointerEnter={(e) => { if (e.pointerType === 'mouse') setCursorIdx(idx); }}
              onPointerLeave={(e) => { if (e.pointerType === 'mouse') setCursorIdx(null); }}
              className={`relative flex-1 group overflow-hidden transition-all duration-300 ease-in-out md:border-r border-neutral-900/50 hover:flex-[3.5] ${isMobileActive ? 'flex-[3]' : ''}`}
            >
              {/* Gambar Kopi */}
              <Image
                src={drink.image}
                alt={drink.name}
                fill
                className={`object-cover transition-all duration-300 ease-in-out md:grayscale md:scale-110 md:group-hover:grayscale-0 md:group-hover:scale-100 ${isMobileActive ? 'grayscale-0 scale-100' : ''}`}
                sizes="(max-width: 768px) 100vw, 25vw"
              />

              {/* Shading Gelap */}
              <div className={`absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent transition-opacity duration-300 md:opacity-100 md:group-hover:opacity-60 ${isMobileActive ? 'opacity-90' : 'opacity-100'}`} />

              {/* Judul Minuman */}
              <div className={`absolute left-2 right-2 sm:left-10 z-10 flex flex-col gap-0.5 md:gap-1 pointer-events-none transition-all duration-300 md:bottom-10 md:group-hover:bottom-32 ${isMobileActive ? 'bottom-20 md:bottom-28' : 'bottom-4 md:bottom-6'}`}>
                <span className="text-[6px] md:text-xs tracking-wider text-[#DC7331] font-bold uppercase drop-shadow-md">
                  {drink.category}
                </span>
                <h3 className={`font-black text-white tracking-tight leading-tight drop-shadow-lg transition-all duration-300 ${isMobileActive ? 'text-xs md:text-3xl' : 'text-[8px] md:text-3xl'} sm:text-2xl`}>
                  {drink.name}
                </h3>
              </div>

              {/* DESKRIPSI */}
              <div className={`absolute bottom-4 left-2 right-2 sm:left-10 sm:right-10 z-10 flex flex-col gap-1 md:gap-2 transition-all duration-300 md:opacity-0 md:translate-y-8 md:group-hover:opacity-100 md:group-hover:translate-y-0 ${isMobileActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                <p className="text-xs md:text-sm text-neutral-300 font-light leading-relaxed line-clamp-2 md:line-clamp-none">
                  {drink.description}
                </p>
                <span className="text-[10px] sm:text-base font-extrabold text-[#DC7331] leading-none">
                  {drink.price}
                </span>
              </div>

              {/* Nomor Index */}
              <div className="absolute top-2 right-2 md:top-8 md:right-8 z-10 pointer-events-none text-xs md:text-2xl font-bold text-white/30 transition-colors duration-300 md:group-hover:text-white/60">
                {String(idx + 1).padStart(2, "0")}
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}