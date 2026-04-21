# CLAUDE.md — pluepe 한국어 학습 플랫폼
> 버전: 3.0 (최종) | 작성일: 2026.04.21
> Claude Code 전용 기준 문서 — 작업 시작 전 반드시 전체 읽기

---

## 0. 이 문서 사용법

```
신규 개발 시작   → Section 1~4 확인
콘텐츠 생성 필요 → Section 7 프롬프트 복붙
새 유닛 추가     → Section 8 JSON 템플릿 사용
UI 작업          → Section 5 + Section 9 디자인 시스템
DB 작업          → Section 6 스키마 참조
```

---

## 1. 프로젝트 기본 정보

```
프로젝트명 : pluepe 한국어 학습 플랫폼
경로       : C:\Users\song\Desktop\pluepe-korean-platform
GitHub     : pluepe-oss/pluepe-korean-platform
기술스택   : Next.js 16 + Supabase + Bunny.net + Stripe + Claude API
```

---

## 2. 절대 원칙 (모든 작업에 적용)

### 서비스 정체성
```
강의 플랫폼 ❌  →  훈련 시스템 ✅
설명형 UI   ❌  →  유도형 UI   ✅
읽게 만들기 ❌  →  따라가게 만들기 ✅
한 화면에 여러 행동 ❌  →  한 번에 한 가지 행동 ✅
```

### UI 금지사항
```
대시보드 UI 금지
관리자 화면 느낌 금지
복잡한 3단 레이아웃 금지
긴 한국어 설명문 금지 (학습 콘텐츠 제외)
영상 크기 축소 금지
```

### 개발 금지사항
```
API 키 프론트엔드 노출 금지 → 반드시 /api/ai 서버 라우트 사용
콘텐츠 하드코딩 금지 → Supabase에서 fetch
NEXT_PUBLIC_ 접두어를 ANTHROPIC_API_KEY에 붙이기 금지
```

---

## 3. 콘텐츠 기준 구조 (핵심 개념)

```
[단어 + 패턴] ← 핵심 기준 (먼저 정의)
      ↓
[영상 대본]   ← 상황 적용 예시 (중간 다리)
      ↓
[문제]        ← 시험 변형 (템플릿 기반 생성)
```

> 영상은 기준이 아니라 "예시"다.
> 콘텐츠 생성 순서: 단어 정의 → 패턴 정의 → 영상 대본 → 문제 생성

### 반복 학습 원칙
```
같은 표현을 5번 이상 다른 방식으로 노출:
단어 → 문장 → 상황(영상) → 듣기/읽기 → 시험
```

---

## 4. 디렉토리 구조

```
pluepe-korean-platform/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── dashboard/page.tsx              ← 마이페이지
│   ├── unit/[unitId]/
│   │   ├── page.tsx                    ← 유닛 메인 (섹션 전환)
│   │   └── components/
│   │       ├── SessionPlayer.tsx       ← STEP 1~5
│   │       ├── WordsSection.tsx        ← 단어 학습
│   │       ├── PatternsSection.tsx     ← 패턴 학습
│   │       ├── TestSection.tsx         ← 미니 테스트
│   │       └── AISection.tsx           ← AI 확장
│   ├── admin/page.tsx
│   └── api/
│       ├── ai/route.ts                 ← Claude API 프록시 (키 보안)
│       └── progress/route.ts           ← Supabase 진도 저장
├── components/ui/                      ← 공통 UI 컴포넌트
├── lib/supabase/
│   ├── client.ts
│   └── server.ts
├── data/topik1/                        ← 유닛 JSON 파일
│   ├── u01_convenience.json
│   └── u02_cafe.json ...
├── supabase/migrations/
└── CLAUDE.md
```

---

## 5. 유닛 구조 (1유닛 = 5섹션)

### 섹션 순서 및 역할

| 섹션 | 이름 | 시간 | 역할 | 우선순위 |
|---|---|---|---|---|
| session | 세션 플레이어 | 10분 | 핵심 엔진 (STEP 1~5) | MVP |
| words | 단어 학습 | 5분 | 어휘 집중 반복 | MVP |
| patterns | 패턴 학습 | 5분 | 문장 구조 자동화 | MVP |
| test | 미니 테스트 | 5분 | TOPIK 형식 점검 | MVP |
| ai | AI 확장 | 5분 | 상황 응용 | MVP+ |

### 세션 플레이어 STEP 상세

| STEP | 이름 | 내용 | 영상 | 완료 조건 |
|---|---|---|---|---|
| 1 | 보기 | 전체 영상 + 이해 퀴즈 1개 (3지선다) | ✅ | 퀴즈 답변 |
| 2 | 빈칸 연습 | 영상 재시청 + 빈칸 3문제 (3지선다) | ✅ | 3문제 완료 |
| 3 | 따라 말하기 | 문장 3개 자가 체크 (✓ 아이콘) | ✅ | 3개 체크 |
| 4 | 단어 익히기 | 카드 6개 플립 + 퀴즈 1문제 | ❌ | 퀴즈 완료 |
| 5 | 복습하기 | 핵심 표현 3개 카드 (클릭 시 뜻+예문) | ❌ | 1개 이상 클릭 |

```
// Bunny iframe URL
https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{VIDEO_ID}?autoplay=false&preload=false

// 유닛 1 Bunny 정보
LIBRARY_ID : 640837
VIDEO_ID   : 82314c52-4971-4b30-bafa-7ad04408faeb
```

---

## 6. API 라우트 및 DB 스펙

### POST /api/ai (Claude API 프록시)

```typescript
// app/api/ai/route.ts
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  const { prompt, unitTitle } = await req.json();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `너는 한국어 선생님이야. 학습자는 베트남 사람이고
             ${unitTitle} 표현을 배웠어.
             짧고 명확하게 답해줘.
             한국어 표현과 베트남어 설명을 같이 써줘.`,
    messages: [{ role: 'user', content: prompt }]
  });

  return Response.json({ content: response.content[0].text });
}
```

### POST /api/progress (진도 저장)

```typescript
export async function POST(req: Request) {
  const { unitId, section, score, total } = await req.json();
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('user_progress').upsert({
    user_id: user.id, unit_id: unitId, section,
    completed: true, score: score ?? null, total: total ?? null,
    completed_at: new Date().toISOString()
  }, { onConflict: 'user_id,unit_id,section' });

  return Response.json({ success: true });
}
```

### Supabase 핵심 테이블

```sql
-- 유닛
CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type text NOT NULL,       -- 'TOPIK1'|'TOPIK2'|'EPS'
  unit_number int NOT NULL,
  title_ko text NOT NULL,
  title_vi text,
  bunny_video_id text,
  bunny_library_id text,
  is_free boolean DEFAULT false,
  is_published boolean DEFAULT false
);

-- 섹션 콘텐츠
CREATE TABLE unit_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id),
  section text NOT NULL,         -- 'session'|'words'|'patterns'|'test'|'ai'
  content jsonb NOT NULL
);

-- 진도
CREATE TABLE user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  unit_id uuid REFERENCES units(id),
  section text NOT NULL,
  completed boolean DEFAULT false,
  score int, total int,
  completed_at timestamptz,
  UNIQUE(user_id, unit_id, section)
);
```

---

## 7. 콘텐츠 생성 AI 프롬프트 세트

> Claude Chat에 그대로 복붙해서 사용

### 7-1. 역할 기반 프롬프트 구조 (모든 프롬프트의 기본 틀)

```
너는 [역할]이다.

목표:
[목표 설명]

요구사항:
- [요구사항 1]
- [요구사항 2]

중요:
- [핵심 제약]

하지 말 것:
- [금지사항]

출력:
[출력 형식]
```

---

### 7-2. 올인원 유닛 생성 프롬프트

```
너는 TOPIK1 한국어 학습 콘텐츠를 만드는 교육 전문가다.

목표:
TOPIK1 초급 학습자를 위한 상황형 회화 유닛 1개를 완성해라.
주제: [편의점에서 물건 사기]

요구사항 — 다음 5가지를 JSON으로 출력해라:

1. session (세션 STEP 1~5)
   - step1: 이해 퀴즈 1개 (3지선다)
   - step2: 빈칸 문제 3개 (3지선다 + 베트남어 힌트)
   - step3: 따라 말할 문장 3개 (한국어 + 베트남어)
   - step4: 단어 카드 6개 (한국어 + 베트남어 + 예문)
   - step5: 복습 표현 3개 (한국어 + 베트남어 + 사용 상황)

2. words (단어 세트 8개)
   - korean, vietnamese, example_ko, example_vi

3. patterns (패턴 3개)
   - 패턴 구조, 베트남어 뜻, 변형 예문 3개, 빈칸 퀴즈

4. mini_test (테스트 3문제)
   - listening 1개, reading 1개, situation 1개
   - 4지선다 + 오답 해설

5. ai_extension (AI 확장 질문 3개)
   - 상황 변형, 표현 확장, 추가 생성

조건:
- TOPIK1 초급 수준 (1~2급 어휘)
- 짧고 반복 가능한 문장
- 실생활 상황 중심
- 바로 서비스에 넣을 수 있는 JSON 형식

하지 말 것:
- 설명형 긴 문장
- 어려운 문법 용어
- 실제 사용하지 않는 표현

출력: JSON
```

---

### 7-3. 단어 세트만 생성

```
너는 TOPIK1 초급 단어 콘텐츠 전문가다.

목표:
주제: [편의점에서 물건 사기]
TOPIK1 수준 단어 8개를 JSON으로 생성해라.

요구사항:
- 실생활에서 바로 쓰는 단어
- 명사, 동사, 표현 혼합
- 예문은 5단어 이내 단문

출력 형식:
{ "words": [
  { "korean": "물", "vietnamese": "nước",
    "example_ko": "물 하나 주세요.",
    "example_vi": "Cho tôi một chai nước.",
    "topik_level": 1 }
]}
```

---

### 7-4. 패턴만 생성

```
너는 초급 한국어 문장 패턴 전문가다.

목표:
주제: [편의점에서 물건 사기]
반복 사용 가능한 핵심 패턴 3개를 JSON으로 생성해라.

요구사항:
- 구조는 유지, 단어만 교체 가능한 패턴
- 변형 예문 3개씩 포함
- 외우는 게 아니라 바꿔 말할 수 있게

패턴 원칙:
물 하나 주세요 → [명사] 하나 주세요
커피 하나 주세요 / 김밥 하나 주세요 / 빵 하나 주세요

출력 형식:
{ "patterns": [
  { "pattern": "[명사] 하나 주세요",
    "meaning_vi": "Cho tôi một [danh từ]",
    "examples": ["물 하나 주세요.", "커피 하나 주세요.", "김밥 하나 주세요."],
    "blank_quiz": {
      "sentence": "____ 하나 주세요. (영수증)",
      "answer": "영수증",
      "options": ["영수증", "포인트", "비밀번호", "할인"]
    }
  }
]}
```

---

### 7-5. 테스트 문제만 생성 (템플릿 기반)

```
너는 TOPIK 문제 출제 전문가다.

목표:
주제: [편의점에서 물건 사기]
아래 3가지 템플릿 유형으로 문제를 각 1개씩 생성해라.

[템플릿 1: listening - 대화 이해]
A: [문장]
B: [문장]
문제: 무엇을 주문했습니까?
① ② ③ ④

[템플릿 2: reading - 짧은 글 읽기]
[표지판/가격표/안내문]
문제: [무엇]은 얼마/어디입니까?
① ② ③ ④

[템플릿 3: situation - 상황 이해]
[문장]
문제: 이 사람은 무엇을 합니까?
① ② ③ ④

조건:
- 초급 수준, 짧은 문장
- 명확한 정답 1개
- 오답 해설 1~2문장 포함

출력: JSON (answer는 index 0~3)
```

---

### 7-6. AI 확장 질문만 생성

```
너는 AI 기반 언어 학습 확장 전문가다.

오늘 배운 표현: [물 하나 주세요 / 이거 얼마예요? / 카드로 계산할게요]

목표:
학습자가 배운 표현을 다른 상황으로 확장할 수 있도록
AI에게 던질 질문 3개를 만들어라.

유형 (반드시 아래 3가지):
1. 상황 변형: 같은 표현을 다른 장소에서 쓰기 (카페, 식당 등)
2. 표현 확장: 더 공손하게 / 더 자연스럽게
3. 추가 생성: 비슷한 상황에서 더 쓸 수 있는 표현

하지 말 것:
- 단순 번역 질문
- 문법 설명 요청

출력: 문자열 배열 3개
```

---

### 7-7. 12유닛 전체 설계 프롬프트

```
너는 TOPIK1 한국어 학습 콘텐츠 설계자다.

목표:
아래 12개 주제로 TOPIK1 전체 유닛 구조를 설계해라.

주제:
1. 편의점에서 물건 사기
2. 카페에서 주문하기
3. 식당에서 음식 주문하기
4. 지하철/버스 타기
5. 길 묻기
6. 병원에서 진료받기
7. 약국에서 약 사기
8. 은행/ATM 이용하기
9. 쇼핑몰에서 옷 사기
10. 학교/학원에서 질문하기
11. 집/숙소 관련 표현
12. 일상 일정 말하기

각 유닛마다 생성:
1. 학습 목표 3개
2. 핵심 표현 3개 (한국어 + 베트남어)
3. 단어 8~12개
4. 패턴 3개
5. 미니 테스트 포인트 3개
6. AI 확장 아이디어 3개

조건:
- TOPIK1 초급 수준
- 실제 생활 상황 중심
- JSON 출력
```

---

## 8. 유닛 JSON 생산 템플릿

> 새 유닛 추가 시 이 구조에 데이터만 채워서 Supabase insert

```json
{
  "unit_id": "topik1_u01",
  "exam_type": "TOPIK1",
  "topic": "편의점에서 물건 사기",
  "topic_vi": "mua đồ ở cửa hàng tiện lợi",
  "level": 1,
  "duration_min": 25,
  "bunny_library_id": "640837",
  "bunny_video_id": "82314c52-4971-4b30-bafa-7ad04408faeb",
  "is_free": true,
  "key_expressions": [
    { "ko": "물 하나 주세요.", "vi": "Cho tôi một chai nước." },
    { "ko": "이거 얼마예요?", "vi": "Cái này bao nhiêu tiền?" },
    { "ko": "카드로 계산할게요.", "vi": "Tôi thanh toán bằng thẻ." }
  ],
  "session": {
    "step1_quiz": {
      "question": "이 상황은 어디인가요?",
      "options": ["편의점", "병원", "은행"],
      "answer": 0
    },
    "step2_blanks": [
      { "sentence": "물 ____ 주세요.", "hint_vi": "một cái",
        "options": ["하나","둘","많이"], "answer": 0 },
      { "sentence": "이거 ____예요?", "hint_vi": "bao nhiêu tiền",
        "options": ["어디","얼마","언제"], "answer": 1 },
      { "sentence": "____로 계산할게요.", "hint_vi": "bằng thẻ",
        "options": ["현금","포인트","카드"], "answer": 2 }
    ],
    "step3_sentences": [
      { "ko": "물 하나 주세요.", "vi": "Cho tôi một chai nước." },
      { "ko": "이거 얼마예요?", "vi": "Cái này bao nhiêu tiền?" },
      { "ko": "카드로 계산할게요.", "vi": "Tôi thanh toán bằng thẻ." }
    ],
    "step4_words": [
      { "korean": "물", "vietnamese": "nước", "example": "물 하나 주세요." },
      { "korean": "하나", "vietnamese": "một cái", "example": "하나 주세요." },
      { "korean": "얼마", "vietnamese": "bao nhiêu", "example": "이거 얼마예요?" },
      { "korean": "계산", "vietnamese": "thanh toán", "example": "카드로 계산할게요." },
      { "korean": "카드", "vietnamese": "thẻ", "example": "카드로 할게요." },
      { "korean": "주세요", "vietnamese": "cho tôi", "example": "물 주세요." }
    ],
    "step5_review": [
      { "ko": "물 하나 주세요.", "vi": "Cho tôi một chai nước.", "context": "편의점에서 음료 살 때" },
      { "ko": "이거 얼마예요?", "vi": "Cái này bao nhiêu tiền?", "context": "가격을 물어볼 때" },
      { "ko": "카드로 계산할게요.", "vi": "Tôi thanh toán bằng thẻ.", "context": "계산할 때" }
    ]
  },
  "words": [
    { "korean": "물", "vietnamese": "nước",
      "example_ko": "물 하나 주세요.", "example_vi": "Cho tôi một chai nước." },
    { "korean": "김밥", "vietnamese": "gimbap",
      "example_ko": "김밥 하나 주세요.", "example_vi": "Cho tôi một cuộn gimbap." },
    { "korean": "과자", "vietnamese": "bánh snack",
      "example_ko": "과자 주세요.", "example_vi": "Cho tôi bánh." },
    { "korean": "얼마", "vietnamese": "bao nhiêu",
      "example_ko": "이거 얼마예요?", "example_vi": "Cái này bao nhiêu?" },
    { "korean": "카드", "vietnamese": "thẻ",
      "example_ko": "카드로 계산할게요.", "example_vi": "Tôi trả bằng thẻ." },
    { "korean": "현금", "vietnamese": "tiền mặt",
      "example_ko": "현금 있어요.", "example_vi": "Tôi có tiền mặt." },
    { "korean": "계산", "vietnamese": "thanh toán",
      "example_ko": "계산할게요.", "example_vi": "Tôi thanh toán." },
    { "korean": "봉투", "vietnamese": "túi",
      "example_ko": "봉투 주세요.", "example_vi": "Cho tôi một cái túi." }
  ],
  "words_quiz": [
    { "question_vi": "nước", "options_ko": ["물","불","흙","바람"], "answer": 0 },
    { "question_vi": "bao nhiêu", "options_ko": ["어디","언제","얼마","어떻게"], "answer": 2 },
    { "question_vi": "thanh toán", "options_ko": ["주문","계산","예약","취소"], "answer": 1 }
  ],
  "patterns": [
    {
      "pattern": "[명사] 하나 주세요",
      "meaning_vi": "Cho tôi một [danh từ]",
      "examples": ["물 하나 주세요.", "커피 하나 주세요.", "김밥 하나 주세요."],
      "blank_quiz": {
        "sentence": "____ 하나 주세요. (영수증)",
        "answer": "영수증",
        "options": ["영수증", "포인트", "비밀번호", "할인"]
      }
    },
    {
      "pattern": "이거 얼마예요?",
      "meaning_vi": "Cái này bao nhiêu tiền?",
      "examples": ["이거 얼마예요?", "김밥 얼마예요?", "커피 얼마예요?"],
      "blank_quiz": {
        "sentence": "커피 ____예요?",
        "answer": "얼마",
        "options": ["얼마", "어디", "언제", "누구"]
      }
    },
    {
      "pattern": "[수단]로 계산할게요",
      "meaning_vi": "Tôi thanh toán bằng [phương tiện]",
      "examples": ["카드로 계산할게요.", "현금으로 계산할게요.", "포인트로 계산할게요."],
      "blank_quiz": {
        "sentence": "현금____로 계산할게요.",
        "answer": "으",
        "options": ["으", "이", "가", "을"]
      }
    }
  ],
  "mini_test": [
    {
      "type": "listening",
      "script": "A: 물 하나 주세요. B: 네, 여기 있습니다.",
      "question": "무엇을 주문했습니까?",
      "options": ["물", "빵", "우유", "과자"],
      "answer": 0,
      "explanation": "'물 하나 주세요'는 물 1개를 달라는 표현이에요."
    },
    {
      "type": "reading",
      "text": "물 1,000원",
      "question": "물은 얼마입니까?",
      "options": ["500원", "1,000원", "2,000원", "3,000원"],
      "answer": 1,
      "explanation": "1,000원은 천 원이에요."
    },
    {
      "type": "situation",
      "sentence": "카드로 계산할게요.",
      "question": "이 사람은 무엇을 합니까?",
      "options": ["주문", "계산", "이동", "예약"],
      "answer": 1,
      "explanation": "'계산'은 돈을 내는 것이에요."
    }
  ],
  "ai_extension": [
    "\"물 하나 주세요\"를 카페 상황으로 바꿔줘",
    "\"이거 얼마예요?\"를 더 공손하게 말해줘",
    "편의점에서 자주 쓰는 표현 3개 더 알려줘"
  ]
}
```

---

## 9. 디자인 시스템

```css
--navy   : #122c4f;   /* 브랜드, 제목, CTA 버튼 */
--mint   : #27d3c3;   /* 포인트, 진행바, 완료 */
--orange : #ff7d5a;   /* 강조, 오답 */
--bg     : #edf2f7;   /* 페이지 배경 */
--card   : #ffffff;   /* 카드 배경 */
--text   : #0f172a;   /* 본문 */
--sub    : #64748b;   /* 보조 텍스트 */
--ok     : #22c55e;   /* 정답 */
--err    : #ef4444;   /* 오답 */

border-radius-card   : 22px
border-radius-button : 12px
shadow               : 0 12px 30px rgba(15,23,42,0.08)
font                 : Arial, "Noto Sans KR", sans-serif
```

---

## 10. 환경변수

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=          # 절대 NEXT_PUBLIC_ 금지
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
BUNNY_API_KEY=
```

---

## 11. 진도율 계산

```typescript
// 유닛 진도율 (섹션당 20%)
const sections = ['session', 'words', 'patterns', 'test', 'ai'];
const completed = userProgress.filter(p => p.completed).length;
const unitProgress = (completed / sections.length) * 100;

// 전체 진도율
const totalProgress = (completedUnits / totalUnits) * 100;
```

---

## 12. 참조 엑셀 — topik1_service_ia_and_curriculum.xlsx

> 이 엑셀을 커리큘럼/IA 설계 시 기본 참조 파일로 사용할 것
> 확정안은 아니나 향후 작업 진행 시 이 구조를 기반으로 발전시킬 것

**시트 구성:**
- `IA_Map` : 서비스 전체 메뉴/화면 구조 + KPI + 우선순위
- `Curriculum_Design` : 학습 타입별 순서, 분량, 반복 주기
- `Content_Types` : 추가 제작 필요 콘텐츠 타입 + 데이터 구조
- `Roadmap_Example` : 1유닛이 서비스에서 어떻게 보이는지 예시

**엑셀 기준 MVP 우선순위:**
```
MVP 필수:
단어 워밍업 / 패턴 드릴 / 세션 플레이어 /
미니 테스트 / 오답노트 / 마이페이지 기록

MVP+ (다음 단계):
문법 브리지 / 듣기 드릴 / 읽기 드릴 /
결과 리포트 / AI 역할극 / 간격 반복

Phase 2:
모의고사 / 목표 관리 / 주간/월간 미션
```

**엑셀 기준 학습 순서 (Curriculum_Design 시트):**
```
온보딩/진단
→ 단어 워밍업 (5분)
→ 문장 패턴 드릴 (5분)
→ 세션 STEP 1~5 (10분)
→ 문법 브리지 (5분, MVP+)
→ 듣기 드릴 (5~10분, MVP+)
→ 읽기 드릴 (5~10분, MVP+)
→ 미니 테스트 (7~12분)
→ 오답 복습
→ 결과 리포트
```
