import React from "react";
import { motion } from "motion/react";
import { PackageOpen } from "lucide-react";

export const EmptyInventoryState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full py-20 flex flex-col items-center justify-center bg-[#18181B] border border-white/[0.05] rounded-[24px]"
    >
      <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mb-6">
        <PackageOpen className="w-10 h-10 text-neutral-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Belum Ada Data Inventory</h3>
      <p className="text-sm text-neutral-500 max-w-sm text-center leading-relaxed">
        Sistem belum menemukan data stok barang jadi. Tambahkan produk ke katalog atau tunggu sinkronisasi otomatis dari Barista POS.
      </p>
    </motion.div>
  );
};
