"use client";

import React, { useMemo } from "react";
import { Wallet, Fuel, Droplets, Coffee, IceCream, Package, Beaker, FileText, Banknote, Archive } from "lucide-react";
import { motion } from "motion/react";

interface BukuKasTimelineProps {
  shift: any;
  expenses: any[];
  transactions: any[]; // Cash sales from transactions table
}

const CATEGORY_ICONS: Record<string, any> = {
  BENSIN: Fuel,
  SIRUP: Droplets,
  SUSU: Coffee,
  ES_BATU: IceCream,
  CUP: Package,
  SEDOTAN: Archive,
  PLASTIK: Archive,
  BAHAN_BAKU: Beaker,
  OPERASIONAL: Wallet,
  LAINNYA: FileText
};

export function BukuKasTimeline({ shift, expenses, transactions }: BukuKasTimelineProps) {
  
  const timelineData = useMemo(() => {
    let data: any[] = [];

    // 1. Modal Awal
    if (shift) {
      data.push({
        id: 'modal_awal',
        type: 'MODAL_AWAL',
        time: new Date(shift.created_at),
        amount: Number(shift.modal_awal) || 0,
        label: 'Modal Awal',
        icon: Wallet,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
      });
    }

    // 2. Transactions (CASH & QRIS)
    transactions.forEach(tx => {
      if (tx.payment_method === 'CASH') {
        data.push({
          id: `tx_${tx.id}`,
          type: 'CASH_SALE',
          isQris: false,
          time: new Date(tx.created_at),
          amount: Number(tx.total_amount),
          label: 'Penjualan Cash',
          icon: Banknote,
          color: 'text-green-500',
          bg: 'bg-green-500/10'
        });
      } else if (tx.payment_method === 'QRIS' || tx.metode_bayar === 'QRIS') {
        data.push({
          id: `tx_${tx.id}`,
          type: 'QRIS_SALE',
          isQris: true,
          time: new Date(tx.created_at),
          amount: Number(tx.total_amount),
          label: 'Penjualan QRIS',
          icon: Banknote, // Use Banknote or Wallet
          color: 'text-blue-400',
          bg: 'bg-blue-400/10'
        });
      }
    });

    // 3. Expenses
    expenses.forEach(exp => {
      data.push({
        id: `exp_${exp.id}`,
        type: 'EXPENSE',
        time: new Date(exp.created_at),
        amount: -Number(exp.amount),
        label: exp.description ? `${exp.category} - ${exp.description}` : exp.category,
        icon: CATEGORY_ICONS[exp.category] || FileText,
        color: 'text-red-500',
        bg: 'bg-red-500/10'
      });
    });

    // Sort chronologically (oldest first to calculate running balance correctly)
    data.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Calculate running balance (hanya transaksi tunai/fisik)
    let currentBalance = 0;
    const dataWithBalance = data.map(item => {
      if (!item.isQris) {
        currentBalance += item.amount;
      }
      return { ...item, balance: currentBalance };
    });

    // Return reversed so newest is on top, but balance was already calculated correctly
    return dataWithBalance.reverse();
  }, [shift, expenses, transactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Math.abs(val));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto pb-32">
      <div className="mb-12">
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Buku Kas</h2>
        <p className="text-neutral-400">Jejak seluruh pergerakan uang fisik pada shift ini.</p>
      </div>

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-white/10" />

        <div className="space-y-8">
          {timelineData.map((item, index) => {
            const Icon = item.icon;
            const isPositive = item.amount >= 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex items-start gap-6"
              >
                {/* Node Icon */}
                <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.bg} border border-white/5 shadow-xl backdrop-blur-md`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-[24px] p-6 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div>
                      <h4 className="font-bold text-white text-lg">{item.label}</h4>
                      <p className="text-xs text-neutral-500 font-bold tracking-widest uppercase mt-1">
                        {item.time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className={`text-xl font-black ${item.color}`}>
                        {isPositive ? '+' : '-'} {formatCurrency(item.amount)} {item.isQris ? '(QRIS)' : ''}
                      </div>
                      {item.isQris ? (
                        <div className="text-sm font-bold text-neutral-500 mt-1">
                          Saldo Laci Tetap
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-neutral-400 mt-1">
                          Saldo: <span className="text-white">{formatCurrency(item.balance)}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {timelineData.length === 0 && (
            <div className="text-center p-12 text-neutral-500">
              Belum ada pergerakan kas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
