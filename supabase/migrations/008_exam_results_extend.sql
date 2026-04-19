-- 시험 결과 테이블 확장 — 섹션/카테고리별 집계와 소요 시간 기록용
-- exam_type, total_questions는 이미 존재하지만 IF NOT EXISTS로 안전하게 호출한다.

alter table public.exam_results
  add column if not exists exam_type           text,
  add column if not exists section             text default 'mixed',
  add column if not exists total_questions     int,
  add column if not exists correct_count       int,
  add column if not exists time_taken_seconds  int,
  add column if not exists category_breakdown  jsonb,
  add column if not exists created_at          timestamptz not null default now();

create index if not exists idx_exam_results_user_created_at
  on public.exam_results(user_id, created_at desc);

create index if not exists idx_exam_results_exam_type_created_at
  on public.exam_results(exam_type, created_at desc);
