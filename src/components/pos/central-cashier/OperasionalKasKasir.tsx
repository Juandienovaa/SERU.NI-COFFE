"use client";

import React, { useState } from "react";
import { Plus, Search, Calendar, Filter, DollarSign, Wallet, FileText, Package, Fuel, Coffee, Droplets, IceCream, Beaker, Archive } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { addOperationalExpense } from "@/app/actions/cashierActions";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const CATEGORIES = [
  { value: "BENSIN", label: "Bensin", icon: Fuel },
  { value: "SIRUP", label: "Sirup", icon: Droplets },
  { value: "SUSU", label: "Susu", icon: Coffee },
  { value: "ES_BATU", label: "Es Batu", icon: IceCream },
  { value: "CUP", label: "Cup", icon: Package },
  { value: "SEDOTAN", label: "Sedotan", icon: Archive },
  { value: "PLASTIK", label: "Plastik", icon: Archive },
  { value: "BAHAN_BAKU", label: "Bahan Baku", icon: Beaker },
  { value: "OPERASIONAL", label: "Operasional", icon: Wallet },
  { value: "LAINNYA", label: "Lainnya", icon: FileText }
];

interface OperasionalKasKasirProps {
  shift: any;
  expenses: any[];
  totalCashSales: number;
}

export function OperasionalKasKasir({ shift, expenses, totalCashSales }: OperasionalKasKasirProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("Hari Ini"); // "Hari Ini", "Minggu Ini", "Bulan Ini"

  // Form State
  const [formCategory, setFormCategory] = useState("BENSIN");
  const [formDesc, setFormDesc] = useState("");
  const [formAmountStr, setFormAmountStr] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  };

  const handleInputAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "");
    if (!numeric) setFormAmountStr("");
    else setFormAmountStr(new Intl.NumberFormat("id-ID").format(Number(numeric)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formAmountStr.replace(/\D/g, ""));
    if (amount <= 0) return;

    setLoading(true);
    try {
      const res = await addOperationalExpense(shift.id, shift.crew_name, formCategory, formDesc, amount, shift.user_id);
      if (!res.success) {
        throw new Error(res.message);
      }
      MySwal.fire({
        icon: "success",
        title: "Pengeluaran Disimpan",
        background: "#18181b",
        color: "#ffffff",
        timer: 1500,
        showConfirmButton: false
      });
      setShowAdd(false);
      setFormAmountStr("");
      setFormDesc("");
      setFormCategory("BENSIN");
    } catch (err: any) {
      MySwal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: err.message,
        background: "#18181b",
        color: "#ffffff"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.category.toLowerCase().includes(search.toLowerCase()) ||
      (exp.description && exp.description.toLowerCase().includes(search.toLowerCase())) ||
      exp.amount.toString().includes(search);
    
    // For now filterDate logic is simplified since usually expenses array is bound to the active shift (which is just today)
    return matchesSearch;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalPengeluaran = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const saldoKas = Number(shift.modal_awal) + totalCashSales - totalPengeluaran;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-32">
      {/* Header Summary (Linear/Apple HIG Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 flex flex-col">
          <div className="flex items-center gap-3 text-neutral-400 mb-2">
            <Wallet className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">Saldo Kas Saat Ini</span>
          </div>
          <h3 className="text-4xl font-black text-white">{formatCurrency(saldoKas)}</h3>
          <p className="text-xs text-neutral-500 mt-2">Modal awal + Cash - Pengeluaran</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 flex flex-col">
          <div className="flex items-center gap-3 text-orange-500 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">Total Pengeluaran</span>
          </div>
          <h3 className="text-4xl font-black text-orange-500">{formatCurrency(totalPengeluaran)}</h3>
          <p className="text-xs text-neutral-500 mt-2">Selama shift ini berlangsung</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 flex flex-col justify-center">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full h-full min-h-[100px] rounded-[16px] bg-orange-500 hover:bg-orange-600 text-white font-black text-lg transition-all flex flex-col items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-8 h-8" />
            <span>Tambah Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Tools & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/5 border border-white/10 p-4 rounded-2xl">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari kategori, nominal, deskripsi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent border-none py-2 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-black/20 rounded-xl p-1 w-full sm:w-auto">
            {["Hari Ini", "Minggu", "Bulan"].map(f => (
              <button
                key={f}
                onClick={() => setFilterDate(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterDate === f ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-6 border-b border-white/5 text-xs font-bold text-neutral-500 uppercase tracking-widest">
          <div className="col-span-3">Kategori</div>
          <div className="col-span-4">Deskripsi</div>
          <div className="col-span-2 text-right">Nominal</div>
          <div className="col-span-3 text-right">Waktu</div>
        </div>
        
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          <AnimatePresence>
            {filteredExpenses.map((exp) => {
              const catObj = CATEGORIES.find(c => c.value === exp.category);
              const Icon = catObj?.icon || FileText;
              
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/5 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-white text-sm">{catObj?.label || exp.category}</span>
                  </div>
                  <div className="col-span-4 text-sm text-neutral-400 truncate">
                    {exp.description || "-"}
                  </div>
                  <div className="col-span-2 text-right font-black text-orange-500">
                    {formatCurrency(Number(exp.amount))}
                  </div>
                  <div className="col-span-3 text-right text-xs text-neutral-500 font-medium">
                    {new Date(exp.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    <br />
                    <span className="text-[10px]">{new Date(exp.created_at).toLocaleDateString("id-ID")}</span>
                  </div>
                </motion.div>
              );
            })}
            
            {filteredExpenses.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center justify-center text-neutral-500">
                <Filter className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold">Tidak ada pengeluaran</p>
                <p className="text-sm">Belum ada data yang sesuai dengan pencarian.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white">Catat Pengeluaran</h3>
                <button onClick={() => setShowAdd(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Plus className="w-5 h-5 rotate-45 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Kategori</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormCategory(c.value)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formCategory === c.value ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-transparent border-white/5 text-neutral-400 hover:border-white/20'}`}
                      >
                        <c.icon className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Nominal</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">Rp</span>
                    <input
                      type="text"
                      value={formAmountStr}
                      onChange={handleInputAmount}
                      placeholder="0"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xl font-black text-white focus:border-orange-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Deskripsi (Opsional)</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Contoh: Beli bensin motor..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm font-medium text-white focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !formAmountStr}
                  className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-sm transition-all"
                >
                  {loading ? "Menyimpan..." : "Simpan Pengeluaran"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
