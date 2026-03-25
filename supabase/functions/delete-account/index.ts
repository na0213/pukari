import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('Authorization');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Missing Supabase environment variables' }, 500);
  }

  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const uid = user.id;

  const deleteResults = await Promise.all([
    admin.from('profiles').delete().eq('id', uid),
    admin.from('bubbles').delete().eq('user_id', uid),
    admin.from('bubble_logs').delete().eq('user_id', uid),
    admin.from('daily_skies').delete().eq('user_id', uid),
    admin.from('lagoon_bubbles').delete().eq('user_id', uid),
  ]);

  for (const result of deleteResults) {
    if (result.error) {
      return json({ error: result.error.message }, 500);
    }
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(uid);
  if (authDeleteError) {
    return json({ error: authDeleteError.message }, 500);
  }

  return json({ ok: true });
});
