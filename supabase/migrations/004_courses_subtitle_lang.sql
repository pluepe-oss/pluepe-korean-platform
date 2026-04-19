-- courses 테이블에 자막 언어 컬럼 추가
-- 하나의 강의가 여러 언어 자막을 가질 수 있지만, 현재는 "이 강의는 어떤 학습자 모국어 기준으로 제작되었는가"를 표시.
-- 추후 courses_subtitles 별도 테이블로 분리 가능 (지금은 YAGNI).

alter table public.courses
  add column if not exists subtitle_lang text;

create index if not exists idx_courses_subtitle_lang on public.courses(subtitle_lang);
