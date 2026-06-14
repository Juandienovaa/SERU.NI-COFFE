"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, AnimatePresence } from "framer-motion";

export default function SequenceScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // STATE BARU: Buat deteksi apakah user udah mulai scroll
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY, scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    restDelta: 0.001,
  });

  const totalFrames = 193;
  const currentFrame = useTransform(smoothProgress, [0, 1], [1, totalFrames]);

  // SCROLL OPACITY MAPPINGS UNTUK DYNAMIC OVERLAYS
  const opacity1 = useTransform(smoothProgress, [0.2, 0.25, 0.35, 0.4], [0, 1, 1, 0]);
  const opacity2 = useTransform(smoothProgress, [0.5, 0.55, 0.65, 0.7], [0, 1, 1, 0]);

  // SENSOR SCROLL: Kalau udah lewat 50px, state berubah jadi true
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50 && !isScrolled) setIsScrolled(true);
    if (latest <= 50 && isScrolled) setIsScrolled(false);
  });

  useEffect(() => {
    const totalFrames = 193;
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalFrames) {
        setImagesLoaded(true);
      }
    };

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameIndex = String(i).padStart(3, "0");
      img.src = `/sequence/ezgif-frame-${frameIndex}.jpg`;
      img.onload = handleImageLoad;
      img.onerror = handleImageLoad; 
      loadedImages[i] = img;
    }

    imagesRef.current = loadedImages;
  }, []);

  const drawImageToCanvas = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const frameIdx = Math.max(1, Math.min(totalFrames, Math.round(frameIndex)));
    const img = imagesRef.current[frameIdx];

    if (!context || !img || !img.complete) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let drawX = 0;
    let drawY = 0;

    if (canvasRatio > imgRatio) {
      drawHeight = canvasWidth / imgRatio;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawX = (canvasWidth - drawWidth) / 2;
    }

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const currentVal = currentFrame.get();
      drawImageToCanvas(currentVal);
    };

    window.addEventListener("resize", handleResize);
    if (imagesLoaded) {
      setTimeout(handleResize, 100);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [imagesLoaded]);

  useMotionValueEvent(currentFrame, "change", (latest) => {
    if (imagesLoaded) {
      drawImageToCanvas(latest);
    }
  });

  useEffect(() => {
    if (imagesLoaded) {
      drawImageToCanvas(1);
    }
  }, [imagesLoaded]);

  return (
    <div ref={containerRef} className="relative w-full h-[400vh] bg-[#171717] overflow-visible">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center bg-[#171717] overflow-hidden">
        
        <canvas
          ref={canvasRef}
          className="w-full h-full block object-cover transform-gpu will-change-contents"
        />

        {/* OVERLAY GUIDE YANG SUPER RINGAN (Fades out otomatis begitu user nyentuh scroll) */}
        <AnimatePresence>
          {imagesLoaded && !isScrolled && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none bg-black/40"
            >
              <div className="flex flex-col items-center justify-center mt-[-15vh] md:mt-[-15vh] px-4">
                <h1 className="text-[25vw] md:text-[18vw] lg:text-[16vw] leading-[0.8] font-black tracking-tighter uppercase text-center flex flex-col">
                  <span className="text-white drop-shadow-2xl">
                    SERU.NI
                  </span>
                  <span className="text-[#EA580C] drop-shadow-2xl">
                    COFFEE
                  </span>
                </h1>
              </div>

              {/* FLOATING SCROLL INDICATOR (Ala Apple) - DIPERBESAR */}
              <div className="absolute bottom-6 md:bottom-12 flex flex-col items-center gap-4 bg-black/40 backdrop-blur-md px-8 py-5 rounded-[40px] border border-white/20 shadow-2xl">
                <span className="text-xs sm:text-sm font-bold tracking-[0.25em] text-white uppercase drop-shadow-md">
                  Geser Untuk Mulai
                </span>
                <div className="w-7 h-12 border-[3px] border-white/70 rounded-full flex justify-center p-1.5 shadow-inner">
                  <motion.div 
                    animate={{ y: [0, 16, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1.5 h-3.5 bg-[#EA580C] rounded-full shadow-[0_0_10px_rgba(234,88,12,0.8)]" 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OVERLAY 1 (KIRI - 30% SCROLL) */}
        <motion.div
          style={{ opacity: opacity1 }}
          className="absolute top-[35%] md:top-[40%] left-[5%] md:left-[8%] transform -translate-y-1/2 z-30 pointer-events-none w-[90%] md:w-auto"
        >
          <h2 className="text-[13vw] sm:text-6xl md:text-6xl lg:text-7xl xl:text-[6.5rem] font-black tracking-tighter leading-[0.85] drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
            <span className="text-white">Siap</span><br />
            <span className="text-[#EA580C]">menemanimu</span>
          </h2>
        </motion.div>

        {/* OVERLAY 2 (KANAN - 60% SCROLL) */}
        <motion.div
          style={{ opacity: opacity2 }}
          className="absolute top-[65%] md:top-[50%] right-[5%] md:right-[8%] transform -translate-y-1/2 z-30 pointer-events-none text-right w-[90%] md:w-auto"
        >
          <h2 className="text-[14vw] sm:text-6xl md:text-6xl lg:text-7xl xl:text-[6.5rem] font-black tracking-tighter leading-[0.85] drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
            <span className="text-white">Sepanjang</span><br />
            <span className="text-[#EA580C]">hari</span>
          </h2>
        </motion.div>

        {!imagesLoaded && (
          <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center z-20">
            <span className="text-[#EA580C] font-bold text-sm tracking-widest uppercase animate-pulse">
              MENYIAPKAN PENGALAMAN...
            </span>
          </div>
        )}
        
      </div>
    </div>
  );
}