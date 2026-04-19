-- subscriptions에 체험 종료 리마인더 발송 타임스탬프 3개 추가
-- 중복 발송을 막기 위한 가장 간단한 구조 (row 자체에 sent 여부 기록).
-- 확장이 필요해지면 별도 email_logs 테이블로 이관.

alter table public.subscriptions
  add column if not exists trial_reminder_3d_sent_at timestamptz,
  add column if not exists trial_reminder_1d_sent_at timestamptz,
  add column if not exists trial_reminder_0d_sent_at timestamptz;

-- trialing 상태이고 종료일이 가까운 row만 자주 조회하게 될 것
create index if not exists idx_subscriptions_trial_ends_at
  on public.subscriptions(trial_ends_at)
  where status = 'trialing';
