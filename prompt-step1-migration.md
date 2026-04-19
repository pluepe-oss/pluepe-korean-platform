CLAUDE.md와 PROGRESS.md 읽고 아래 작업만 해줘.

## 작업: DB 마이그레이션 파일 2개 생성

### 007_questions_table.sql
`supabase/migrations/007_questions_table.sql` 생성:

- questions 테이블 생성
  컬럼: id(uuid pk default gen_random_uuid()),
        exam_type text not null check (topik1/topik2/eps-topik),
        section text not null check (listening/reading),
        question_number int not null,
        question_text text,
        passage text,
        audio_url text,
        image_url text,
        options jsonb not null,   -- [{"num":1,"text":"..."},...]
        correct_answer int not null,  -- 1~4
        explanation text,
        category text,            -- vocabulary/grammar/comprehension/practical
        difficulty int default 1 check (1~3),
        is_free boolean default false,
        is_published boolean default true,
        created_at timestamptz default now()
  unique: (exam_type, section, question_number)

- RLS 설정:
  SELECT: is_published = true 이면 누구나 가능
  ALL(insert/update/delete): is_master() 함수로만 가능

- 샘플 시드 데이터:
  TOPIK 1 읽기 5문항 (is_free=true) — 실제 TOPIK 1 수준 문제
  TOPIK 1 읽기 3문항 (is_free=false)
  EPS-TOPIK 읽기 3문항 (is_free=true) — 산업/근로 관련 실용 문제
  TOPIK 1 듣기 3문항 (is_free=true, audio_url=null, 스크립트 텍스트로 대체)

### 008_exam_results_extend.sql
`supabase/migrations/008_exam_results_extend.sql` 생성:

- exam_results 테이블에 ADD COLUMN IF NOT EXISTS:
  exam_type text,
  section text default 'mixed',
  total_questions int,
  correct_count int,
  time_taken_seconds int,
  category_breakdown jsonb,
  created_at timestamptz default now()

- 인덱스 생성:
  (user_id, created_at DESC)
  (exam_type, created_at DESC)

## 완료 후
두 파일 내용 보여줘. 확인하고 다음 단계 진행할게.
