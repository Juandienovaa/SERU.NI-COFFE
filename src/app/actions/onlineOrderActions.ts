"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { ActionResponse } from "@/types/action-response";
import { logAudit } from "./auditActions";

export async function updateOrderStatusAction(
  orderId: string, 
  paymentStatus: 'PAID' | 'UNPAID', 
  orderStatus: 'WAITING_CONFIRMATION' | 'PROCESSING' | 'PREPARING' | 'READY_FOR_DELIVERY' | 'ON_THE_WAY' | 'COMPLETED' | 'REJECTED' | 'CANCELLED',
  userId?: string
): Promise<ActionResponse> {
  try {
    const supabase = createAdminClient();
    
    // Kita gunakan Service Role agar update langsung di DB meskipun browser client anon
    const { error } = await supabase.from("online_orders").update({
      payment_status: paymentStatus,
      order_status: orderStatus
    }).eq("id", orderId);

    if (error) throw error;
    
    await logAudit(userId || null, null, null, "UPDATE_ONLINE_ORDER_STATUS", { orderId, paymentStatus, orderStatus });

    return { success: true };
  } catch (err: any) {
    console.error("[updateOrderStatusAction] Error:", err);
    return { success: false, message: err.message };
  }
}

export async function completeOnlineOrderAction(
  orderId: string,
  cashierId: string
): Promise<ActionResponse> {
  try {
    const supabase = createAdminClient();
    
    // Call the atomic RPC which guarantees double deduction protection
    const { error } = await supabase.rpc("rpc_complete_online_order", {
      p_order_id: orderId,
      p_cashier_id: cashierId
    });

    if (error) throw error;
    
    await logAudit(cashierId, cashierId, null, "COMPLETE_ONLINE_ORDER", { orderId });

    return { success: true, message: "Pesanan berhasil diselesaikan dan stok master telah terpotong." };
  } catch (err: any) {
    console.error("[completeOnlineOrderAction] Error:", err);
    return { success: false, message: err.message };
  }
}
