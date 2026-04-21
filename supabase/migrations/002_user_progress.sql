-- user_progress: 훈련 시스템 유닛별 섹션 진도
-- unit_id는 아직 units 테이블이 확정되지 않아 text로 저장 (예: 'topik1_u01').
-- 향후 units(id uuid)로 정규화 시 migration으로 교체.

create table if not exists public.user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  unit_id      text not null,
  section      text not null check (section in ('session','words','patterns','test','ai')),
  completed    boolean not null default false,
  score        int,
  total        int,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, unit_id, section)
);

create index if not exists user_progress_user_unit_idx
  on public.user_progress (user_id, unit_id);

-- RLS: 본인 진도만 읽기 / 쓰기
alter table public.user_progress enable row level security;

drop policy if exists user_progress_select_own on public.user_progress;
create policy user_progress_select_own
  on public.user_progress for select
  using (auth.uid() = user_id);

drop policy if exists user_progress_insert_own on public.user_progress;
create policy user_progress_insert_own
  on public.user_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists user_progress_update_own on public.user_progress;
create policy user_progress_update_own
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
create or replace function public.touch_user_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_progress_updated_at on public.user_progress;
create trigger user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.touch_user_progress_updated_at();
