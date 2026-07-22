"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Montserrat, Playfair_Display } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "900"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["italic", "normal"] });

interface SlideData {
  id: number;
  image: string;
  headlinePart1: string;
  headlinePart2: string;
  subheadline: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    image: "/hero-satu.jpeg",
    headlinePart1: "STOCK UP,",
    headlinePart2: "slow down.",
    subheadline: "Nikmati momen terbaik dengan kopi premium dari barista profesional."
  },
  {
    id: 2,
    image: "/hero-dua.png",
    headlinePart1: "SIAP MENEMANIMU",
    headlinePart2: "kapan pun.",
    subheadline: "Seru.ni Coffee hadir untuk melengkapi setiap aktivitas harianmu."
  },
  {
    id: 3,
    image: "/hero-tiga.png",
    headlinePart1: "DELIVERY SUPER",
    headlinePart2: "cepat.",
    subheadline: "Pesanan diantar langsung oleh crew kami dengan estimasi realtime."
  },
  {
    id: 4,
    image: "/hero-empat.jpeg",
    headlinePart1: "CITA RASA TAK",
    headlinePart2: "terlupakan.",
    subheadline: "Pilihan biji kopi terbaik yang disangrai dengan presisi tinggi."
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full h-[90vh] md:h-screen overflow-hidden bg-black font-sans">
      
      {/* Slides Container */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Image */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={slide.image}
              alt={slide.headlinePart1}
              fill
              priority={index === 0}
              className="object-cover object-center"
              quality={90}
            />
          </div>
          
          {/* Overlay Gradient (Bottom to Top and Left for better text readability) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center items-start px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl">
          
          {/* Headline with High Contrast (Editorial Style) */}
          <h1 className="flex flex-col mb-4 md:mb-6 leading-[1.05] md:leading-[0.95] drop-shadow-2xl">
            <span className={`${montserrat.className} text-white text-5xl md:text-7xl lg:text-[100px] font-black uppercase tracking-tighter`}>
              {SLIDES[currentSlide].headlinePart1}
            </span>
            <span className={`${playfair.className} text-orange-500 text-5xl md:text-7xl lg:text-[100px] font-medium lowercase italic mt-0 md:-mt-2 lg:-mt-4`}>
              {SLIDES[currentSlide].headlinePart2}
            </span>
          </h1>
          
          {/* Sub-headline */}
          <p className={`${montserrat.className} text-gray-300 text-xs md:text-sm uppercase tracking-widest max-w-lg mb-2 font-semibold drop-shadow-lg leading-relaxed`}>
            {SLIDES[currentSlide].subheadline}
          </p>
          
          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
            <Link
              href="/menu-online"
              className={`${montserrat.className} w-full sm:w-auto px-10 py-4 bg-orange-500 text-white rounded-none font-bold text-xs md:text-sm text-center transition-all hover:bg-orange-600 active:scale-95 uppercase tracking-wide shadow-xl shadow-orange-500/20`}
            >
              PESAN SEKARANG
            </Link>
            <Link
              href="/menu-online"
              className={`${montserrat.className} w-full sm:w-auto px-10 py-4 border border-white/50 text-white bg-transparent rounded-none font-bold text-xs md:text-sm text-center transition-all hover:bg-white/10 active:scale-95 uppercase tracking-wide backdrop-blur-sm`}
            >
              LIHAT MENU
            </Link>
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-3">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-12 h-1.5 transition-all duration-300 ${
              index === currentSlide ? "bg-orange-500" : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

    </section>
  );
}
