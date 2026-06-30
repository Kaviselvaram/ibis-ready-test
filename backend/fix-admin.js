import { createClient } from "@supabase/supabase-js";
import { env } from "./src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const email = "testadmin@ibis.com";
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  if (user) {
    await supabase.auth.admin.updateUserById(user.id, { password: "password123" });
    await supabase.from('profiles').update({ is_admin: true }).eq('id', user.id);
    console.log("Admin fixed!");
  } else {
    console.log("Admin not found!");
  }
}
fix();
