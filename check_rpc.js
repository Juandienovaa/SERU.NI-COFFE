import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envObj = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    envObj[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
  }
});

const supabase = createClient(envObj['NEXT_PUBLIC_SUPABASE_URL'], envObj['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function run() {
  // Let's get the definition of rpc_close_shift
  const { data, error } = await supabase.rpc('rpc_close_shift', { p_shift_id: "00000000-0000-0000-0000-000000000000" });
  console.log(error);
}

run();
