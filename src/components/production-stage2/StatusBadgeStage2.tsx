"use client";

import React from "react";

interface StatusBadgeStage2Props {
  status: string;
}

/**
 * Komponen Badge Status bergaya Apple/Linear untuk antrean tiket & workspace Stage 2.
 */
export default function StatusBadgeStage2({ status }: StatusBadgeStage2Props) {
  const norm = status ? status.toUpperCase() : "PENDING_BARISTA";

  if (norm === "PENDING_BARISTA" || norm === "PENDING") {
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-[10px] uppercase tracking-wider select-none shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
        </span>
        <span>Pending Barista</span>
      </div>
    );
  }

  if (norm === "COMPLETED" || norm === "SELESAI") {
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider select-none shrink-0">
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        <span>Completed</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 font-bold text-[10px] uppercase tracking-wider select-none shrink-0">
      <span className="h-2 w-2 rounded-full bg-neutral-500"></span>
      <span>{status || "Unknown"}</span>
    </div>
  );
}
