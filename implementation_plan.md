# Implementation Plan: Enterprise Session-Based Inventory Architecture

Bro, *script* SQL yang lu bikin bener-bener mantap dan secara logika udah mencakup semua requirement sistem ERP level Enterprise! Mekanisme `FOR UPDATE` dan *Database Triggers*-nya emang wajib banget buat arsitektur sekelas ini.

**TAPI ADA SATU MASALAH KECIL:**
Tabel yang ada di database kita saat ini **BUKAN** `master_inventory` dan `sales_items`, melainkan `product_inventory` dan `transactions`. Kalau *script* yang lu tulis tadi dijalankan apa adanya, pasti bakal kena error *Table Not Found*.

Gw udah **menyesuaikan persis** *script* lu dengan skema tabel asli kita (termasuk kolom `current_stock` dan tabel `transactions`).

## TAHAP 1 - EKSEKUSI SQL INI
Buka kembali **SQL Editor** di Supabase lu, hapus script yang lama, dan jalankan blok kode yang udah gw koreksi di bawah ini:

```sql
-- 1. BIKIN TABEL AUDIT TRAIL
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id INT NOT NULL, -- Di codebase kita product_id pakai INT/number
    movement_type TEXT NOT NULL, 
    qty INT NOT NULL,
    reference_id TEXT, -- ID shift atau ID transaksi berbentuk string UUID
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BIKIN VERSI ENTERPRISE SHIFT_INVENTORY
DROP TABLE IF EXISTS shift_inventory CASCADE;

CREATE TABLE shift_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE, -- Tabel kita namanya 'shifts'
    product_id INT NOT NULL, 
    
    qty_awal INT NOT NULL DEFAULT 0,
    qty_terjual INT NOT NULL DEFAULT 0,
    qty_rusak INT NOT NULL DEFAULT 0,
    qty_adjustment INT NOT NULL DEFAULT 0,
    qty_retur INT NOT NULL DEFAULT 0,
    
    sisa_stok INT GENERATED ALWAYS AS (qty_awal - qty_terjual - qty_rusak + qty_adjustment) STORED,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shift_id, product_id)
);

-- 3. RPC BUKA SHIFT
CREATE OR REPLACE FUNCTION rpc_allocate_inventory(
    p_shift_id UUID,
    p_product_id INT,
    p_qty INT
) 
RETURNS void AS $$
DECLARE
    v_current_stock INT;
BEGIN
    -- LOCK BARIS product_inventory
    SELECT current_stock INTO v_current_stock
    FROM product_inventory
    WHERE product_id = p_product_id
    FOR UPDATE;

    IF v_current_stock < p_qty THEN
        RAISE EXCEPTION 'Gagal: Stok gudang (%) tidak mencukupi untuk request (%)', v_current_stock, p_qty;
    END IF;

    -- POTONG STOK GUDANG
    UPDATE product_inventory
    SET current_stock = current_stock - p_qty
    WHERE product_id = p_product_id;

    -- MASUKKAN KE SHIFT INVENTORY
    INSERT INTO shift_inventory (shift_id, product_id, qty_awal)
    VALUES (p_shift_id, p_product_id, p_qty)
    ON CONFLICT (shift_id, product_id) 
    DO UPDATE SET qty_awal = shift_inventory.qty_awal + p_qty;

    -- CATAT KE AUDIT
    INSERT INTO inventory_movements (product_id, movement_type, qty, reference_id, description)
    VALUES (p_product_id, 'OPEN_SHIFT', -p_qty, p_shift_id::TEXT, 'Alokasi stok ke gerobak');
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER JUALAN OTOMATIS (Tabel 'transactions')
CREATE OR REPLACE FUNCTION trigger_process_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Update qty_terjual di gerobak berdasarkan shift_id (yang ada di tabel transactions)
    UPDATE shift_inventory
    SET qty_terjual = qty_terjual + NEW.qty
    WHERE shift_id = NEW.shift_id AND product_id = NEW.product_id;

    -- Catat ke Audit Trail
    INSERT INTO inventory_movements (product_id, movement_type, qty, reference_id, description)
    VALUES (NEW.product_id, 'SALE', -NEW.qty, NEW.id::TEXT, 'Terjual via POS');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sale_item_inserted ON transactions;
CREATE TRIGGER on_sale_item_inserted
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION trigger_process_sale();

-- 5. RPC TUTUP SHIFT
CREATE OR REPLACE FUNCTION rpc_close_shift(p_shift_id UUID)
RETURNS void AS $$
DECLARE
    item RECORD;
    v_return_qty INT;
BEGIN
    FOR item IN SELECT * FROM shift_inventory WHERE shift_id = p_shift_id LOOP
        v_return_qty := item.sisa_stok;

        IF v_return_qty > 0 THEN
            UPDATE product_inventory
            SET current_stock = current_stock + v_return_qty
            WHERE product_id = item.product_id;

            UPDATE shift_inventory
            SET qty_retur = v_return_qty
            WHERE id = item.id;

            INSERT INTO inventory_movements (product_id, movement_type, qty, reference_id, description)
            VALUES (item.product_id, 'RETURN', v_return_qty, p_shift_id::TEXT, 'Pengembalian sisa stok gerobak akhir shift');
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## TAHAP 2 - Refactor Codebase Next.js (Setelah SQL Dieksekusi)
Setelah lu berhasil *run* SQL di atas, gw bakal langsung nulis:
1. `src/services/inventoryService.ts` untuk memanggil RPC `rpc_allocate_inventory` dan `rpc_close_shift`.
2. Hapus potongan kode inventory lama di `bukaShift` dan `tutupShift` pada `backendService.ts`.
3. Integrasi ulang *Live Manager Dashboard* agar me-*listen* perubahan langsung dari `shift_inventory`.
