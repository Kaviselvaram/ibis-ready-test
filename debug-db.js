import { createClient } from "@supabase/supabase-js";
import { env } from "./backend/src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: chapters, error: cErr } = await supabase.from('chapters').select('*');
  console.log("Chapters:", chapters ? chapters.length : cErr);
  const { data: topics, error: tErr } = await supabase.from('topics').select('*');
  console.log("Topics:", topics ? topics.length : tErr);
  const { data: qns, error: qErr } = await supabase.from('questions').select('*');
  console.log("Questions:", qns ? qns.length : qErr);
}
test();
