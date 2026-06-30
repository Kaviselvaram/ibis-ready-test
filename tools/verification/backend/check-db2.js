import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const t1 = await supabase.from('subscriptions').select('*').limit(1);
  console.log("subscriptions:", t1.error ? t1.error.message : 'exists');
  const t2 = await supabase.from('test_attempts').select('*').limit(1);
  console.log("test_attempts:", t2.error ? t2.error.message : 'exists');
}
check();
