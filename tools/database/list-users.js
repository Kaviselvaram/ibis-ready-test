import { createClient } from "@supabase/supabase-js";
import { env } from "../../backend/src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function list() {
  const { data: users } = await supabase.auth.admin.listUsers();
  for (const u of users.users) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', u.id).single();
    console.log(`Email: ${u.email}, Role: ${profile?.is_admin ? 'Admin' : 'Student'}`);
  }
}
list();
