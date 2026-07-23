"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { ActionResponse } from "@/types/action-response";
import { logAudit } from "./auditActions";
import { allocateShiftInventory, closeShiftInventoryAction } from "./inventoryActions";

export async function openShift(
  userId: string,
  crewName: string,
  outletId: string,
  shiftType: "pagi" | "malam",
  inventoryData: any[]
): Promise<ActionResponse<any>> {
  if (!userId) {
    return { success: false, message: "ID User tidak valid untuk membuka shift." };
  }
  
  try {
    const supabase = createAdminClient();
    
    const insertData: any = { 
      user_id: userId,
      crew_name: crewName,
      outlet_id: outletId, 
      shift_type: shiftType, 
      status: "OPEN",
      inventory_data: inventoryData // Initial state cache
    };

    const { data: newShift, error: shiftError } = await supabase.from("shifts").insert([insertData]).select().single();
    if (shiftError) throw shiftError;
    
    // Allocate Inventory atomically using Server Action
    for (const item of inventoryData) {
      const qtyToDeduct = item.stok_awal;
      if (qtyToDeduct > 0) {
        await allocateShiftInventory(newShift.id, item.product_id, qtyToDeduct, userId);
      }
    }
    
    await logAudit(userId, null, newShift.id, "OPEN_SHIFT", { outletId, shiftType });
    
    return { success: true, data: newShift };
  } catch (err: any) {
    console.error("[openShift] Error:", err);
    return { success: false, message: err.message };
  }
}

export async function closeShift(
  shiftId: string,
  userId: string,
  cashInDrawer: number,
  auditStatus?: string // For central cashier
): Promise<ActionResponse<any>> {
  if (!shiftId) return { success: false, message: "Invalid shift ID" };
  
  try {
    const supabase = createAdminClient();

    // Tutup shift secara finansial (Atomik RPC dari 01_enterprise_migration.sql)
    const { error: finError } = await supabase.rpc("rpc_close_shift_financials", {
      p_shift_id: shiftId,
      p_cash_in_drawer: cashInDrawer
    });
    
    if (finError) {
      // Jika RPC tidak ada (belum di-run), fallback update status saja
      if (finError.message?.includes("Could not find the function") || finError.code === "PGRST202") {
        console.warn("⚠️ rpc_close_shift_financials tidak ditemukan. Menggunakan fallback Service Role Update.");
        await supabase.from("shifts").update({ 
          status: "CLOSED", 
          closed_at: new Date().toISOString(),
          end_cash: cashInDrawer,
          audit_status: auditStatus
        }).eq("id", shiftId);
      } else {
        throw finError;
      }
    }

    // Kembalikan stok yang tersisa
    await closeShiftInventoryAction(shiftId, userId);

    await logAudit(userId, null, shiftId, "CLOSE_SHIFT", { cashInDrawer, auditStatus });

    return { success: true };
  } catch (err: any) {
    console.error("[closeShift] Error:", err);
    return { success: false, message: err.message };
  }
}

export async function bukaShiftKasirPusatAction(userId: string, cashierName: string, modalAwal: number): Promise<ActionResponse<any>> {
  if (!userId) return { success: false, message: "User ID tidak valid" };
  try {
    const supabase = createAdminClient();
    const insertData = { user_id: userId, crew_name: cashierName, outlet_id: "CENTRAL_CASHIER", shift_type: "pagi", status: "OPEN", modal_awal: modalAwal, inventory_data: [] };
    const { data, error } = await supabase.from("shifts").insert([insertData]).select().single();
    if (error) throw error;
    await logAudit(userId, userId, data.id, "OPEN_SHIFT_CENTRAL", { modalAwal });
    return { success: true, data };
  } catch (err: any) { return { success: false, message: err.message }; }
}

export async function tutupShiftKasirPusatAction(shiftId: string, userId: string, kasSeharusnya: number, kasFisik: number, selisih: number, auditStatus: string): Promise<ActionResponse<any>> {
  try {
    const supabase = createAdminClient();
    const updateData = { status: "CLOSED", closed_at: new Date().toISOString(), kas_seharusnya: kasSeharusnya, kas_fisik: kasFisik, selisih: selisih, audit_status: auditStatus };
    const { data, error } = await supabase.from("shifts").update(updateData).eq("id", shiftId).select().single();
    if (error) throw error;
    await logAudit(userId, userId, shiftId, "CLOSE_SHIFT_CENTRAL", updateData);
    return { success: true, data };
  } catch (err: any) { return { success: false, message: err.message }; }
}

export async function getActiveKasirShiftAction(userId: string): Promise<ActionResponse<any>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("shifts").select("*").eq("outlet_id", "CENTRAL_CASHIER").in("status", ["OPEN", "aktif"]).order("created_at", { ascending: false }).limit(1).single();
    if (error && error.code !== "PGRST116") throw error;
    return { success: true, data };
  } catch (err: any) { return { success: false, message: err.message }; }
}
