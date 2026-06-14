"use client";

import { motion } from "framer-motion";
import { Sparkles, Heart, Coffee } from "lucide-react";

const marqueeItems = [
  "SERU.NI",
  "SELALU ADA CERITA DI SETIAP SEDUHAN",
  "KOPI JALANAN PREMIUM",
  "KUALITAS TANPA SEKAT",
  "HARGA MERAKYAT",
  "AMUNISI HARIMU",
];

export default function BrandMarquee() {
  // Duplikat konten banyak agar bisa melakukan seamless loop 0% -> -50%
  const doubledItems = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <div className="w-full bg-neutral-900 py-6 md:py-8 border-y border-neutral-800 overflow-hidden select-none isolate">
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 90, repeat: Infinity }}
        className="flex whitespace-nowrap w-max"
      >
        {doubledItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-12 md:gap-24 px-6 md:px-12">
            <span className="text-3xl md:text-5xl font-black italic tracking-[0.1em] text-white uppercase font-sans">
              {item}
            </span>
            {idx % 3 === 0 ? (
              <Sparkles className="w-6 md:w-10 h-6 md:h-10 text-[#DC7331] shrink-0" />
            ) : idx % 3 === 1 ? (
              <Coffee className="w-6 md:w-10 h-6 md:h-10 text-[#DC7331] shrink-0" />
            ) : (
              <Heart className="w-6 md:w-10 h-6 md:h-10 text-[#DC7331] shrink-0 fill-[#DC7331]" />
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}