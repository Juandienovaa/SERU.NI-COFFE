import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Ensure all parameters are safely defined and fallback to 0 or empty string.
export function generateShiftAuditPDF(shiftData: any, expensesData: any[], transactionsData: any[]) {
  const doc = new jsPDF("p", "pt", "a4");

  const orange: [number, number, number] = [234, 88, 12]; // #EA580C
  const black: [number, number, number] = [10, 10, 10]; // #0A0A0A
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

  // HEADER: Enterprise Audit Report
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text("LAPORAN AUDIT KEUANGAN", 40, startY);

  startY += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Seruni Coffee - Internal Financial Audit", 40, startY);
  
  startY += 30;

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
    ["Lokasi", shiftData.outlet_id],
    ["Kasir", shiftData.crew_name || shiftData.cashier_name || "Kasir Pusat"],
  ];

  const shiftInfoRight = [
    ["Waktu Buka", formatDate(shiftData.created_at)],
    ["Waktu Tutup", formatDate(shiftData.closed_at)],
    ["Status Audit", shiftData.audit_status || "PENDING"],
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
    doc.text(info[0], 300, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`: ${info[1]}`, 400, currentY);
    currentY += 15;
  });

  startY = currentY + 20;

  // 2. RINGKASAN AUDIT UTAMA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RINGKASAN AUDIT KASIR", 40, startY);
  startY += 10;

  const kasFisik = Number(shiftData.kas_fisik || 0);
  const kasSeharusnya = Number(shiftData.kas_seharusnya || 0);
  const selisih = Number(shiftData.selisih || 0);
  const isSesuai = shiftData.audit_status === "SESUAI";

  const financialRows = [
    ["Modal Awal", formatRupiah(shiftData.modal_awal)],
    ["Penjualan Tunai (Cash)", formatRupiah(shiftData.omset_tunai)],
    ["Penjualan Non-Tunai (QRIS)", formatRupiah(shiftData.omset_qris)],
    ["Pengeluaran Operasional", `(${formatRupiah(shiftData.pengeluaran_operasional)})`],
    ["Total Kas Seharusnya", formatRupiah(kasSeharusnya)],
    ["Total Kas Fisik (Dihitung Kasir)", formatRupiah(kasFisik)],
    ["Selisih Audit", selisih > 0 ? `+${formatRupiah(selisih)}` : formatRupiah(selisih)],
    ["Status Audit", shiftData.audit_status || "PENDING"],
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
    columnStyles: {
      0: { fontStyle: "normal" },
      1: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: function (data) {
      if (data.row.index === 4 || data.row.index === 5 || data.row.index === 6) {
        data.cell.styles.fontStyle = "bold";
      }
      if (data.row.index === 6 && data.column.index === 1) { // Selisih
        data.cell.styles.textColor = selisih > 0 ? ([16, 185, 129] as [number, number, number]) : selisih < 0 ? ([239, 68, 68] as [number, number, number]) : black;
      }
      if (data.row.index === 7 && data.column.index === 1) { // Status Audit
        data.cell.styles.textColor = isSesuai ? ([16, 185, 129] as [number, number, number]) : ([239, 68, 68] as [number, number, number]);
      }
    }
  });

  startY = (doc as any).lastAutoTable.finalY + 30;

  // 3. DAFTAR PENGELUARAN
  if (expensesData && expensesData.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(black[0], black[1], black[2]);
    doc.text("RINCIAN PENGELUARAN", 40, startY);
    startY += 10;
    
    const expenseRows = expensesData.map(e => [
      formatDate(e.created_at),
      e.category,
      e.description || "-",
      formatRupiah(e.amount)
    ]);
    
    autoTable(doc, {
      startY: startY,
      head: [["Waktu", "Kategori", "Deskripsi", "Nominal"]],
      body: expenseRows,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6, textColor: black, lineColor: lightGray, lineWidth: 1 },
      headStyles: { fillColor: lightGray, textColor: black, fontStyle: "bold" },
      columnStyles: { 3: { halign: "right", fontStyle: "bold", textColor: [239, 68, 68] } }
    });
    
    startY = (doc as any).lastAutoTable.finalY + 30;
  }

  // NEW PAGE FOR TIMELINE (BUKU KAS)
  doc.addPage();
  startY = 40;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text("BUKU KAS (TIMELINE HISTORI)", 40, startY);
  
  startY += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Seluruh pergerakan uang tunai dari awal shift hingga tutup shift.", 40, startY);
  
  startY += 30;

  // Prepare Timeline Data
  let timelineData: any[] = [];
  if (shiftData) {
    timelineData.push({
      time: new Date(shiftData.created_at),
      type: 'MODAL_AWAL',
      label: 'Modal Awal',
      amount: Number(shiftData.modal_awal) || 0
    });
  }

  if (transactionsData) {
    transactionsData.forEach(tx => {
      if (tx.payment_method === 'CASH') {
        timelineData.push({
          time: new Date(tx.created_at),
          type: 'CASH_SALE',
          label: 'Penjualan Tunai',
          amount: Number(tx.total_amount)
        });
      }
    });
  }

  if (expensesData) {
    expensesData.forEach(exp => {
      timelineData.push({
        time: new Date(exp.created_at),
        type: 'EXPENSE',
        label: `Pengeluaran: ${exp.category}`,
        amount: -Number(exp.amount)
      });
    });
  }

  timelineData.sort((a, b) => a.time.getTime() - b.time.getTime());

  let runningBalance = 0;
  
  // Draw Timeline
  const marginX = 60;
  let currentTY = startY;

  // Vertical line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(2);
  
  // Calculate line end
  const timelineHeight = timelineData.length * 40;
  if (timelineData.length > 0) {
    doc.line(marginX, currentTY, marginX, currentTY + timelineHeight - 10);
  }

  timelineData.forEach((item) => {
    // Check page break
    if (currentTY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentTY = 40;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(2);
      // We don't perfectly know how many items left for the line, but we can draw per item
    }

    runningBalance += item.amount;
    const isPos = item.amount >= 0;

    // Node Dot
    if (item.type === 'MODAL_AWAL') {
      doc.setFillColor(orange[0], orange[1], orange[2]);
    } else if (item.type === 'CASH_SALE') {
      doc.setFillColor(16, 185, 129); // Green
    } else {
      doc.setFillColor(239, 68, 68); // Red
    }
    
    doc.circle(marginX, currentTY, 5, 'F');

    // Time
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(formatTime(item.time.toISOString()), marginX + 15, currentTY + 3);

    // Label
    doc.setTextColor(black[0], black[1], black[2]);
    doc.text(item.label, marginX + 60, currentTY + 3);

    // Amount
    if (isPos) {
      doc.setTextColor(16, 185, 129);
      doc.text(`+${formatRupiah(item.amount)}`, marginX + 220, currentTY + 3);
    } else {
      doc.setTextColor(239, 68, 68);
      doc.text(formatRupiah(item.amount), marginX + 220, currentTY + 3);
    }

    // Balance
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFont("helvetica", "normal");
    doc.text(`Saldo: ${formatRupiah(runningBalance)}`, marginX + 320, currentTY + 3);

    currentTY += 40;
  });

  // FINAL SIGNATURES AT THE VERY END
  currentTY += 40;
  if (currentTY > doc.internal.pageSize.getHeight() - 100) {
    doc.addPage();
    currentTY = 40;
  }
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(black[0], black[1], black[2]);
  
  doc.text("Dilaporkan Oleh,", 80, currentTY);
  doc.text("Disetujui Oleh,", doc.internal.pageSize.getWidth() - 160, currentTY);
  
  currentTY += 60;
  
  doc.setFont("helvetica", "bold");
  doc.text(shiftData.crew_name || shiftData.cashier_name || "Kasir Pusat", 80, currentTY);
  doc.text("Supervisor / Auditor", doc.internal.pageSize.getWidth() - 160, currentTY);

  doc.save(`Audit_Shift_${shiftData.id.split("-")[0]}.pdf`);
}
