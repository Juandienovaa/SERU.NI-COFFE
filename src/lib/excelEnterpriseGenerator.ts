import * as XLSX from "xlsx";

export function generateEnterpriseExcel(payload: any) {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary
  const wsExec = XLSX.utils.json_to_sheet([{
    "Periode": payload.period,
    "Mulai": payload.startIso,
    "Selesai": payload.endIso,
    "Financial Health": `${payload.financialHealth.score}/100 (${payload.financialHealth.status})`,
    "Gross Revenue": payload.kpi.gross_revenue,
    "Net Revenue": payload.kpi.net_revenue,
    "Cash Revenue": payload.kpi.cash_revenue,
    "QRIS Revenue": payload.kpi.qris_revenue,
    "Total Expense": payload.kpi.total_expense,
    "Total Transactions": payload.kpi.total_transactions,
    "Total Cups": payload.kpi.total_cups
  }]);
  XLSX.utils.book_append_sheet(wb, wsExec, "Executive Summary");

  // 2. Daily Closing
  if (payload.dailyClosing && payload.dailyClosing.length > 0) {
    const wsDaily = XLSX.utils.json_to_sheet(payload.dailyClosing.map((d: any) => ({
      "Tanggal": d.closing_date,
      "Total Shift": d.total_shifts,
      "Cash Revenue": d.cash_revenue,
      "QRIS Revenue": d.qris_revenue,
      "Total Expense": d.total_expense,
      "Gross Revenue": d.gross_revenue
    })));
    XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Closing");
  }

  // 3. Shift Summary
  if (payload.shiftMaster && payload.shiftMaster.length > 0) {
    const wsShift = XLSX.utils.json_to_sheet(payload.shiftMaster.map((s: any) => ({
      "Shift ID": s.shift_id,
      "Outlet": s.outlet_id,
      "Kasir": s.cashier_name,
      "Tipe": s.shift_type,
      "Buka": s.opened_at,
      "Tutup": s.closed_at,
      "Status": s.status,
      "Modal Awal": s.modal_awal,
      "Cash Sales": s.cash_sales,
      "QRIS Sales": s.qris_sales,
      "Gross Sales": s.gross_sales,
      "OpEx": s.operational_expense,
      "Kas Seharusnya": s.expected_cash,
      "Kas Fisik": s.physical_cash,
      "Selisih": s.cash_difference,
      "Total Cup": s.total_cup,
      "Audit Score": s.audit_score
    })));
    XLSX.utils.book_append_sheet(wb, wsShift, "Shift Summary");
  }

  // 4. Exceptions
  if (payload.exceptions && payload.exceptions.length > 0) {
    const wsExceptions = XLSX.utils.json_to_sheet(payload.exceptions.map((e: any) => ({
      "Shift ID": e.shift_id,
      "Tipe": e.exception_type,
      "Tingkat": e.severity,
      "Deskripsi": e.description,
      "Waktu": e.event_time
    })));
    XLSX.utils.book_append_sheet(wb, wsExceptions, "Exceptions");
  }

  // Generate and download
  XLSX.writeFile(wb, `Financial_Audit_Center_${payload.period}.xlsx`);
}
