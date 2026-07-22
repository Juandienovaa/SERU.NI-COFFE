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
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'online_orders' }, (payload) => {
      console.log('REALTIME UPDATE RECEIVED:', payload);
    })
    .subscribe(async (status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Triggering update...');
        const { error } = await supabase.from('online_orders').update({ notes: 'test_realtime_' + Date.now() }).eq('id', order.id);
        if (error) console.error('Update error:', error);
        else console.log('Update sent.');
      }
    });

  // wait 5 seconds then exit
  setTimeout(() => {
    console.log('Done.');
    process.exit(0);
  }, 5000);
}

testRealtime();
