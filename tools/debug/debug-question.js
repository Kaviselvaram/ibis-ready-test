import { createClient } from "@supabase/supabase-js";
import { env } from "../../backend/src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id, prompt, options, difficulty_level, correct_answer,
      topics (
        title,
        chapters ( title )
      )
    `);
  if (error) console.error("Error:", error);
  else console.log("Success, count:", data?.length);
}
test();
