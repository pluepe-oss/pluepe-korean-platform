-- 004_users_streak_rls.sql
-- users 테이블에 "본인 row UPDATE 허용" RLS 정책 추가.
-- /api/progress 의 섹션 완료 처리에서 users.streak 값을 갱신하려면
-- 이 정책이 있어야 Supabase auth 세션으로 update 가 통과한다.
--
-- 재실행 안전: 같은 이름 정책이 있으면 drop 후 재생성.

drop policy if exists users_update_own on public.users;

create policy users_update_own
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
