-- subscriptions RLS 보완: 학원 소속 student도 자기 학원 구독을 조회할 수 있도록 허용
-- 기존 정책은 admin만 academy 구독을 볼 수 있어, B2B 학원 student의 paywall 판정이 불가능했다.

drop policy if exists subscriptions_self_or_admin_select on public.subscriptions;
drop policy if exists subscriptions_self_or_member_select on public.subscriptions;

create policy subscriptions_self_or_member_select on public.subscriptions
  for select using (
    user_id = auth.uid()
    or (
      academy_id is not null
      and academy_id = public.current_user_academy()
    )
  );
