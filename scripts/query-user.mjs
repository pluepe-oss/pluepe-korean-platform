import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/query-user.mjs <email>');
  process.exit(1);
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Missing env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: user, error: e1 } = await supabase
  .from('users')
  .select('id, email, role, academy_id')
  .eq('email', email)
  .maybeSingle();

if (e1) {
  console.error('users error:', e1);
  process.exit(1);
}
if (!user) {
  console.log(JSON.stringify({ found: false, email }, null, 2));
  process.exit(0);
}

const { data: academy } = user.academy_id
  ? await supabase
      .from('academies')
      .select('id, name')
      .eq('id', user.academy_id)
      .maybeSingle()
  : { data: null };

const { data: subs } = await supabase
  .from('subscriptions')
  .select(
    'status, plan_type, plan_tier, trial_ends_at, current_period_end, created_at',
  )
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

console.log(
  JSON.stringify(
    {
      email: user.email,
      role: user.role,
      academy_id: user.academy_id,
      academy_name: academy?.name ?? null,
      subscriptions: subs ?? [],
    },
    null,
    2,
  ),
);
