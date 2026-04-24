-- 테스트 계정 10개 시드
-- 사전 단계: Supabase Dashboard → Authentication → Users → Add user 로
--           아래 10개 계정을 먼저 수동 생성 (password: Test1234!)
--
--   1. test_b2b@pluepe.com
--   2. test_trial@pluepe.com
--   3. test_expired@pluepe.com
--   4. test_t1_basic@pluepe.com
--   5. test_t1_premium@pluepe.com
--   6. test_t2_basic@pluepe.com
--   7. test_t2_premium@pluepe.com
--   8. test_eps_basic@pluepe.com
--   9. test_eps_premium@pluepe.com
--   10. test_freetrial@pluepe.com
--
-- handle_new_user 트리거가 public.users 행을 자동 생성하면
-- 이 스크립트가 role / academy_id / subscriptions 를 설정한다.
-- 각 블록은 user_id 를 찾지 못하면 조용히 skip → 부분 생성 상태에서도 재실행 안전.
-- EXCEPTION WHEN OTHERS THEN NULL 로 블록 단위 오류도 격리.

-- ============================================================
-- [1] test_b2b@pluepe.com — B2B 학원생 (pluepe 테스트 학원 소속)
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
  v_academy_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_b2b@pluepe.com';
  SELECT id INTO v_academy_id FROM public.academies WHERE name = 'pluepe 테스트 학원' LIMIT 1;
  IF v_user_id IS NULL OR v_academy_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.users
     SET role = 'student', academy_id = v_academy_id
   WHERE id = v_user_id;

  -- B2B는 학원 구독을 따라가므로 개인 subscriptions 는 삭제
  DELETE FROM public.subscriptions WHERE user_id = v_user_id;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- [2] test_trial@pluepe.com — 체험 중 (trialing, +5일)
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_trial@pluepe.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.users
     SET role = 'student', academy_id = NULL
   WHERE id = v_user_id;

  DELETE FROM public.subscriptions WHERE user_id = v_user_id;

  INSERT INTO public.subscriptions
    (user_id, status, plan_type, plan_tier, trial_ends_at, current_period_end)
  VALUES
    (v_user_id, 'trialing', 'topik1', 'basic',
     now() + interval '5 days',
     now() + interval '5 days');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- [3] test_expired@pluepe.com — 체험 만료 (trialing, -2일 지남)
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_expired@pluepe.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.users
     SET role = 'student', academy_id = NULL
   WHERE id = v_user_id;

  DELETE FROM public.subscriptions WHERE user_id = v_user_id;

  INSERT INTO public.subscriptions
    (user_id, status, plan_type, plan_tier, trial_ends_at, current_period_end)
  VALUES
    (v_user_id, 'trialing', 'topik1', 'basic',
     now() - interval '2 days',
     now() - interval '2 days');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- [4] test_t1_basic@pluepe.com — TOPIK 1 Basic
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_t1_basic@pluepe.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.users
     SET role = 'student', academy_id = NULL
   WHERE id = v_user_id;

  DELETE FROM public.subscriptions WHERE user_id = v_user_id;

  INSERT INTO public.subscriptions
    (user_id, status, plan_type, plan_tier, current_period_end)
  VALUES
    (v_user_id, 'active', 'topik1', 'basic',
     now() + interval '30 days');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- [5] test_t1_premium@pluepe.com — TOPIK 1 Premium
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_t1_premium@pluepe.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.users
     SET role = 'student', academy_id = NULL
   WHERE id = v_user_id;

  DELETE FROM public.subscriptions WHERE user_id = v_user_id;

  INSERT INTO public.subscriptions
    (user_id, status, plan_type, plan_tier, current_period_end)
  VALUES
    (v_user_id, 'active', 'topik1', 'premium',
     now() + interval '30 days');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- [6] test_t2_basic@pluepe.com — TOPIK 2 Basic
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_t2_basic@pluepe.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.users
     SET role = 'student', academy_id = NULL
   WHERE id = v_user_id;

  DELETE FROM public.subscriptions WHERE user_id = v_user_id;

  INSERT INTO public.subscriptions
    (user_id, status, plan_type, plan_tier, current_period_end)
  VALUES
    (v_user_id, 'active', 'topik2', 'basic',
     now() + interval '30 days');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- [7] test_t2_premium@pluepe.com — TOPIK 2 Premium
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_t2_premium@pluepe.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.users
     SET role = 'student', academy_id = NULL
   WHERE id = v_user_id;

  DELETE FROM public.subscriptions WHERE user_id = v_user_id;

  INSERT INTO public.subscriptions
    (user_id, status, plan_type, plan_tier, current_period_end)
  VALUES
    (v_user_id, 'active', 'topik2', 'premium',
     now() + interval '30 days');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- [8] test_eps_basic@pluepe.com — EPS-TOPIK Basic
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_eps_basic@pluepe.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.users
     SET role = 'student', academy_id = NULL
   WHERE id = v_user_id;

  DELETE FROM public.subscriptions WHERE user_id = v_user_id;

  INSERT INTO public.subscriptions
    (user_id, status, plan_type, plan_tier, current_period_end)
  VALUES
    (v_user_id, 'active', 'eps', 'basic',
     now() + interval '30 days');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- [9] test_eps_premium@pluepe.com — EPS-TOPIK Premium
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_eps_premium@pluepe.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.users
     SET role = 'student', academy_id = NULL
   WHERE id = v_user_id;

  DELETE FROM public.subscriptions WHERE user_id = v_user_id;

  INSERT INTO public.subscriptions
    (user_id, status, plan_type, plan_tier, current_period_end)
  VALUES
    (v_user_id, 'active', 'eps', 'premium',
     now() + interval '30 days');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- [10] test_freetrial@pluepe.com — 무료체험 방문자
-- subscriptions 없음 → /my 접근 시 accountKind='none' → /pricing 리다이렉트
-- ============================================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email = 'test_freetrial@pluepe.com';
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.users
     SET role = 'student', academy_id = NULL
   WHERE id = v_user_id;

  DELETE FROM public.subscriptions WHERE user_id = v_user_id;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
