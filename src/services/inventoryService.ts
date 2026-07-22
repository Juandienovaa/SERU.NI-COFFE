import { supabase } from "@/lib/supabase";
import { inventoryRepository } from "@/repositories/InventoryRepository";
import { ProductInventoryItem, InventorySummaryStats } from "@/types/inventory";

// RESTORED INDIVIDUAL EXPORTS FOR FRONTEND USE
export async function getSmartInventory(): Promise<ProductInventoryItem[]> {
  const rawData = await inventoryRepository.getAllInventory();
  return rawData.map(item => {
    let statusLevel: any = "HEALTHY";
    let statusText = "Ready";
    let statusColorClass = "text-emerald-500";
    let badgeBgClass = "bg-emerald-500/10";
    let badgeBorderClass = "border-emerald-500/20";
    
    const stock = item.current_stock || 0;
    const min = item.minimum_stock || 15; // default 15
    
    if (stock === 0) {
      statusLevel = "OUT_OF_STOCK";
      statusText = "Habis";
      statusColorClass = "text-red-500";
      badgeBgClass = "bg-red-500/10";
      badgeBorderClass = "border-red-500/20";
    } else if (stock <= min) {
      statusLevel = "LOW_STOCK";
      statusText = "Low";
      statusColorClass = "text-orange-500";
      badgeBgClass = "bg-orange-500/10";
      badgeBorderClass = "border-orange-500/20";
    }

    return {
      ...item,
      statusLevel,
      statusText,
      statusColorClass,
      badgeBgClass,
      badgeBorderClass,
      progressPercentage: Math.min(100, (stock / Math.max(1, item.maximum_stock || 100)) * 100),
      priorityScore: 0,
      priorityLevel: "SUFFICIENT" as any,
      priorityBadgeText: "OK",
      mrpRecommendation: {
        recommendedCups: 0,
        actionText: "Aman",
        reason: "-",
        priorityLevel: "SUFFICIENT" as any
      }
    } as ProductInventoryItem;
  });
}
  
export function computeSummaryStats(items: ProductInventoryItem[]): InventorySummaryStats {
  let totalFinishedCups = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;
  let mediumStockCount = 0;
  let healthyCount = 0;
  let overstockCount = 0;

  items.forEach(item => {
    totalFinishedCups += item.current_stock;
    if (item.statusLevel === "OUT_OF_STOCK") outOfStockCount++;
    else if (item.statusLevel === "LOW_STOCK") lowStockCount++;
    else healthyCount++;
  });

  return {
    totalFinishedCups,
    totalProductsCount: items.length,
    outOfStockCount,
    lowStockCount,
    mediumStockCount,
    healthyCount,
    overstockCount,
    lastSyncedAt: new Date().toISOString()
  };
}

/**
 * Enterprise Inventory Service
 * Handling Atomic Transactions & Shift Inventory
 */

// Allocate Master Inventory to Shift Inventory via RPC
export async function allocateShiftInventory(shiftId: string, productId: number, qty: number) {
  const { error } = await supabase.rpc("rpc_allocate_inventory", {
    p_shift_id: shiftId,
    p_product_id: productId,
    p_qty: qty
  });
  if (error) {
    console.error(`[InventoryService] Error allocating stock for product ${productId}:`, error.message);
    throw error;
  }
}

// Close Shift and Return Remaining Stock via RPC
export async function closeShiftInventory(shiftId: string) {
  const { error } = await supabase.rpc("rpc_close_shift", {
    p_shift_id: shiftId
  });
  if (error) {
    console.error(`[InventoryService] Error closing shift inventory for shift ${shiftId}:`, error.message);
    throw error;
  }
}

// Fetch realtime shift inventory
export async function getLiveShiftInventory(shiftId: string) {
  const { data, error } = await supabase
    .from("shift_inventory")
    .select("*")
    .eq("shift_id", shiftId);
    
  if (error) throw error;
  return data || [];
}
