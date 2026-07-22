import React from "react";
import { supabase } from "@/lib/supabase";
import DashboardClient from "./DashboardClient";

// Forcing dynamic to ensure we always fetch fresh data for dashboard
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ManagerDashboardPage() {
  // Concurrent Fetching (Promise.all)
  const RAW_CUP_PRODUCT_ID = 9999;
  
  const [
    { data: batches },
    { data: rawInventory },
    { data: finishedProducts }
  ] = await Promise.all([
    supabase.from("production_batches").select("status, raw_cups_given, defect_cups, created_at"),
    supabase.from("product_inventory").select("current_stock").eq("product_id", RAW_CUP_PRODUCT_ID).single(),
    supabase.from("product_inventory").select("current_stock").neq("product_id", RAW_CUP_PRODUCT_ID)
  ]);

  return (
    <DashboardClient 
      initialBatches={batches || []}
      initialRawInventory={rawInventory}
      initialFinishedProducts={finishedProducts || []}
      RAW_CUP_PRODUCT_ID={RAW_CUP_PRODUCT_ID}
    />
  );
}
