import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TARGET_CUPS_BONUS, BONUS_AMOUNT_IDR } from "@/utils/financial";

export function generateCrewSettlementPDF(shiftData: any, expensesData: any[], transactionsData: any[]) {
  const doc = new jsPDF("p", "pt", "a4");

  const orange: [number, number, number] = [234, 88, 12]; // #EA580C
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

  const formatTime = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  let startY = 40;

  // HEADER
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text("SERUNI", 40, startY);

  startY += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("ENTERPRISE POINT OF SALE", 40, startY);
  
  startY += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.text("Laporan Settlement Keuangan", 40, startY);

  startY += 15;

  // DIVIDER LINE
  doc.setDrawColor(orange[0], orange[1], orange[2]);
  doc.setLineWidth(2);
  doc.line(40, startY, doc.internal.pageSize.getWidth() - 40, startY);
  startY += 25;

  // 1. INFORMASI SHIFT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text("INFORMASI SHIFT", 40, startY);

  startY += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const shiftInfoLeft = [
    ["ID Shift", shiftData.id],
    ["Lokasi", shiftData.outlet_id || "Outlet / Grobak"],
    ["Crew Name", shiftData.crew_name || "Crew"],
  ];

  const shiftInfoRight = [
    ["Waktu Buka", formatDate(shiftData.created_at)],
    ["Waktu Tutup", formatDate(shiftData.closed_at)],
    ["Detail Settlement", "SETTLED"],
  ];

  let currentY = startY;
  shiftInfoLeft.forEach((info) => {
    doc.setFont("helvetica", "bold");
    doc.text(info[0], 40, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${info[1]}`, 120, currentY);
    currentY += 15;
  });

  currentY = startY;
  shiftInfoRight.forEach((info) => {
    doc.setFont("helvetica", "bold");
    doc.text(info[0], 320, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${info[1]}`, 420, currentY);
    currentY += 15;
  });

  startY = currentY + 20;

  // 2. RINGKASAN PENJUALAN & SETORAN
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RINGKASAN PENJUALAN & SETORAN", 40, startY);
  startY += 10;

  const omsetTunai = Number(shiftData.omset_tunai || 0);
  const omsetQris = Number(shiftData.omset_qris || 0);
  const pengeluaranOperasional = Number(shiftData.pengeluaran_operasional || 0);
  const totalCupTerjual = Number(shiftData.total_cups || shiftData.cup_terjual || 0);
  
  const bonusCrew = totalCupTerjual >= TARGET_CUPS_BONUS ? BONUS_AMOUNT_IDR : 0; 
  const netCashSetoran = Math.max(0, omsetTunai - pengeluaranOperasional - bonusCrew);

  const financialRows = [
    ["Total Cup Terjual", `${totalCupTerjual} Cup`],
    ["Gross Cash (Uang Fisik dari Pembeli)", formatRupiah(omsetTunai)],
    ["Total QRIS", formatRupiah(omsetQris)],
    ["Pengeluaran Operasional", `(${formatRupiah(pengeluaranOperasional)})`],
    ["Bonus Crew (Berdasarkan Cup Terjual)", `-${formatRupiah(bonusCrew)}`],
    ["Net Cash (Setoran)", formatRupiah(netCashSetoran)],
  ];

  autoTable(doc, {
    startY: startY,
    head: [["Deskripsi", "Nominal (IDR)"]],
    body: financialRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 11,
      cellPadding: 8,
      textColor: black,
      lineColor: lightGray,
      lineWidth: 1,
    },
    headStyles: {
      fillColor: lightGray,
      textColor: black,
      fontStyle: "bold",
    },
    didParseCell: (data) => {
      // Highlight Net Cash row
      if (data.row.index === financialRows.length - 1 && data.section === 'body') {
        data.cell.styles.textColor = [234, 88, 12]; // Orange text
        data.cell.styles.fontStyle = 'bold';
        // Add a top border to separate the total
        data.cell.styles.lineWidth = { top: 2, bottom: 0, left: 0, right: 0 };
        data.cell.styles.lineColor = [234, 88, 12];
      }
    }
  });

  startY = (doc as any).lastAutoTable.finalY + 30;

  // 3. DAFTAR TRANSAKSI
  if (transactionsData && transactionsData.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(black[0], black[1], black[2]);
    doc.text(`DAFTAR TRANSAKSI (Total: ${transactionsData.length} Trx)`, 40, startY);
    startY += 10;

    const trxRows = transactionsData.map((trx: any) => [
      formatTime(trx.created_at),
      trx.payment_method === 'QRIS' ? 'QRIS' : 'CASH',
      (trx.total_items || 0) + " Cup",
      formatRupiah(trx.total_amount),
    ]);

    autoTable(doc, {
      startY: startY,
      head: [["Waktu", "Metode", "Cup", "Total Transaksi"]],
      body: trxRows,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
      },
      headStyles: {
        fillColor: black,
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: lightGray,
      },
    });
  }

  // FOOTER
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : startY;
  
  if (finalY + 60 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    startY = 40;
  } else {
    startY = finalY + 40;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Dilaporkan Oleh,", 80, startY);
  doc.text("Disetujui Oleh,", 400, startY);

  doc.setFont("helvetica", "bold");
  doc.text(shiftData.crew_name || "Alex", 80, startY + 60);
  doc.text("Supervisor / Auditor", 400, startY + 60);

  doc.save(`Settlement_${shiftData.crew_name || "Crew"}_${shiftData.id}.pdf`);
}
