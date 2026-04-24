-- subscriptions.plan_tier 컬럼 추가 + plan_type CHECK 제약 완화
-- 2026.04.26 확정 정책: 상품 체계를 (topik1 / topik2 / eps) × (basic / premium) 로 재정의

-- 1) plan_tier 컬럼 추가 (Basic / Premium 등급 구분)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT 'basic';

-- 2) plan_type CHECK 제약 제거
--    기존: b2c_monthly / b2c_yearly / b2b_monthly (Stripe 라이프사이클 기준)
--    변경: 상품 카테고리(topik1 / topik2 / eps)를 허용하도록 제약 완화
--    추후 enum 정식화 시 재부착 예정
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
