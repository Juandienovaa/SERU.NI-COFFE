"use server";

import { createAdminClient } from "@/lib/supabase-server";

export async function logAudit(
  userId: string | null,
  cashierId: string | null,
  shiftId: string | null,
  action: string,
  payload: any,
  ipAddress?: string
) {
  try {
    const supabase = createAdminClient();
    
    // Fire and forget (don't block the main action)
    supabase.from("audit_logs").insert([{
      user_id: userId,
      cashier_id: cashierId,
      shift_id: shiftId,
      action,
      payload,
      ip_address: ipAddress || null
    }]).then(({ error }) => {
      if (error) {
        console.error(`[Audit Log Error] Failed to log action ${action}:`, error.message);
      }
    });
  } catch (err) {
    console.error("[Audit Log System Error]", err);
  }
}
