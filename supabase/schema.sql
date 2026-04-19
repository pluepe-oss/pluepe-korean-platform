create extension if not exists pgcrypto;

create table if not exists public.academies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  country_code  text not null,
  owner_user_id uuid,
  contact_email text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.users (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text not null unique,
  name               text,
  role               text not null default 'student' check (role in ('master','admin','student')),
  academy_id         uuid references public.academies(id) on delete set null,
  country_code       text,
  preferred_language text default 'ko',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.academies
  drop constraint if exists academies_owner_user_id_fkey;
alter table public.academies
  add constraint academies_owner_user_id_fkey
  foreign key (owner_user_id) references public.users(id) on delete set null;

create table if not exists public.courses (
  id               uuid primary key default gen_random_uuid(),
  type             text not null check (type in ('topik1','topik2','eps-topik')),
  title            text not null,
  description      text,
  level            int,
  display_order    int  not null default 0,
  stream_video_id  text,
  duration_seconds int,
  subtitle_lang    text,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.progress (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users(id)  on delete cascade,
  course_id              uuid not null references public.courses(id) on delete cascade,
  percent                int  not null default 0 check (percent between 0 and 100),
  last_position_seconds  int  not null default 0,
  completed_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.exam_results (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  exam_type       text not null check (exam_type in ('topik1','topik2','eps-topik')),
  score           int  not null,
  total_questions int  not null,
  answers         jsonb,
  taken_at        timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id                           uuid primary key default gen_random_uuid(),
  user_id                      uuid references public.users(id)     on delete cascade,
  academy_id                   uuid references public.academies(id) on delete cascade,
  stripe_subscription_id       text unique,
  stripe_customer_id           text,
  status                       text not null check (status in ('trialing','active','past_due','canceled','incomplete')),
  plan_type                    text not null check (plan_type in ('b2c_monthly','b2c_yearly','b2b_monthly')),
  seats                        int  not null default 1 check (seats >= 1),
  trial_ends_at                timestamptz,
  current_period_end           timestamptz,
  trial_reminder_3d_sent_at    timestamptz,
  trial_reminder_1d_sent_at    timestamptz,
  trial_reminder_0d_sent_at    timestamptz,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  check ((user_id is not null) <> (academy_id is not null))
);

create table if not exists public.seats (
  academy_id  uuid primary key references public.academies(id) on delete cascade,
  total       int not null default 0 check (total >= 0),
  used        int not null default 0 check (used  >= 0),
  updated_at  timestamptz not null default now(),
  check (used <= total)
);

create table if not exists public.pricing_default (
  id            uuid primary key default gen_random_uuid(),
  plan_type     text not null check (plan_type in ('b2c_monthly','b2c_yearly','b2b_monthly')),
  interval      text not null check (interval in ('month','year')),
  amount_cents  int  not null check (amount_cents >= 0),
  currency      text not null default 'USD',
  unique (plan_type, interval)
);

create table if not exists public.pricing_country (
  id            uuid primary key default gen_random_uuid(),
  country_code  text not null,
  plan_type     text not null check (plan_type in ('b2c_monthly','b2c_yearly','b2b_monthly')),
  interval      text not null check (interval in ('month','year')),
  amount_cents  int  not null check (amount_cents >= 0),
  currency      text not null,
  unique (country_code, plan_type, interval)
);

create table if not exists public.pricing_academy (
  id            uuid primary key default gen_random_uuid(),
  academy_id    uuid not null references public.academies(id) on delete cascade,
  plan_type     text not null check (plan_type in ('b2c_monthly','b2c_yearly','b2b_monthly')),
  interval      text not null check (interval in ('month','year')),
  amount_cents  int  not null check (amount_cents >= 0),
  currency      text not null,
  unique (academy_id, plan_type, interval)
);

create index if not exists idx_courses_subtitle_lang  on public.courses(subtitle_lang);
create index if not exists idx_users_academy          on public.users(academy_id);
create index if not exists idx_users_role             on public.users(role);
create index if not exists idx_progress_user          on public.progress(user_id);
create index if not exists idx_progress_course        on public.progress(course_id);
create index if not exists idx_exam_results_user     on public.exam_results(user_id);
create index if not exists idx_subscriptions_user    on public.subscriptions(user_id);
create index if not exists idx_subscriptions_academy on public.subscriptions(academy_id);
create index if not exists idx_subscriptions_status  on public.subscriptions(status);
create index if not exists idx_subscriptions_trial_ends_at
  on public.subscriptions(trial_ends_at)
  where status = 'trialing';

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text language sql security definer stable set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_user_academy()
returns uuid language sql security definer stable set search_path = public as $$
  select academy_id from public.users where id = auth.uid();
$$;

create or replace function public.is_master()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'master');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists users_updated_at          on public.users;
drop trigger if exists academies_updated_at      on public.academies;
drop trigger if exists courses_updated_at        on public.courses;
drop trigger if exists progress_updated_at       on public.progress;
drop trigger if exists subscriptions_updated_at  on public.subscriptions;
drop trigger if exists seats_updated_at          on public.seats;

create trigger users_updated_at         before update on public.users         for each row execute function public.set_updated_at();
create trigger academies_updated_at     before update on public.academies     for each row execute function public.set_updated_at();
create trigger courses_updated_at       before update on public.courses       for each row execute function public.set_updated_at();
create trigger progress_updated_at      before update on public.progress      for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger seats_updated_at         before update on public.seats         for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.users           enable row level security;
alter table public.academies       enable row level security;
alter table public.courses         enable row level security;
alter table public.progress        enable row level security;
alter table public.exam_results    enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.seats           enable row level security;
alter table public.pricing_default enable row level security;
alter table public.pricing_country enable row level security;
alter table public.pricing_academy enable row level security;

drop policy if exists users_self_select                on public.users;
drop policy if exists users_self_update                on public.users;
drop policy if exists users_admin_same_academy_select  on public.users;
drop policy if exists users_master_all                 on public.users;

create policy users_self_select on public.users
  for select using (id = auth.uid());

create policy users_self_update on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy users_admin_same_academy_select on public.users
  for select using (
    public.current_user_role() = 'admin'
    and academy_id = public.current_user_academy()
  );

create policy users_master_all on public.users
  for all using (public.is_master()) with check (public.is_master());

drop policy if exists academies_member_select on public.academies;
drop policy if exists academies_admin_update  on public.academies;
drop policy if exists academies_master_all    on public.academies;

create policy academies_member_select on public.academies
  for select using (
    public.is_master() or id = public.current_user_academy()
  );

create policy academies_admin_update on public.academies
  for update using (
    public.is_master()
    or (public.current_user_role() = 'admin' and id = public.current_user_academy())
  )
  with check (
    public.is_master()
    or (public.current_user_role() = 'admin' and id = public.current_user_academy())
  );

create policy academies_master_all on public.academies
  for all using (public.is_master()) with check (public.is_master());

drop policy if exists courses_authenticated_select on public.courses;
drop policy if exists courses_master_all           on public.courses;

create policy courses_authenticated_select on public.courses
  for select using (
    auth.uid() is not null and (is_published or public.is_master())
  );

create policy courses_master_all on public.courses
  for all using (public.is_master()) with check (public.is_master());

drop policy if exists progress_self                      on public.progress;
drop policy if exists progress_admin_same_academy_select on public.progress;
drop policy if exists progress_master_all                on public.progress;

create policy progress_self on public.progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy progress_admin_same_academy_select on public.progress
  for select using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.users u
      where u.id = progress.user_id and u.academy_id = public.current_user_academy()
    )
  );

create policy progress_master_all on public.progress
  for all using (public.is_master()) with check (public.is_master());

drop policy if exists exam_results_self                      on public.exam_results;
drop policy if exists exam_results_admin_same_academy_select on public.exam_results;
drop policy if exists exam_results_master_all                on public.exam_results;

create policy exam_results_self on public.exam_results
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy exam_results_admin_same_academy_select on public.exam_results
  for select using (
    public.current_user_role() = 'admin'
    and exists (
      select 1 from public.users u
      where u.id = exam_results.user_id and u.academy_id = public.current_user_academy()
    )
  );

create policy exam_results_master_all on public.exam_results
  for all using (public.is_master()) with check (public.is_master());

drop policy if exists subscriptions_self_or_admin_select  on public.subscriptions;
drop policy if exists subscriptions_self_or_member_select on public.subscriptions;
drop policy if exists subscriptions_master_all            on public.subscriptions;

create policy subscriptions_self_or_member_select on public.subscriptions
  for select using (
    user_id = auth.uid()
    or (
      academy_id is not null
      and academy_id = public.current_user_academy()
    )
  );

create policy subscriptions_master_all on public.subscriptions
  for all using (public.is_master()) with check (public.is_master());

drop policy if exists seats_academy_select on public.seats;
drop policy if exists seats_master_all     on public.seats;

create policy seats_academy_select on public.seats
  for select using (
    public.is_master() or academy_id = public.current_user_academy()
  );

create policy seats_master_all on public.seats
  for all using (public.is_master()) with check (public.is_master());

drop policy if exists pricing_default_read_all     on public.pricing_default;
drop policy if exists pricing_default_master_write on public.pricing_default;
drop policy if exists pricing_country_read_all     on public.pricing_country;
drop policy if exists pricing_country_master_write on public.pricing_country;

create policy pricing_default_read_all on public.pricing_default
  for select using (true);
create policy pricing_default_master_write on public.pricing_default
  for all using (public.is_master()) with check (public.is_master());

create policy pricing_country_read_all on public.pricing_country
  for select using (true);
create policy pricing_country_master_write on public.pricing_country
  for all using (public.is_master()) with check (public.is_master());

drop policy if exists pricing_academy_member_select on public.pricing_academy;
drop policy if exists pricing_academy_master_write  on public.pricing_academy;

create policy pricing_academy_member_select on public.pricing_academy
  for select using (
    public.is_master() or academy_id = public.current_user_academy()
  );
create policy pricing_academy_master_write on public.pricing_academy
  for all using (public.is_master()) with check (public.is_master());

insert into public.pricing_default (plan_type, interval, amount_cents, currency) values
  ('b2c_monthly', 'month',  999, 'USD'),
  ('b2c_yearly',  'year',  8900, 'USD'),
  ('b2b_monthly', 'month',  700, 'USD')
on conflict (plan_type, interval) do nothing;

create or replace function public.resolve_price(
  p_plan_type text,
  p_interval  text,
  p_country   text default null,
  p_academy   uuid default null
)
returns table(amount_cents int, currency text)
language sql stable as $$
  with candidates as (
    select 1 as priority, amount_cents, currency
      from public.pricing_academy
      where academy_id = p_academy and plan_type = p_plan_type and interval = p_interval
    union all
    select 2, amount_cents, currency
      from public.pricing_country
      where country_code = p_country and plan_type = p_plan_type and interval = p_interval
    union all
    select 3, amount_cents, currency
      from public.pricing_default
      where plan_type = p_plan_type and interval = p_interval
  )
  select amount_cents, currency from candidates order by priority limit 1;
$$;
