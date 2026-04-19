-- Admin → 학생 초대 플로우.
-- 초대 토큰으로 회원가입하면 academy_id 매핑 + seats.used +1.

create table if not exists public.invitations (
  id           uuid primary key default gen_random_uuid(),
  academy_id   uuid not null references public.academies(id) on delete cascade,
  email        text not null,
  token        text not null unique,
  invited_by   uuid references public.users(id) on delete set null,
  status       text not null default 'pending'
               check (status in ('pending','accepted','expired','revoked')),
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  accepted_by  uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_invitations_academy
  on public.invitations(academy_id);
create index if not exists idx_invitations_status
  on public.invitations(status);
create index if not exists idx_invitations_email_lower
  on public.invitations(lower(email));

-- 같은 학원에 같은 이메일로 pending이 둘 이상 생기지 않도록.
create unique index if not exists uq_invitations_academy_email_pending
  on public.invitations (academy_id, lower(email))
  where status = 'pending';

alter table public.invitations enable row level security;

drop policy if exists invitations_admin_same_academy_select on public.invitations;
drop policy if exists invitations_master_all                on public.invitations;

-- 클라이언트에서 admin은 자기 학원 초대 목록 조회 가능.
-- (insert/update/delete는 서버 API가 service role로만 처리)
create policy invitations_admin_same_academy_select on public.invitations
  for select using (
    public.current_user_role() = 'admin'
    and academy_id = public.current_user_academy()
  );

create policy invitations_master_all on public.invitations
  for all using (public.is_master()) with check (public.is_master());

-- 좌석 1개 증가 (atomic). 용량 초과 시 seats_exhausted 예외.
create or replace function public.seats_increment_used(p_academy uuid)
returns public.seats
language plpgsql
security definer
set search_path = public as $$
declare
  v_row public.seats;
begin
  update public.seats
    set used = used + 1,
        updated_at = now()
    where academy_id = p_academy
      and used < total
    returning * into v_row;
  if not found then
    raise exception 'seats_exhausted'
      using errcode = 'P0001',
            hint = '학원 좌석이 모두 소진되었습니다.';
  end if;
  return v_row;
end;
$$;

-- 초대 수락 (atomic).
-- 로그인된 사용자의 이메일이 초대 이메일과 일치하면:
--   1) academy_id 매핑 + role='student'
--   2) seats.used +1 (용량 초과 시 롤백)
--   3) invitation.status='accepted'
create or replace function public.accept_invitation(p_token text)
returns public.invitations
language plpgsql
security definer
set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_inv   public.invitations;
  v_email text;
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  select * into v_inv
    from public.invitations
    where token = p_token
    for update;
  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0001';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'invitation_already_%', v_inv.status
      using errcode = 'P0001';
  end if;
  if v_inv.expires_at < now() then
    update public.invitations
      set status = 'expired'
      where id = v_inv.id;
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  select email into v_email
    from public.users
    where id = v_uid;
  if not found then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;
  if lower(v_email) <> lower(v_inv.email) then
    raise exception 'email_mismatch' using errcode = 'P0001';
  end if;

  -- 좌석 증가 (실패 시 예외가 bubble up → 전체 트랜잭션 롤백).
  perform public.seats_increment_used(v_inv.academy_id);

  update public.users
    set academy_id = v_inv.academy_id,
        role       = 'student'
    where id = v_uid;

  update public.invitations
    set status      = 'accepted',
        accepted_at = now(),
        accepted_by = v_uid
    where id = v_inv.id
    returning * into v_inv;

  return v_inv;
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.seats_increment_used(uuid) to service_role;
