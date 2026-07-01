import { getServiceSupabase } from "../../backend/src/config/supabase.js";
async function run() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('test_attempts').select('*').limit(1);
  console.log('test_attempts:', data);
}
run().catch(console.error);
