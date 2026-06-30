import { createClient } from "@supabase/supabase-js";
import { env } from "./backend/src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('topics')
    .select('id, title, chapters(title)');
  if (error) console.error("Error:", error);
  else {
    const topicMap = {};
    for (const t of data) {
      if (t.chapters) {
        topicMap[`${t.chapters.title}:${t.title}`] = t.id;
      }
    }
    console.log("Topic map keys:");
    Object.keys(topicMap).forEach(k => console.log(k));
  }
}
test();
