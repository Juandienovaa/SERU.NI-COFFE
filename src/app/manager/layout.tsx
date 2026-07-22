import React from "react";
import { FullscreenNavigation } from "@/components/manager/FullscreenNavigation";
import { PageTransition } from "@/components/manager/PageTransition";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col relative selection:bg-orange-500/30">
      <FullscreenNavigation />
      
      {/* Full-width Main Content */}
      <main className="flex-1 w-full bg-[#09090B] min-h-screen relative overflow-x-hidden">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
