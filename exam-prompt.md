# pluepe 시험보기 기능 구현 — Claude Code 프롬프트

## 역할
너는 이 프로젝트의 시니어 풀스택 개발자야.
CLAUDE.md와 PROGRESS.md를 먼저 읽고 프로젝트 맥락을 파악한 뒤 작업해.

## 먼저 읽어야 할 파일
- CLAUDE.md         → 프로젝트 구조, 기술 스택, 설계 원칙
- PROGRESS.md       → 완료된 작업, 오늘 할 작업 목록
- supabase/schema.sql → DB 스키마 (특히 exam_results 테이블)

---

## 오늘 목표: 시험보기 기능 전체 구현

### STEP 1 — DB 마이그레이션 파일 생성

아래 2개 파일을 `supabase/migrations/` 에 생성해:

**007_questions_table.sql**
```
- questions 테이블 생성
  컬럼: id(uuid pk), exam_type(topik1/topik2/eps-topik), section(listening/reading),
        question_number(int), question_text(text), passage(text),
        audio_url(text), image_url(text), options(jsonb), correct_answer(int 1~4),
        explanation(text), category(text), difficulty(int 1~3),
        is_free(boolean default false), is_published(boolean default true), created_at

- RLS 설정:
  SELECT: is_published=true이면 모두 가능
  INSERT/UPDATE/DELETE: is_master()만 가능

- 샘플 시드 데이터 삽입:
  TOPIK 1 읽기 5문항 (is_free=true) + 3문항 (is_free=false)
  EPS-TOPIK 읽기 3문항 (is_free=true)
  TOPIK 1 듣기 3문항 (is_free=true, audio_url은 null로)
  options 형식: [{"num":1,"text":"..."},{"num":2,"text":"..."},...]
```

**008_exam_results_extend.sql**
```
- exam_results 테이블에 컬럼 추가 (ADD COLUMN IF NOT EXISTS):
  exam_type text, section text, total_questions int,
  correct_count int, time_taken_seconds int,
  category_breakdown jsonb, created_at timestamptz default now()

- 인덱스: (user_id, created_at DESC), (exam_type, created_at DESC)
```

---

### STEP 2 — API Route 생성

**app/api/exam/questions/route.ts** (GET)
```
쿼리: ?examType=topik1 (section 선택적)
인증: supabase.auth.getUser() → 미로그인 401 반환
구독 체크:
  users 테이블에서 academy_id 조회
  B2B: subscriptions where academy_id, status in (active, trialing)
  B2C: subscriptions where user_id, status in (active, trialing)
문제 쿼리:
  비구독자 → is_free=true만
  구독자 → 전체
  correct_answer는 절대 반환하지 말 것 (보안)
  select: id, exam_type, section, question_number, question_text,
          passage, audio_url, image_url, options, category, difficulty, is_free
응답: { questions, isSubscribed, totalCount }
```

**app/api/exam/submit/route.ts** (POST)
```
Body: { examType: string, answers: { [questionId]: number }, timeTakenSeconds: number }
인증: 미로그인 401
채점 로직:
  questions 테이블에서 correct_answer, category, section IN (questionIds) fetch
  각 answer와 correct_answer 비교 → correctCount 산출
  카테고리별 집계: { vocabulary: {correct:3,total:5}, ... }
  섹션별 집계:    { listening: {correct:8,total:10}, ... }
  score = Math.round(correctCount / total * 100)
exam_results insert:
  user_id, exam_type, score, answers(상세 jsonb), total_questions,
  correct_count, time_taken_seconds, category_breakdown
응답: { resultId, score, correctCount, totalQuestions, categoryBreakdown }
```

---

### STEP 3 — UI 페이지 생성

**app/learn/exam/page.tsx** (서버 컴포넌트)
```
- 로그인 체크 → 미로그인 /auth 리다이렉트
- 구독 여부 확인 (B2C + B2B 모두 체크)
- TOPIK 1 / TOPIK 2 / EPS-TOPIK 카드 3개 표시
  각 카드: 시험명, 설명, 문항수, 제한시간, 난이도 뱃지
  비구독자는 "샘플" 뱃지 + 무료 문항수 표시
- 비구독자용 업그레이드 배너 (→ /pricing)
- 최근 시험 기록 3개 (exam_results join, 날짜·점수·정답수)
- 모바일 우선 디자인 (Tailwind v4)
```

**app/learn/exam/[examType]/page.tsx** (서버 컴포넌트)
```
- examType: topik1 | topik2 | eps-topik — 없으면 notFound()
- 로그인·구독 상태 서버에서 확인
- ExamSession 클라이언트 컴포넌트에 { examType, config, isSubscribed } 전달
```

**app/learn/exam/[examType]/exam-session.tsx** ('use client')
```
Phase: intro → exam → submitting → (결과 페이지 redirect)

[intro 화면]
- 시험 정보 (섹션별 문항수, 제한시간, 합격기준)
- 주의사항 (시간초과 자동제출, 뒤로가기 주의)
- 비구독자 안내 + /pricing 링크
- "시험 시작하기" 버튼 → loadQuestions() → phase='exam'

[exam 화면]
상단 헤더 (sticky):
  나가기 버튼 / 현재문제(N/전체) / 타이머 (MM:SS, 5분미만 빨간색)
섹션 탭: 듣기 | 읽기 (각 답변수/전체수 표시)
진행 바 (answered/total)

문제 영역:
  문제번호 뱃지 + 카테고리 태그
  지문 (passage 있으면 파란 박스)
  문제 텍스트
  선지 4개 (선택시 emerald 하이라이트)
  오디오 버튼 (audio_url 있는 경우)

하단 (fixed):
  현재 섹션 문제 번호 그리드 (답변=초록, 현재=진한초록, 미답=회색)
  이전 | 다음 버튼 (마지막 문제에서 "제출하기"로 변경)

타이머: useEffect로 1초마다 감소 → 0 되면 자동 handleSubmit(true)
제출 확인 모달: "제출할까요?" 확인 후 POST /api/exam/submit

[submitting 화면]
  로딩 스피너 + "채점 중..."

상태관리: useState (phase, questions, answers, currentIdx, currentSec, timeLeft)
```

**app/learn/exam/result/[resultId]/page.tsx** (서버 컴포넌트)
```
- resultId로 exam_results fetch (user_id 본인 체크, 아니면 notFound)
- 점수 카드: 점수(크게), 합격/불합격 뱃지, 정답수, 소요시간
- 섹션별 막대 그래프 (듣기/읽기 정답률)
- 카테고리별 취약점 분석 막대 그래프 (낮은 순 정렬)
- 오답 노트:
  wrong answers id 목록 → questions 테이블에서 explanation 포함 fetch
  각 문항: 문제 텍스트 + 선지(정답=초록, 내답=빨강) + 해설 박스
- 하단 버튼: "다시 풀기" (→ /learn/exam/[examType]) | "시험 목록" (→ /learn/exam)
```

---

### STEP 4 — 마이페이지 시험 기록 연동 확인

`app/learn/me/page.tsx` 에서 exam_results 쿼리가
새로 추가된 컬럼(exam_type, correct_count, total_questions)을 활용하도록
select 절 업데이트 (이미 되어 있으면 패스)

---

## 설계 원칙 (반드시 준수)

1. 모든 DB 접근은 `@/lib/supabase/server` (서버) 또는 `@/lib/supabase/client` (클라이언트) 사용
2. API Route는 항상 `supabase.auth.getUser()`로 인증 먼저
3. `correct_answer`는 절대 클라이언트에 노출하지 말 것 — submit 시 서버에서만 채점
4. 구독 체크는 B2C(user_id)와 B2B(academy_id) 두 경로 모두 처리
5. TypeScript strict, Tailwind v4 클래스 사용
6. 모바일 우선 (max-width 없이 전체 너비, 하단 탭바 height 고려해 pb-24)
7. 에러는 try/catch + 사용자에게 한국어 메시지 표시
8. `profiles` 테이블 없음 — 항상 `public.users` 사용

---

## 작업 완료 후 체크리스트

- [ ] `npm run build` 에러 없음
- [ ] `/learn/exam` 페이지 렌더 확인
- [ ] `/learn/exam/topik1` 인트로 화면 확인
- [ ] 시험 시작 → 타이머 동작 → 답 선택 → 제출
- [ ] `/learn/exam/result/[id]` 오답 노트 렌더
- [ ] 마이페이지 시험 기록 반영 확인
- [ ] PROGRESS.md 업데이트
