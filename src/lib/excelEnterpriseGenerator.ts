import * as XLSX from "xlsx";

export function generateEnterpriseExcel(payload: any) {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary
  const wsExec = XLSX.utils.json_to_sheet([{
    "Periode": payload.period,
    "Mulai": payload.startIso,
    "Selesai": payload.endIso,
    "Financial Health": `${payload.financialHealth.score}/100 (${payload.financialHealth.status})`,
    "Gross Revenue": payload.kpi.gross_revenue || 0,
    "Net Revenue": payload.kpi.net_revenue || 0,
    "Cash Revenue": payload.kpi.cash_revenue || 0,
    "QRIS Revenue": payload.kpi.qris_revenue || 0,
    "Online Revenue": payload.kpi.online_revenue || 0,
    "Total Expense": payload.kpi.operational_expense || 0,
    "Total Transactions": payload.kpi.total_transactions || 0,
    "Total Cups": payload.kpi.total_cups || 0
  }]);
  XLSX.utils.book_append_sheet(wb, wsExec, "Executive Summary");

  // 2. Daily Closing
  if (payload.dailyClosing && payload.dailyClosing.length > 0) {
    const wsDaily = XLSX.utils.json_to_sheet(payload.dailyClosing.map((d: any) => ({
      "Tanggal": d.date,
      "Gross Revenue": d.gross_revenue,
      "Cash Revenue": d.cash_revenue,
      "QRIS Revenue": d.qris_revenue,
      "Online Revenue": d.online_revenue,
      "Total Expense": d.operational_expense,
      "Net Revenue": d.net_revenue,
      "Total Transaksi": d.total_transactions,
      "Total Cup": d.total_cups
    })));
    XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Closing");
  }

  // 3. Shift Summary
  if (payload.shiftMaster && payload.shiftMaster.length > 0) {
    const wsShift = XLSX.utils.json_to_sheet(payload.shiftMaster.map((s: any) => ({
      "Shift ID": s.shift_id,
      "Outlet": s.outlet_name,
      "Kasir": s.crew_name,
      "Status": s.shift_status,
      "Buka": s.opened_at,
      "Tutup": s.closed_at,
      "Modal Awal": s.modal_awal,
      "Total Transaksi": s.total_transaksi,
      "Total Cup": s.cup_terjual,
      "Omset Tunai": s.omset_tunai,
      "Omset QRIS": s.omset_qris,
      "Gross Revenue": s.gross_revenue,
      "OpEx": s.pengeluaran_operasional,
      "Net Revenue": s.net_revenue,
      "Kas Seharusnya": s.expected_cash,
      "Kas Fisik": s.actual_cash,
      "Selisih Kas": s.selisih_kas,
      "Audit Score": s.audit_score
    })));
    XLSX.utils.book_append_sheet(wb, wsShift, "Shift Summary");
  }

  // 4. Timeline
  if (payload.timeline && payload.timeline.length > 0) {
    const wsTimeline = XLSX.utils.json_to_sheet(payload.timeline.map((t: any) => ({
      "Event ID": t.event_id,
      "Shift ID": t.shift_id,
      "Waktu": t.event_time,
      "Tipe Event": t.event_type,
      "Deskripsi": t.description,
      "Nominal": t.amount
    })));
    XLSX.utils.book_append_sheet(wb, wsTimeline, "Financial Timeline");
  }

  // Generate and download
  XLSX.writeFile(wb, `Financial_Audit_Center_${payload.period}.xlsx`);
}
