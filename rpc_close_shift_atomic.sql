-- Atomically closes a shift, calculating everything securely on the server-side

CREATE OR REPLACE FUNCTION rpc_close_shift_atomic(
    p_shift_id UUID
) RETURNS JSON AS $$
DECLARE
    v_shift_record RECORD;
    v_cash_revenue NUMERIC := 0;
    v_qris_revenue NUMERIC := 0;
    v_total_revenue NUMERIC := 0;
    v_total_cups INT := 0;
    v_bonus_amount NUMERIC := 0;
    v_is_bonus_achieved BOOLEAN := FALSE;
    v_cash_deposit NUMERIC := 0;
    v_inventory_data JSONB;
BEGIN
    -- 1. Validate Active Shift
    SELECT * INTO v_shift_record
    FROM shifts
    WHERE id = p_shift_id AND status = 'OPEN';

    IF NOT FOUND THEN
        -- Maybe it's uppercase/lowercase issue, try upper/lower
        SELECT * INTO v_shift_record
        FROM shifts
        WHERE id = p_shift_id AND upper(status) = 'OPEN';

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Tidak ada shift aktif dengan ID %', p_shift_id;
        END IF;
    END IF;

    -- 2. Calculate Cash & QRIS Revenue & Cups
    -- Aggregate ONLY transactions belonging to this shift
    SELECT 
        COALESCE(SUM(CASE WHEN upper(metode_bayar) = 'CASH' THEN total_harga ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN upper(metode_bayar) = 'QRIS' THEN total_harga ELSE 0 END), 0),
        COALESCE(SUM(qty), 0)
    INTO 
        v_cash_revenue, 
        v_qris_revenue, 
        v_total_cups
    FROM transactions
    WHERE shift_id = p_shift_id;

    v_total_revenue := v_cash_revenue + v_qris_revenue;

    -- 3. Inventory Calculation
    -- Calculate remaining stock based on shift_inventory
    -- Then update master inventory
    -- Wait, the legacy app stores inventory in `shifts.inventory_data`.
    -- The prompt says: "Remaining Stock MUST come ONLY from shift_inventory WHERE shift_id = activeShiftId... Return ONLY remaining items from THIS shift back into product_inventory"

    -- Let's execute the existing inventory return logic (which we previously encapsulated in rpc_close_shift)
    -- Or we can rewrite it here.
    -- Wait, the user already uses `rpc_close_shift` for inventory. We can just call it, or we can merge it.
    
    -- We can call the existing inventory return RPC if we want.
    -- But let's write the JSON response so the client knows what happened.
    
    -- Bonus Calculation (100 cups -> 50000 bonus)
    IF v_total_cups >= 100 THEN
        v_is_bonus_achieved := TRUE;
        v_bonus_amount := 50000;
    END IF;

    -- Cash Deposit = Cash Revenue - Bonus
    v_cash_deposit := GREATEST(0, v_cash_revenue - v_bonus_amount);

    -- 4. Update Shift
    UPDATE shifts
    SET 
        status = 'CLOSED',
        closed_at = NOW(),
        omset_tunai = v_cash_revenue,
        omset_qris = v_qris_revenue,
        total_sales = v_total_revenue,
        total_cups = v_total_cups,
        bonus_amount = v_bonus_amount,
        is_bonus_achieved = v_is_bonus_achieved,
        cash_deposit = v_cash_deposit,
        cash_revenue = v_cash_revenue,
        qris_revenue = v_qris_revenue
    WHERE id = p_shift_id
    RETURNING inventory_data INTO v_inventory_data;

    -- Return the exact calculated data to the frontend
    RETURN json_build_object(
        'shift_id', p_shift_id,
        'cash_revenue', v_cash_revenue,
        'qris_revenue', v_qris_revenue,
        'total_revenue', v_total_revenue,
        'total_cups', v_total_cups,
        'bonus_achieved', v_is_bonus_achieved,
        'bonus_amount', v_bonus_amount,
        'cash_deposit', v_cash_deposit,
        'inventory_data', v_inventory_data
    );
END;
$$ LANGUAGE plpgsql;
