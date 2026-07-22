import React from "react";
import { LiveGerobakAudit } from "@/components/enterprise/LiveGerobakAudit";

export default function ManagerMonitoringPage() {
  return (
    <div className="w-full min-h-screen bg-zinc-950 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 2xl:px-10 py-8">
        <LiveGerobakAudit />
      </div>
    </div>
  );
}
