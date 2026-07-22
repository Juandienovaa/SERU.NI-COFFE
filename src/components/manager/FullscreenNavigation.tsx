"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import { OverlayMenu } from "./navigation/OverlayMenu";

/**
 * Highly optimized, performance-driven Fullscreen Navigation wrapper.
 * Acts as a single source of truth for the overlay state, scroll locking, 
 * and the ONE floating action button (eliminating the double-close bug).
 */
export const FullscreenNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock Body Scroll (Eliminating background scrolling)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* 
        SINGLE FLOATING ACTION BUTTON 
        Positioned in the Safe Area (env) for Mobile, Fixed Top-Right for Desktop.
        Uses scale and transform to avoid heavy box-shadow/filter animations on hover.
      */}
      <div 
        className="fixed z-[100] top-4 right-4 md:top-8 md:right-8"
        style={{
          paddingTop: 'env(safe-area-inset-top, 16px)',
          paddingRight: 'env(safe-area-inset-right, 16px)'
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close Navigation" : "Open Navigation"}
          className="group relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center overflow-hidden transition-transform duration-300 active:scale-95 hover:bg-white/10"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close-icon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="menu-icon"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Render the heavily optimized overlay menu separately */}
      <AnimatePresence>
        {isOpen && <OverlayMenu onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
};
