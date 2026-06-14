"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const totalFrames = 193;
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    // Preload images
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      // Format number to 3 digits (e.g., 001, 012, 193)
      const frameIndex = String(i).padStart(3, "0");
      img.src = `/sequence/ezgif-frame-${frameIndex}.jpg`;
      
      const handleLoad = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / totalFrames) * 100);
        setProgress(percent);
        
        if (loadedCount === totalFrames) {
          setTimeout(() => {
            setIsLoaded(true);
            setTimeout(onComplete, 800); // Allow exit animation to complete before telling the parent
          }, 800);
        }
      };

      img.onload = handleLoad;
      img.onerror = handleLoad; // Tetap lanjut walaupun ada frame gagal load
      images.push(img);
    }
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ y: "-100vh" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] bg-neutral-950 text-white overflow-hidden select-none"
        >
          {/* --- TOP HEADER (Kiri: Brand, Kanan: Tahun) --- */}
          <div className="absolute top-8 left-6 md:top-12 md:left-12 right-6 md:right-12 flex justify-between items-start z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex flex-col gap-1"
            >
              <span className="text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase text-white">
                SERU.NI
              </span>
              <span className="text-[9px] md:text-[10px] tracking-widest text-neutral-500 uppercase">
                Edisi Premium
              </span>
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-[10px] md:text-xs tracking-[0.2em] font-bold uppercase text-neutral-500"
            >
              SEJAK 2026
            </motion.span>
          </div>

          {/* --- CENTER: MASSIVE COUNTER & SUBTITLE --- */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
              className="flex items-baseline"
            >
              <span className="text-[35vw] md:text-[20vw] font-black tracking-tighter leading-none text-white drop-shadow-2xl">
                {progress}
              </span>
              <span className="text-[10vw] md:text-[5vw] font-black text-[#DC7331] leading-none">
                %
              </span>
            </motion.div>
            
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.76, 0, 0.24, 1] }}
              className="text-[10px] md:text-xs font-light tracking-[0.5em] md:tracking-[0.8em] uppercase text-neutral-400 mt-2 md:mt-4 ml-2 md:ml-4 text-center"
            >
              Menyeduh Cerita...
            </motion.span>
          </div>

          {/* --- BOTTOM INFO (Teks Kiri & Kanan di atas Progress Bar) --- */}
          <div className="absolute bottom-10 md:bottom-12 left-6 md:left-12 right-6 md:right-12 flex justify-between items-end z-10">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500">
                Status Sistem
              </span>
              <span className="text-xs md:text-sm font-medium tracking-widest text-white uppercase animate-pulse">
                Mengekstrak Rasa
              </span>
            </div>
            
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500">
                Memuat Aset
              </span>
              <span className="text-xs md:text-sm font-bold tracking-widest text-white">
                {String(progress).padStart(3, "0")} / 100
              </span>
            </div>
          </div>

          {/* --- ABSOLUTE BOTTOM PROGRESS BAR --- */}
          <div className="absolute bottom-0 left-0 w-full h-1 md:h-1.5 bg-neutral-900 z-20">
            <motion.div
              className="h-full bg-[#DC7331] origin-left"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.1 }}
            />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}