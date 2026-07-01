import { createClient } from "@supabase/supabase-js";
import { env } from "../../backend/src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: chapters } = await supabase.from('chapters').select('id, title');
  console.log("Chapters:", chapters ? chapters.length : 0);
  console.log(chapters);
  
  const { data: topics } = await supabase.from('topics').select('id, title');
  console.log("Topics:", topics ? topics.length : 0);
  
  const { data: qns } = await supabase.from('questions').select('id');
  console.log("Questions:", qns ? qns.length : 0);
}
test();
