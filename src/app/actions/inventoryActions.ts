"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { ActionResponse } from "@/types/action-response";
import { logAudit } from "./auditActions";

export async function allocateShiftInventory(
  shiftId: string,
  productId: number,
  qty: number,
  userId?: string
): Promise<ActionResponse> {
  try {
    const supabase = createAdminClient();
    
    // Gunakan RPC yang sudah ada untuk alokasi (Atomic transaction)
    const { error } = await supabase.rpc("rpc_allocate_inventory", {
      p_shift_id: shiftId,
      p_product_id: productId,
      p_qty: qty
    });

    if (error) throw error;

    await logAudit(userId || null, null, shiftId, "ALLOCATE_INVENTORY", { productId, qty });

    return { success: true };
  } catch (err: any) {
    console.error("[allocateShiftInventory] Error:", err);
    return { success: false, message: err.message };
  }
}

export async function closeShiftInventoryAction(shiftId: string, userId?: string): Promise<ActionResponse> {
  try {
    const supabase = createAdminClient();
    
    // Gunakan RPC yang sudah ada untuk pengembalian stok
    const { error } = await supabase.rpc("rpc_close_shift", {
      p_shift_id: shiftId
    });

    if (error) throw error;

    await logAudit(userId || null, null, shiftId, "CLOSE_SHIFT_INVENTORY", {});

    return { success: true };
  } catch (err: any) {
    console.error("[closeShiftInventoryAction] Error:", err);
    return { success: false, message: err.message };
  }
}

export async function transferAdditionalStockAction(shiftId: string, productId: number, requestedQty: number, crewName: string, userId?: string): Promise<ActionResponse<any>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("rpc_mid_shift_refill", { p_shift_id: shiftId, p_product_id: productId, p_qty: requestedQty, p_crew_name: crewName });
    if (error) throw error;
    const { data: shift } = await supabase.from("shifts").select("inventory_data").eq("id", shiftId).single();
    const updatedInventory = (shift?.inventory_data || []).map((item: any) => {
      if (Number(item.product_id) === Number(productId)) return { ...item, sisa: Number(item.sisa || 0) + requestedQty, added_stock: Number(item.added_stock || 0) + requestedQty };
      return item;
    });
    await supabase.from("shifts").update({ inventory_data: updatedInventory }).eq("id", shiftId);
    await logAudit(userId || null, null, shiftId, "TRANSFER_STOCK", { productId, requestedQty });
    return { success: true, data: updatedInventory };
  } catch (err: any) { return { success: false, message: err.message }; }
}
