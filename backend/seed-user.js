import { createClient } from "@supabase/supabase-js";
import { env } from "./src/config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log("Seeding test users...");
  
  // Student
  const { data: student, error: studentErr } = await supabase.auth.admin.createUser({
    email: 'teststudent@ibis.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { full_name: 'Test Student' }
  });
  
  if (studentErr && !studentErr.message.includes('already registered')) {
    console.error("Student err:", studentErr);
  } else {
    console.log("Student created/exists.");
  }
  
  // Admin
  const { data: admin, error: adminErr } = await supabase.auth.admin.createUser({
    email: 'testadmin@ibis.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { full_name: 'Test Admin' }
  });
  
  if (adminErr && !adminErr.message.includes('already registered')) {
    console.error("Admin err:", adminErr);
  } else {
    console.log("Admin created/exists.");
    
    // Set admin flag in profiles
    if (admin && admin.user) {
      await supabase.from('profiles').update({ is_admin: true }).eq('id', admin.user.id);
    } else {
      // If already registered, fetch ID and update
      const { data: users } = await supabase.auth.admin.listUsers();
      const adminUser = users.users.find(u => u.email === 'testadmin@ibis.com');
      if (adminUser) {
        await supabase.from('profiles').update({ is_admin: true }).eq('id', adminUser.id);
      }
    }
  }
  
  console.log("Done.");
}

seed().catch(console.error);
