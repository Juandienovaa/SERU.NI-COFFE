"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { ActionResponse } from "@/types/action-response";
import { logAudit } from "./auditActions";

export async function addOperationalExpense(
  shiftId: string, 
  cashierName: string, 
  category: string, 
  description: string | null, 
  amount: number,
  userId?: string // Pssed from client for audit
): Promise<ActionResponse<any>> {
  try {
    const supabase = createAdminClient();

    // 1. Validasi Input
    if (!shiftId || !cashierName || !category || amount <= 0) {
      return { success: false, message: "Data pengeluaran tidak valid atau jumlah harus lebih dari 0." };
    }

    // 2. Eksekusi Mutasi Atomik di Tabel Operasional
    const { data: expenseData, error: expenseError } = await supabase.from("operational_expenses").insert([{
      shift_id: shiftId,
      cashier_name: cashierName,
      category,
      description: description || null,
      amount
    }]).select().single();
    
    if (expenseError) {
      console.error("[addOperationalExpense] Insert error:", expenseError);
      return { success: false, message: "Gagal menyimpan pengeluaran operasional.", code: expenseError.code };
    }
    
    // 3. Kalkulasi ulang total pengeluaran dan simpan ke shifts (Atomik Read & Update)
    // Walaupun ini dua query, tapi dalam Server Action (Service Role) ini aman dari blokir RLS.
    // Jika butuh level konsistensi mutlak saat konkurensi ekstrem, bisa dipindah ke RPC. 
    // Namun untuk operasional kas sederhana, pendekatan backend ini sudah memadai.
    const { data: expenses } = await supabase.from("operational_expenses").select("amount").eq("shift_id", shiftId);
    const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
    
    const { error: updateError } = await supabase.from("shifts").update({ pengeluaran_operasional: totalExpenses }).eq("id", shiftId);
    if (updateError) {
      console.warn("[addOperationalExpense] Gagal update total di shift:", updateError);
      // We don't fail the whole action if just the cached total failed, 
      // but ideally we'd want it consistent. For enterprise strictness, we log it.
    }

    // 4. Catat ke Audit Trail
    await logAudit(
      userId || null,
      null, // cashier_id if different
      shiftId,
      "ADD_OPERATIONAL_EXPENSE",
      { category, amount, description }
    );

    return { 
      success: true, 
      message: "Pengeluaran berhasil dicatat.",
      data: expenseData 
    };

  } catch (error: any) {
    console.error("[addOperationalExpense] Server Error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan internal server." };
  }
}
