import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const authHeader = req.headers.get('x-ibis-internal-secret') || '';
    const secret = Deno.env.get('INTERNAL_WEBHOOK_SECRET') || '';

    if (!secret || secret.length < 32 || !timingSafeEqual(authHeader, secret)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { userId, plainPassword } = await req.json();
    if (!userId || !plainPassword) {
      return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: costData, error: costError } = await supabase.rpc('get_user_hash_cost', { p_user_id: userId });
    if (costError || !costData?.[0]) {
      return new Response(JSON.stringify({ error: 'Failed to read cost' }), { status: 500 });
    }

    const currentCost = costData[0].cost;
    if (currentCost < 12) {
      const newHash = await bcrypt.hash(plainPassword, { cost: 12 });
      const { error: updateError } = await supabase.rpc('update_user_password_hash', { p_user_id: userId, p_new_hash: newHash });
      
      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update hash' }), { status: 500 });
      }
      
      return new Response(JSON.stringify({ status: 'upgraded' }), { status: 200 });
    }

    return new Response(JSON.stringify({ status: 'no_upgrade_needed' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
