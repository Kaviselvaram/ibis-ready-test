import { getServiceSupabase } from "./backend/src/config/supabase.js";
async function run() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.rpc('execute_sql', { sql: 'SELECT 1;' });
  console.log(data, error);
}
run().catch(console.error);
