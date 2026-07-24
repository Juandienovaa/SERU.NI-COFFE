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
    } else if (periodStr === "7days") {
      const end = new Date(Date.UTC(wibDate.year, wibDate.month, wibDate.day));
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
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

    // 2. Online Orders (Query langsung untuk realtime)
    const { data: onlineOrders, error: onlineErr } = await supabase
      .from("online_orders")
      .select("grand_total, online_order_items(quantity)")
      .gte("created_at", `${startDate}T00:00:00+07:00`)
      .lte("created_at", `${endDate}T23:59:59+07:00`)
      .in('payment_status', ['PAID', 'SETTLED']);
    if (onlineErr) console.error("Online Error:", onlineErr);

    // 3. Shift Audit Master (Menggunakan LOGIKA HARI BISNIS / BUSINESS DAY)
    // Semua omset dihitung berdasarkan kapan shift tersebut DIBUKA (start_time).
    const { data: shiftsData, error: shiftsErr } = await supabase
      .from("vw_shift_detail")
      .select("*")
      .gte("start_time", `${startDate}T00:00:00+07:00`)
      .lte("start_time", `${endDate}T23:59:59+07:00`)
      .order("start_time", { ascending: false });
    if (shiftsErr) console.error("Shifts View Error:", shiftsErr);

    // Calculate KPI 
    const kpi = {
      gross_revenue: 0,
      net_revenue: 0,
      cash_revenue: 0,
      qris_revenue: 0,
      online_revenue: 0,
      operational_expense: 0,
      total_transactions: 0,
      total_cups: 0,
      average_transaction: 0
    };

    // Ambil online_revenue dari onlineOrders
    if (onlineOrders) {
      onlineOrders.forEach((o: any) => {
         kpi.online_revenue += Number(o.grand_total) || 0;
         kpi.total_cups += o.online_order_items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0;
         kpi.total_transactions += 1;
      });
    }

    // Ambil data offline POS dari shiftsData (Termasuk shift yg masih OPEN / belum ditutup)
    if (shiftsData) {
      shiftsData.forEach(s => {
         kpi.gross_revenue += Number(s.gross_revenue) || 0;
         kpi.cash_revenue += Number(s.cash_revenue) || 0;
         kpi.qris_revenue += Number(s.qris_revenue) || 0;
         kpi.operational_expense += Number(s.operational_expense) || 0;
         kpi.total_transactions += Number(s.total_transactions) || 0;
         kpi.total_cups += Number(s.total_cups) || 0;
      });
    }

    // Hitung Net Revenue
    kpi.net_revenue = (kpi.gross_revenue + kpi.online_revenue) - kpi.operational_expense;

    // 4. Exceptions (Derived from Shift Cash Difference)
    const exceptionsData = (shiftsData || [])
      .filter((s: any) => {
        const isKasirPusat = !s.crew_name || s.crew_name.toLowerCase() === 'system' || s.crew_name.toLowerCase().includes('kasir pusat');
        return isKasirPusat && s.end_time && Number(s.cash_difference) !== 0;
      })
      .map((s: any) => ({
        shift_id: s.shift_id,
        crew_name: s.crew_name,
        end_time: s.end_time,
        exception_type: Number(s.cash_difference) < 0 ? 'SHORTAGE' : 'OVERAGE',
        amount: Math.abs(Number(s.cash_difference)),
        description: Number(s.cash_difference) < 0 ? 'Kekurangan Setoran Fisik' : 'Kelebihan Setoran Fisik'
      }));

    // 5. Financial Timeline
    const { data: timelineData, error: timelineErr } = await supabase
      .from("vw_company_financial_timeline")
      .select("*")
      .gte("event_time", `${startDate}T00:00:00+07:00`)
      .lte("event_time", `${endDate}T23:59:59+07:00`)
      .order("event_time", { ascending: false });
    if (timelineErr) console.error("Timeline Error:", timelineErr);
    
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
    if (kpi.gross_revenue > 0) insights.push(`Total Revenue mencapai Rp ${Number(kpi.gross_revenue + kpi.online_revenue).toLocaleString('id-ID')} secara Realtime.`);
    if (exceptionsData && exceptionsData.length > 0) insights.push(`Terdapat ${exceptionsData.length} anomali kas (Selisih) yang perlu diperiksa.`);
    else insights.push("Tidak ada anomali terdeteksi pada periode ini. Audit bersih.");

    const payload = {
      period: periodStr,
      startDate,
      endDate,
      kpi,
      dailyClosing: [],
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
