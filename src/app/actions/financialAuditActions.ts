"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { ActionResponse } from "@/types/action-response";

export async function getMasterAuditPayload(periodStr: string): Promise<ActionResponse<any>> {
  try {
    const supabase = createAdminClient();
    
    let startIso = "";
    let endIso = "";
    
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
    const wibParts = formatter.formatToParts(new Date());
    const wibDate = { 
      year: parseInt(wibParts.find(p => p.type === 'year')!.value),
      month: parseInt(wibParts.find(p => p.type === 'month')!.value) - 1,
      day: parseInt(wibParts.find(p => p.type === 'day')!.value)
    };

    if (periodStr === "today") {
      const start = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, -7, 0, 0));
      const end = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, 16, 59, 59, 999));
      startIso = start.toISOString();
      endIso = end.toISOString();
    } else if (periodStr === "week") {
      const start = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day - 7, -7, 0, 0));
      const end = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, 16, 59, 59, 999));
      startIso = start.toISOString();
      endIso = end.toISOString();
    } else if (periodStr === "month") {
      const start = new Date(Date.UTC(wibDate.year, wibDate.month, 1, -7, 0, 0));
      const end = new Date(Date.UTC(wibDate.year, wibDate.month + 1, 0, 16, 59, 59, 999));
      startIso = start.toISOString();
      endIso = end.toISOString();
    } else {
      // Default fallback to today
      const start = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, -7, 0, 0));
      const end = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day, 16, 59, 59, 999));
      startIso = start.toISOString();
      endIso = end.toISOString();
    }

    // 1. Executive KPIs (RPC) - TRUE ERP
    const { data: kpiData, error: kpiErr } = await supabase.rpc("rpc_get_true_executive_kpis", { p_start_date: startIso, p_end_date: endIso, p_include_open_shifts: true });
    if (kpiErr) console.error("KPI Error:", kpiErr);

    // 2. Daily Closing Summary (RPC) - TRUE ERP
    const { data: dailyData, error: dailyErr } = await supabase.rpc("rpc_get_true_daily_closing", { p_start_date: startIso, p_end_date: endIso });
    if (dailyErr) console.error("Daily Error:", dailyErr);

    // 3. Shift Audit Master (View) - TRUE ERP
    const { data: shiftsData, error: shiftsErr } = await supabase
      .from("vw_true_shift_audit_master")
      .select("*")
      .gte("opened_at", startIso)
      .lte("opened_at", endIso)
      .order("opened_at", { ascending: false });
    if (shiftsErr) console.error("Shifts View Error:", shiftsErr);

    // 4. Exceptions (RPC) - TRUE ERP
    const { data: exceptionsData, error: exceptionsErr } = await supabase.rpc("rpc_get_true_audit_exceptions", { p_start_date: startIso, p_end_date: endIso });
    if (exceptionsErr) console.error("Exceptions Error:", exceptionsErr);

    // Generate Financial Health (Simple placeholder rule based on exceptions and shift score for now)
    let totalScore = 100;
    if (exceptionsData && exceptionsData.length > 0) {
      exceptionsData.forEach((ex: any) => {
        if (ex.severity === 'CRITICAL') totalScore -= 10;
        else if (ex.severity === 'HIGH') totalScore -= 5;
        else totalScore -= 2;
      });
    }
    const healthScore = Math.max(0, totalScore);
    let healthStatus = "Excellent";
    if (healthScore < 60) healthStatus = "Critical";
    else if (healthScore < 80) healthStatus = "Warning";
    else if (healthScore < 95) healthStatus = "Good";

    // Executive Insights (Auto generated array)
    const insights = [];
    const kpi = kpiData?.[0] || {};
    if (kpi.gross_revenue > 0) insights.push(`Total Revenue mencapai Rp ${kpi.gross_revenue.toLocaleString('id-ID')} secara Realtime.`);
    if (exceptionsData && exceptionsData.length > 0) insights.push(`Terdapat ${exceptionsData.length} anomali yang perlu diperiksa.`);
    else insights.push("Tidak ada anomali terdeteksi pada periode ini.");
    if (dailyData && dailyData.length > 0) insights.push(`Rata-rata penjualan harian tercatat dari ${dailyData.length} hari operasional.`);

    const payload = {
      period: periodStr,
      startIso,
      endIso,
      kpi: kpiData?.[0] || {
        gross_revenue: 0,
        net_revenue: 0,
        cash_revenue: 0,
        qris_revenue: 0,
        total_expense: 0,
        total_transactions: 0,
        total_cups: 0
      },
      dailyClosing: dailyData || [],
      shiftMaster: shiftsData || [],
      exceptions: exceptionsData || [],
      insights,
      financialHealth: {
        score: healthScore,
        status: healthStatus
      }
    };

    return { success: true, data: payload };
  } catch (err: any) {
    console.error("Failed to get audit payload:", err);
    return { success: false, message: err.message };
  }
}
