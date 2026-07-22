import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side supabase client for API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Validasi basic payload
    if (!payload || !payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json({ success: false, message: 'Payload tidak valid atau keranjang kosong.' }, { status: 400 });
    }

    // Call PostgreSQL RPC for Atomic Transaction
    const { data, error } = await supabase.rpc('rpc_atomic_checkout', { payload });

    if (error) {
      console.error('[API/Checkout] RPC Error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Terjadi kesalahan sistem saat checkout.',
        error: error.message
      }, { status: 500 });
    }

    // Karena RPC kita menangkap exception dan mengembalikan JSON manual
    if (data && data.success === false) {
      console.warn('[API/Checkout] RPC Logic Error:', data.error);
      return NextResponse.json({ 
        success: false, 
        message: data.error || 'Gagal memproses transaksi.'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      transaction_id: data.transaction_id, 
      message: 'Checkout berhasil' 
    }, { status: 200 });

  } catch (err: any) {
    console.error('[API/Checkout] Internal Error:', err);
    return NextResponse.json({ 
      success: false, 
      message: 'Terjadi kesalahan server internal.',
      error: err.message
    }, { status: 500 });
  }
}
