-- 유료 강의 시드. 비구독자 paywall, 결제, 재생 E2E 테스트용.
-- stream_video_id는 Cloudflare Stream 대시보드에서 복사한 Video UID.
-- 영상은 requireSignedURLs=true로 설정되어 있어야 한다.

insert into public.courses (
  type,
  title,
  description,
  level,
  display_order,
  stream_video_id,
  duration_seconds,
  subtitle_lang,
  is_free,
  is_published
) values (
  'topik1',
  '[유료] TOPIK 1 실전 모의고사 해설 1강',
  '비구독자는 paywall 모달이 노출되고, 체험/구독자만 재생할 수 있는 유료 샘플 강의.',
  1,
  100,
  '37827d246ba393ddcc1b78c3e7115759',
  720,
  'id',
  false,
  true
);
