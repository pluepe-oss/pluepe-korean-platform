-- preferred_language 기본값 null로 변경
ALTER TABLE public.users
ALTER COLUMN preferred_language SET DEFAULT null;

-- 기존 'ko' 값 null로 초기화
UPDATE public.users
SET preferred_language = null
WHERE preferred_language = 'ko';
