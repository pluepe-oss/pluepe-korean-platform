alter table public.courses
  add column if not exists is_free boolean not null default false;
