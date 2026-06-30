import { createClient } from "@supabase/supabase-js";
import { env } from "./src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const email = "testadmin@ibis.com";
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  if (user) {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    console.log("Profile:", profile);
    if (error) console.error("Error:", error);
  } else {
    console.log("Admin not found!");
  }
}
check();
