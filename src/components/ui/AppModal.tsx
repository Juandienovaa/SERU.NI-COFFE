"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2 } from "lucide-react";

export type AppModalSize = "sm" | "md" | "lg" | "xl" | "full" | "auto";

export interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: AppModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  actionGroup?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  loading?: boolean;
  disableCloseButton?: boolean;
}

const sizeClasses: Record<AppModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[95vw] md:max-w-[98vw]",
  auto: "max-w-fit"
};

/**
 * Enterprise AppModal
 * Single Source of Truth for all modals.
 * Rendered using Portals to prevent z-index issues.
 */
export const AppModal: React.FC<AppModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  size = "lg",
  children,
  footer,
  actionGroup,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  loading = false,
  disableCloseButton = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEsc, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  if (!mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`relative w-full ${sizeClasses[size]} max-h-[90vh] md:max-h-[95vh] rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()} // Prevent bubbling to backdrop
          >
            {/* Header (Sticky) */}
            {(title || subtitle || showCloseButton) && (
              <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-5 flex items-start justify-between gap-4">
                <div className="flex-1 pr-4 min-w-0">
                  {title && (
                    typeof title === "string" ? (
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight break-words leading-tight">{title}</h2>
                    ) : title
                  )}
                  {subtitle && <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {actionGroup}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      disabled={disableCloseButton}
                      className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0 transition-all duration-200 ${
                        disableCloseButton 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-white/10 hover:scale-105'
                      }`}
                      aria-label="Tutup Modal"
                    >
                      <X className="w-5 h-5 sm:w-5 sm:h-5 text-neutral-300" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Body (Scrollable) */}
            <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 w-full bg-zinc-900 p-6 md:p-8 space-y-6 pb-[env(safe-area-inset-bottom)]">
              {children}
            </div>

            {/* Footer (Sticky) */}
            {footer && (
              <div className="sticky bottom-0 z-20 bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-5 flex flex-col sm:flex-row items-center justify-end gap-3 w-full pb-calc(1.25rem+env(safe-area-inset-bottom))">
                {footer}
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
