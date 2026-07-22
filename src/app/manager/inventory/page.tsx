import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { StockManagement } from "@/components/enterprise/inventory/StockManagement";

export default function ManagerInventoryPage() {
  return (
    <div className="w-full">
      <StockManagement />
    </div>
  );
}
