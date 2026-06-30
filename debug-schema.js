import { createClient } from "@supabase/supabase-js";
import { env } from "./backend/src/config/env.js";
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('questions').select('*').limit(1);
  console.log(error || Object.keys(data[0]));
}
test();
