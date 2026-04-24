# scripts/

## query-user.mjs
특정 유저의 role / academy / subscription 상태를 조회하는 스크립트.

사용법:
  node scripts/query-user.mjs pluepe@gmail.com

필요 환경변수:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY (.env.local 에서 읽음)
