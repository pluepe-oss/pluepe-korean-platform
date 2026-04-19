-- Admin 대시보드 E2E 검증용 시드.
-- 본인 계정(pluepe@gmail.com)을 admin으로 승격하고
-- 테스트 학원 1건과 좌석 10석을 생성한다.
-- 재실행 안전 (이미 존재하면 갱신만).

do $$
declare
  v_admin_email text := 'pluepe@gmail.com';
  v_academy_name text := 'pluepe 테스트 학원';
  v_admin_id    uuid;
  v_academy_id  uuid;
begin
  -- 1. pluepe@gmail.com user 조회
  select id into v_admin_id
    from public.users
    where email = v_admin_email;

  if v_admin_id is null then
    raise exception
      '% 계정이 public.users에 없습니다. Supabase Auth로 먼저 회원가입해 주세요.',
      v_admin_email;
  end if;

  -- 2. 테스트 학원 upsert (이름 기준)
  select id into v_academy_id
    from public.academies
    where name = v_academy_name;

  if v_academy_id is null then
    insert into public.academies (name, country_code, owner_user_id, contact_email)
    values (v_academy_name, 'KR', v_admin_id, v_admin_email)
    returning id into v_academy_id;
  else
    update public.academies
      set owner_user_id = v_admin_id,
          contact_email = v_admin_email
      where id = v_academy_id;
  end if;

  -- 3. user role을 admin으로 승격 + academy_id 매핑
  update public.users
    set role = 'admin',
        academy_id = v_academy_id,
        country_code = coalesce(country_code, 'KR')
    where id = v_admin_id;

  -- 4. seats 행 생성 (총 10석 / 사용 0석)
  --    재실행 시 total만 10으로 맞추고 used는 그대로 둔다
  --    (check 제약: used <= total).
  insert into public.seats (academy_id, total, used)
    values (v_academy_id, 10, 0)
    on conflict (academy_id) do update
      set total = greatest(excluded.total, public.seats.used);

  raise notice 'Seed 완료: academy_id=%, admin_id=%', v_academy_id, v_admin_id;
end $$;
