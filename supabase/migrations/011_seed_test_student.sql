-- 테스트용 학생 시드.
-- 전제: student1@test.com이 auth.users + public.users에 이미 존재.
-- 재실행 안전: 이미 해당 학원 student이면 전체 스킵.

do $$
declare
  v_student_email text := 'student1@test.com';
  v_academy_name  text := 'pluepe 테스트 학원';
  v_student_id    uuid;
  v_academy_id    uuid;
  v_current_role  text;
  v_current_acad  uuid;
begin
  -- 학생 + 학원 조회
  select id, role, academy_id
    into v_student_id, v_current_role, v_current_acad
    from public.users
    where email = v_student_email;
  if v_student_id is null then
    raise exception '% 계정이 public.users에 없습니다.', v_student_email;
  end if;

  select id into v_academy_id
    from public.academies
    where name = v_academy_name;
  if v_academy_id is null then
    raise exception '% 학원이 없습니다. migration 009를 먼저 실행해 주세요.', v_academy_name;
  end if;

  -- 이미 해당 학원 student이면 전체 스킵 (재실행 안전)
  if v_current_role = 'student' and v_current_acad = v_academy_id then
    raise notice '이미 매핑된 학생입니다. 스킵합니다. (student_id=%)', v_student_id;
    return;
  end if;

  -- role + academy_id UPDATE
  update public.users
    set role       = 'student',
        academy_id = v_academy_id
    where id = v_student_id;

  -- seats.used +1 (check 제약으로 total 초과 시 자동 차단)
  update public.seats
    set used       = used + 1,
        updated_at = now()
    where academy_id = v_academy_id;

  raise notice 'Seed 완료: student_id=%, academy_id=%', v_student_id, v_academy_id;
end $$;
