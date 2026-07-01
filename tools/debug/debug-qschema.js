import { createClient } from "@supabase/supabase-js";
import { env } from "../../backend/src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('questions').select('*').limit(1);
  console.log("Error:", error);
  console.log("Columns:", data && data.length > 0 ? Object.keys(data[0]) : "Empty");
  
  // Try inserting one
  const { error: iErr } = await supabase.from('questions').insert({
    id: "22222222-2222-2222-2222-222222222222",
    topic_id: "11111111-1111-1111-1111-111111111111", // invalid UUID might cause FK error
    prompt: "Test",
    options: ["A", "B"],
    correct_answer: "A",
    difficulty_level: 2
  });
  console.log("Insert err:", iErr);
}
test();
