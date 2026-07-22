"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check, Sun, Moon, Car, MapPin } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface LocationOptionGroup {
  id: string;
  label: string;
  badgeText: string;
  badgeColor: string;
  icon: React.ReactNode;
  locations: string[];
}

export interface LocationDropdownProps {
  selectedValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

const LOCATION_GROUPS: LocationOptionGroup[] = [
  {
    id: "pagi",
    label: "Shift Pagi",
    badgeText: "☀️ SHIFT PAGI",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: <Sun className="w-3.5 h-3.5 text-amber-400" />,
    locations: [
      "Seruling Pasar",
      "Seruling Pasar Raya",
      "Seruling Imigrasi",
      "Seruling Ramayana",
      "Seruling Taman Batu 10",
      "Seruling Pagi (Al Baiq Batu 8)",
    ],
  },
  {
    id: "malam",
    label: "Shift Malam",
    badgeText: "🌙 SHIFT MALAM",
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    icon: <Moon className="w-3.5 h-3.5 text-blue-400" />,
    locations: [
      "Seruling 1 (Depan Gedung Gonggong)",
      "Seruling 2",
      "Seruling 3 (Depan Gedung Daerah)",
      "Seruling 4 (Depan RRI / Imigrasi)",
      "Seruling 5 (Ganet)",
      "Seruling 6 (Al-Baiq Batu 8)",
    ],
  },
  {
    id: "lainnya",
    label: "Lainnya",
    badgeText: "🚗 LAINNYA",
    badgeColor: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    icon: <Car className="w-3.5 h-3.5 text-zinc-400" />,
    locations: ["Tuk-tuk Seruni"],
  },
];

export const LocationDropdown: React.FC<LocationDropdownProps> = ({
  selectedValue,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Deteksi klik di luar untuk menutup dropdown tanpa re-render berlebih
  useClickOutside(containerRef, useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]));

  // Flatten locations untuk kemudahan navigasi keyboard ArrowUp / ArrowDown
  const flattenedLocations = useMemo(() => {
    const list: { location: string; group: LocationOptionGroup }[] = [];
    LOCATION_GROUPS.forEach((g) => {
      g.locations.forEach((loc) => {
        list.push({ location: loc, group: g });
      });
    });
    return list;
  }, []);

  // Temukan metadata grup dari lokasi yang saat ini terpilih
  const activeGroupMeta = useMemo(() => {
    if (!selectedValue) return null;
    return flattenedLocations.find((item) => item.location === selectedValue)?.group || null;
  }, [selectedValue, flattenedLocations]);

  // Handle pemilihan item
  const handleSelectItem = useCallback((location: string) => {
    onSelect(location);
    setIsOpen(false);
  }, [onSelect]);

  // Sync focused index saat dropdown dibuka
  useEffect(() => {
    if (isOpen) {
      const idx = flattenedLocations.findIndex((i) => i.location === selectedValue);
      setFocusedIndex(idx >= 0 ? idx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, selectedValue, flattenedLocations]);

  // Keyboard navigation engine (ArrowDown, ArrowUp, Enter, Escape, Space)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < flattenedLocations.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : flattenedLocations.length - 1));
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < flattenedLocations.length) {
        handleSelectItem(flattenedLocations[focusedIndex].location);
      }
    }
  };

  // Scroll otomatis ke item yang sedang fokus via keyboard
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${focusedIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div ref={containerRef} className="relative w-full text-left select-none z-30">
      {/* Trigger Button (Min Height 56px, Touch-friendly, Glassmorphism) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="location-dropdown-list"
        aria-label="Pilih lokasi outlet atau gerobak shift Anda"
        className={`w-full min-h-[56px] rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer backdrop-blur-xl border ${
          isOpen
            ? "bg-zinc-900/95 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.18)]"
            : "bg-zinc-950/80 hover:bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 shadow-xl"
        } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`}
      >
        <div className="flex flex-col text-left truncate flex-1">
          {selectedValue ? (
            <>
              <span className="font-heading font-bold text-white text-base sm:text-lg leading-tight truncate">
                {selectedValue}
              </span>
              {activeGroupMeta && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${activeGroupMeta.badgeColor}`}>
                    {activeGroupMeta.icon}
                    {activeGroupMeta.badgeText}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <span className="font-body font-semibold text-zinc-400 text-sm sm:text-base leading-tight">
                Pilih Titik Outlet / Gerobak
              </span>
              <span className="text-[11px] text-zinc-600 tracking-wide mt-0.5">
                Tekan untuk memilih titik gerobak shift Anda
              </span>
            </>
          )}
        </div>

        {/* Animated Chevron Indicator */}
        <div className="w-8 h-8 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center shrink-0 text-zinc-400">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </button>

      {/* Floating Dropdown Panel (Max Height 320px, Apple / Stripe Hierarchy) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="location-dropdown-list"
            role="listbox"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col"
          >
            {/* Scrollable List Container */}
            <div
              ref={listRef}
              className="max-h-[320px] overflow-y-auto p-2.5 space-y-4 divide-y divide-zinc-900/50 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
            >
              {LOCATION_GROUPS.map((group) => (
                <div key={group.id} className="pt-2 sm:pt-3 first:pt-1">
                  {/* Apple Settings Style Group Header */}
                  <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 select-none">
                    {group.icon}
                    <span>{group.label}</span>
                  </div>

                  {/* Group Items */}
                  <div className="space-y-1">
                    {group.locations.map((location) => {
                      const isSelected = selectedValue === location;
                      const globalIdx = flattenedLocations.findIndex((i) => i.location === location);
                      const isFocused = focusedIndex === globalIdx;

                      return (
                        <motion.button
                          key={location}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          data-index={globalIdx}
                          onClick={() => handleSelectItem(location)}
                          whileTap={{ scale: 0.985 }}
                          className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between transition-all duration-150 group cursor-pointer focus:outline-none ${
                            isSelected
                              ? "bg-orange-500/15 border border-orange-500/35 text-white font-bold shadow-[inset_3px_0_0_#f97316]"
                              : isFocused
                              ? "bg-zinc-800/80 text-white font-semibold"
                              : "hover:bg-zinc-800/50 text-zinc-300 font-medium hover:text-white"
                          }`}
                        >
                          <div className="flex flex-col truncate pr-3">
                            <span className="text-sm sm:text-base tracking-tight truncate">
                              {location}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-wider font-semibold ${
                                isSelected ? "text-orange-400" : "text-zinc-600 group-hover:text-zinc-500"
                              }`}
                            >
                              {group.label}
                            </span>
                          </div>

                          {/* Check Icon / Status Indicator */}
                          <div className="shrink-0 flex items-center">
                            {isSelected ? (
                              <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-sm shadow-orange-500/30">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-zinc-600 transition-colors" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Footer Tip */}
            <div className="px-4 py-2.5 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 select-none">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-orange-500/70" />
                Daftar Gerobak Aktif
              </span>
              <span className="hidden sm:inline text-zinc-600">
                Gunakan ↑↓ untuk navigasi
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
