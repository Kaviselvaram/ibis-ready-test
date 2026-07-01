import { getServiceSupabase } from "../../backend/src/config/supabase.js";

async function run() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.rpc('get_schema');
  
  // If rpc doesn't exist, we can just fetch some data to see if it fails.
  const tables = ['profiles', 'test_attempts', 'test_results', 'questions', 'sealed_answers', 'deletion_log'];
  
  for (const table of tables) {
    const { data: tData, error: tErr } = await supabase.from(table).select('*').limit(1);
    if (tErr) {
      console.error(`Error fetching ${table}:`, tErr.message);
    } else {
      console.log(`Table ${table} exists. Columns:`, tData.length ? Object.keys(tData[0]).join(', ') : 'Empty');
    }
  }
}
run().catch(console.error);
