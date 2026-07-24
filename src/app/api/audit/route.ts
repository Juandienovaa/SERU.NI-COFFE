import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: s } = await supabase.from('shifts').select('*').limit(5);
  const { data: t } = await supabase.from('transactions').select('*').limit(5);
  const { data: ti } = await supabase.from('transaction_items').select('*').limit(5);
  const { data: o } = await supabase.from('online_orders').select('*').limit(5);
  const { data: e } = await supabase.from('operational_expenses').select('*').limit(5);

  return NextResponse.json({ shifts: s, transactions: t, transaction_items: ti, online_orders: o, expenses: e });
}
