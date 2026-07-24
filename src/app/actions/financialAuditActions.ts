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

    let startDate: string = "";
    let endDate: string = "";

    if (periodStr === "today") {
      const d = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day));
      startDate = d.toISOString().split('T')[0];
      endDate = d.toISOString().split('T')[0];
    } else if (periodStr === "week") {
      const end = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day));
      const start = new Date(end);
      start.setDate(end.getDate() - 7);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    } else if (periodStr === "month") {
      startDate = `${wibDate.year}-${String(wibDate.month + 1).padStart(2, '0')}-01`;
      const end = new Date(Date.UTC(wibDate.year, wibDate.month + 1, 0));
      endDate = end.toISOString().split('T')[0];
    } else if (periodStr === "year") {
      startDate = `${wibDate.year}-01-01`;
      endDate = `${wibDate.year}-12-31`;
    } else {
      const d = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day));
      startDate = d.toISOString().split('T')[0];
      endDate = d.toISOString().split('T')[0];
    }

    // 1. Executive KPIs
    const { data: kpiData, error: kpiErr } = await supabase.rpc("rpc_get_financial_dashboard", { start_date: startDate, end_date: endDate });
    if (kpiErr) console.error("KPI Error:", kpiErr);

    // 2. Daily Closing Summary
    const { data: dailyData, error: dailyErr } = await supabase
      .from("vw_daily_summary")
      .select("*")
      .gte("summary_date", startDate)
      .lte("summary_date", endDate)
      .order("summary_date", { ascending: false });
    if (dailyErr) console.error("Daily Error:", dailyErr);

    // 3. Shift Audit Master
    const { data: shiftsData, error: shiftsErr } = await supabase
      .from("vw_shift_detail")
      .select("*")
      .gte("opened_at", `${startDate}T00:00:00Z`)
      .lte("opened_at", `${endDate}T23:59:59Z`)
      .order("opened_at", { ascending: false });
    if (shiftsErr) console.error("Shifts View Error:", shiftsErr);

    // 4. Exceptions
    const { data: exceptionsData, error: exceptionsErr } = await supabase
      .from("vw_audit_exception")
      .select("*")
      .gte("opened_at", `${startDate}T00:00:00Z`)
      .lte("opened_at", `${endDate}T23:59:59Z`);
    if (exceptionsErr) console.error("Exceptions Error:", exceptionsErr);

    // 5. Financial Timeline
    const { data: timelineData, error: timelineErr } = await supabase
      .from("vw_company_financial_timeline")
      .select("*")
      .gte("event_time", `${startDate}T00:00:00Z`)
      .lte("event_time", `${endDate}T23:59:59Z`)
      .order("event_time", { ascending: false });
    
    // 6. Best Selling
    const { data: bestSellingData } = await supabase.from("vw_best_selling_products").select("*").limit(5);

    // Generate Financial Health
    let totalScore = 100;
    if (exceptionsData && exceptionsData.length > 0) {
      exceptionsData.forEach((ex: any) => {
        if (ex.exception_type === 'SHORTAGE') totalScore -= 10;
        else if (ex.exception_type === 'OVERAGE') totalScore -= 5;
        else totalScore -= 2;
      });
    }
    const healthScore = Math.max(0, totalScore);
    let healthStatus = "Excellent";
    if (healthScore < 60) healthStatus = "Critical";
    else if (healthScore < 80) healthStatus = "Warning";
    else if (healthScore < 95) healthStatus = "Good";

    // Executive Insights
    const insights = [];
    const kpi = kpiData?.[0] || {};
    if (kpi.gross_revenue > 0) insights.push(`Total Revenue mencapai Rp ${Number(kpi.gross_revenue).toLocaleString('id-ID')} secara Realtime.`);
    if (exceptionsData && exceptionsData.length > 0) insights.push(`Terdapat ${exceptionsData.length} anomali kas (Selisih) yang perlu diperiksa.`);
    else insights.push("Tidak ada anomali terdeteksi pada periode ini. Audit bersih.");
    if (dailyData && dailyData.length > 0) insights.push(`Tercatat ${dailyData.length} hari operasional dalam rentang waktu terpilih.`);

    const payload = {
      period: periodStr,
      startDate,
      endDate,
      kpi: kpiData?.[0] || {
        gross_revenue: 0,
        net_revenue: 0,
        cash_revenue: 0,
        qris_revenue: 0,
        online_revenue: 0,
        operational_expense: 0,
        total_transactions: 0,
        total_cups: 0,
        average_transaction: 0
      },
      dailyClosing: dailyData || [],
      shiftMaster: shiftsData || [],
      exceptions: exceptionsData || [],
      timeline: timelineData || [],
      bestSelling: bestSellingData || [],
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
