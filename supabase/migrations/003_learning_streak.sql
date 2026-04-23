-- 003_learning_streak.sql
-- 학습 시작일 + 연속 학습일(streak) 추적용 컬럼 추가.
--   · users.learning_start_date    : 첫 학습 시작일 (유닛1 첫 섹션 완료 시 자동 저장)
--   · users.streak                 : 연속 학습일 (하루 1섹션 이상 완료 시 +1)
--   · user_progress.activity_date  : 섹션 완료한 날짜 (streak 계산 기준)
--
-- 재실행 안전: add column if not exists / create index if not exists 사용.

alter table public.users
  add column if not exists learning_start_date timestamptz,
  add column if not exists streak int default 0;

alter table public.user_progress
  add column if not exists activity_date date;

-- streak 계산 시 "user × 날짜" 단위로 집계하므로 복합 인덱스 추가
create index if not exists user_progress_user_activity_date_idx
  on public.user_progress (user_id, activity_date);
