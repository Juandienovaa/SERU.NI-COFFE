"use client";

import React from "react";
import { Clock, MapPin, User, ShieldCheck, Calendar } from "lucide-react";

interface ShiftInfoSectionProps {
  shiftName: string;
  cashierName: string;
  locationName: string;
  openTime: string;
  closeTime: string;
}

export default function ShiftInfoSection({
  shiftName,
  cashierName,
  locationName,
  openTime,
  closeTime,
}: ShiftInfoSectionProps) {
  const formatTime = (isoString: string) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB";
    } catch (e) {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "-";
    }
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 border border-neutral-800/80 rounded-2xl p-5 shadow-inner">
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-neutral-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Sesi Operasional
            </h4>
            <p className="text-sm font-extrabold text-white">{shiftName || "Shift Reguler"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 bg-neutral-800/60 px-3 py-1.5 rounded-full border border-neutral-700/50">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span>{formatDate(openTime)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-black/40 rounded-xl p-3 border border-neutral-800/40">
          <div className="flex items-center gap-1.5 text-neutral-400 font-bold mb-1">
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span>Kasir Bertugas</span>
          </div>
          <p className="text-white font-black text-sm truncate">{cashierName || "Crew Member"}</p>
        </div>

        <div className="bg-black/40 rounded-xl p-3 border border-neutral-800/40">
          <div className="flex items-center gap-1.5 text-neutral-400 font-bold mb-1">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span>Gerobak / Lokasi</span>
          </div>
          <p className="text-white font-black text-sm truncate">{locationName || "Seruling Pasar"}</p>
        </div>

        <div className="bg-black/40 rounded-xl p-3 border border-neutral-800/40">
          <div className="flex items-center gap-1.5 text-neutral-400 font-bold mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Waktu Buka Shift</span>
          </div>
          <p className="text-emerald-400 font-extrabold text-sm font-mono">{formatTime(openTime)}</p>
        </div>

        <div className="bg-black/40 rounded-xl p-3 border border-neutral-800/40">
          <div className="flex items-center gap-1.5 text-neutral-400 font-bold mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Waktu Penutupan</span>
          </div>
          <p className="text-amber-400 font-extrabold text-sm font-mono">{formatTime(closeTime)}</p>
        </div>
      </div>
    </div>
  );
}
