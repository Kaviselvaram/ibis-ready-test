import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('sealed_answers').select('*').limit(1);
  if (error) {
    console.error("sealed_answers error:", error.message);
  } else {
    console.log("sealed_answers exists!");
  }
}
check();
