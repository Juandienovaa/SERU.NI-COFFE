require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtime() {
  console.log('Fetching order...');
  const { data: orders, error: fetchErr } = await supabase.from('online_orders').select('id, order_status').limit(1);
  if (fetchErr || !orders || orders.length === 0) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  const order = orders[0];
  console.log('Order:', order);

  console.log('Subscribing to realtime...');
  const channel = supabase.channel('test_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'online_orders' }, (payload) => {
      console.log('REALTIME EVENT RECEIVED:', payload.eventType);
    })
    .subscribe(async (status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Triggering insert...');
        const { error } = await supabase.from('online_orders').insert([{
          invoice_number: 'TEST-RT',
          order_type: 'DELIVERY',
          customer_name: 'test',
          customer_phone: '123',
          delivery_address: 'test',
          payment_method: 'QRIS',
          subtotal: 0,
          delivery_fee: 0,
          discount: 0,
          grand_total: 0
        }]);
        if (error) console.error('Insert error:', error);
        else console.log('Insert sent.');
      }
    });

  // wait 5 seconds then exit
  setTimeout(() => {
    console.log('Done.');
    process.exit(0);
  }, 5000);
}

testRealtime();
