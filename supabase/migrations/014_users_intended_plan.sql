-- users.intended_plan 컬럼 추가
-- 2026.04.25 확정 정책: /pricing STEP1에서 선택한 상품을 회원 프로필에 저장
-- 미결제 재로그인 시 "이전 선택 있어요" 화면 노출 + Stripe Checkout 재진입에 사용

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS intended_plan text;

ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_intended_plan_check;

ALTER TABLE public.users
ADD CONSTRAINT users_intended_plan_check
CHECK (
  intended_plan IS NULL
  OR intended_plan IN (
    'topik1_basic',
    'topik1_premium',
    'topik2_basic',
    'topik2_premium',
    'eps_basic',
    'eps_premium'
  )
);

COMMENT ON COLUMN public.users.intended_plan IS '/pricing STEP1에서 선택한 상품. 결제 완료 시 null로 초기화';
