import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateAggregatedAuditPDF(
  shiftsData: any[],
  period: string, // e.g. "Mingguan (1 - 7 Aug 2026)", "Harian (12 Aug 2026)"
  totalKasSeharusnya: number,
  totalKasFisik: number,
  totalSelisih: number,
  totalPengeluaran: number
) {
  const doc = new jsPDF("l", "pt", "a4"); // Landscape for aggregated report

  const orange: [number, number, number] = [234, 88, 12];
  const black: [number, number, number] = [10, 10, 10];
  const gray: [number, number, number] = [100, 100, 100];
  const lightGray: [number, number, number] = [240, 240, 240];

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  let startY = 40;

  // HEADER
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text("LAPORAN AUDIT KEUANGAN AGREGAT", 40, startY);

  startY += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text(`Periode: ${period}`, 40, startY);
  
  startY += 30;

  // DIVIDER LINE
  doc.setDrawColor(orange[0], orange[1], orange[2]);
  doc.setLineWidth(2);
  doc.line(40, startY, doc.internal.pageSize.getWidth() - 40, startY);
  startY += 25;

  // SUMMARY REKAPITULASI
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text("RINGKASAN PERIODE", 40, startY);
  startY += 15;

  const isSesuai = totalSelisih === 0;

  const summaryRows = [
    ["Total Shift", shiftsData.length.toString()],
    ["Total Pengeluaran", formatRupiah(totalPengeluaran)],
    ["Total Kas Seharusnya", formatRupiah(totalKasSeharusnya)],
    ["Total Kas Fisik", formatRupiah(totalKasFisik)],
    ["Total Selisih Audit", formatRupiah(totalSelisih)],
  ];

  autoTable(doc, {
    startY: startY,
    head: [["Parameter", "Total"]],
    body: summaryRows,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 10, cellPadding: 8, textColor: black, lineColor: lightGray, lineWidth: 1 },
    headStyles: { fillColor: lightGray, textColor: black, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    didParseCell: function (data) {
      if (data.row.index === 4 && data.column.index === 1) {
        data.cell.styles.textColor = isSesuai ? ([16, 185, 129] as [number, number, number]) : ([239, 68, 68] as [number, number, number]);
      }
    }
  });

  startY = (doc as any).lastAutoTable.finalY + 30;

  // DETAILED SHIFT DATA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RINCIAN AUDIT PER SHIFT", 40, startY);
  startY += 10;

  const tableData = shiftsData.map((s) => [
    formatDate(s.closed_at || s.created_at),
    s.outlet_id,
    s.crew_name || s.cashier_name || "-",
    formatRupiah(s.modal_awal),
    formatRupiah(s.omset_tunai),
    formatRupiah(s.pengeluaran_operasional),
    formatRupiah(s.kas_seharusnya),
    formatRupiah(s.kas_fisik),
    s.selisih > 0 ? `+${formatRupiah(s.selisih)}` : formatRupiah(s.selisih),
    s.audit_status || (s.selisih === 0 ? "SESUAI" : "SELISIH")
  ]);

  autoTable(doc, {
    startY: startY,
    head: [["Tanggal", "Lokasi", "Kasir", "Modal Awal", "Cash Masuk", "Pengeluaran", "Kas Seharusnya", "Kas Fisik", "Selisih", "Status"]],
    body: tableData,
    theme: "striped",
    styles: { font: "helvetica", fontSize: 8, cellPadding: 5, textColor: black, lineColor: lightGray, lineWidth: 0.1 },
    headStyles: { fillColor: lightGray, textColor: black, fontStyle: "bold" },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right", textColor: [239, 68, 68] },
      6: { halign: "right", fontStyle: "bold" },
      7: { halign: "right", fontStyle: "bold" },
      8: { halign: "right", fontStyle: "bold" },
      9: { halign: "center", fontStyle: "bold" }
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 8) {
        const rawVal = shiftsData[data.row.index].selisih || 0;
        data.cell.styles.textColor = rawVal > 0 ? ([16, 185, 129] as [number, number, number]) : rawVal < 0 ? ([239, 68, 68] as [number, number, number]) : black;
      }
      if (data.section === "body" && data.column.index === 9) {
        const stat = shiftsData[data.row.index].audit_status || (shiftsData[data.row.index].selisih === 0 ? "SESUAI" : "SELISIH");
        data.cell.styles.textColor = stat === "SESUAI" ? ([16, 185, 129] as [number, number, number]) : ([239, 68, 68] as [number, number, number]);
      }
    }
  });

  startY = (doc as any).lastAutoTable.finalY + 40;

  // SIGNATURES
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  doc.text("Dilaporkan Oleh,", 80, startY);
  doc.text("Diketahui Oleh,", doc.internal.pageSize.getWidth() - 160, startY);
  
  startY += 50;
  
  doc.setFont("helvetica", "bold");
  doc.text("Sistem Audit Seruni", 80, startY);
  doc.text("Supervisor / Auditor", doc.internal.pageSize.getWidth() - 160, startY);

  const fileName = `Audit_Laporan_${period.replace(/[:\/, ]/g, "_")}.pdf`;
  doc.save(fileName);
}
