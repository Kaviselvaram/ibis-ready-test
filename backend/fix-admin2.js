import { createClient } from "@supabase/supabase-js";
import { env } from "./src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const email = "testadmin@ibis.com";
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  if (user) {
    const { error } = await supabase.from('profiles').insert([{
      id: user.id,
      full_name: "Test Admin",
      is_admin: true
    }]);
    if (error) {
      console.error("Insert failed:", error);
      // Maybe it already exists, so try update
      await supabase.from('profiles').update({ is_admin: true }).eq('id', user.id);
    }
    console.log("Profile created/updated.");
  }
}
fix();
