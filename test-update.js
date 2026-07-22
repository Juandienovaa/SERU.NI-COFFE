require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const { data: orders, error: fetchErr } = await supabase.from('online_orders').select('id, payment_status, order_status').limit(1);
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  if (!orders || orders.length === 0) {
    console.log('No orders found');
    return;
  }
  
  const order = orders[0];
  console.log('Found order:', order);
  
  const { data, error } = await supabase.from('online_orders')
    .update({ order_status: 'PROCESSING' })
    .eq('id', order.id)
    .select();
    
  if (error) {
    console.error('UPDATE ERROR:', error);
  } else {
    console.log('Update success:', data);
  }
}

testUpdate();
