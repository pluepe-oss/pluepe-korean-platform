# CLAUDE.md — pluepe 한국어 학습 플랫폼

@AGENTS.md

## 프로젝트 개요

인도네시아·중국·캄보디아의 한국어 학원을 대상으로 하는 B2B PWA 기반 한국어 학습 플랫폼. TOPIK 1/2와 EPS-TOPIK을 중심으로 영상 강의, 시험 모의고사, 단어 암기, AI 챗봇을 제공한다.

- 타겟 지역: 인도네시아, 중국, 캄보디아, 한국 (국내 외국인 학습자 + 한국어 학원)
- 타겟 고객: 한국어 학원(B2B) + 개별 학습자(B2C)
- 요금제: B2C $9.99/월 · $89/년, B2B $7×10명 (7일 무료체험)
- 조직 구조: Master(pluepe) / Admin(원장·강사) / Student(학생) 3단계

## 기술 스택

| 영역 | 선택 | 비고 |
| --- | --- | --- |
| 프레임워크 | Next.js 16 + React 19 (App Router, PWA) | TypeScript, Tailwind CSS v4 |
| 인증·DB | Supabase (Auth + PostgreSQL + RLS) | `@supabase/ssr` 사용 |
| 영상 | Cloudflare Stream (`@cloudflare/stream-react`) | DRM 기반 다운로드 차단, 재생 위치 자동 저장 |
| 결제 | Stripe Checkout + Webhook | 7일 무료체험, GoPay/WeChat Pay 연동 |
| AI | Claude API (Sonnet) | 오답 해설, 챗봇 |
| 메일 | Resend | 체험 D-3 / D-1 / D-day 알림 (Vercel Cron 트리거) |
| 차트 | Recharts | 학습 진도 · 분석 |
| 호스팅 | Netlify (프로덕션) / Vercel (예비) | 2026.04.21부터 Netlify 단일 배포 |

## 폴더 구조

```
pluepe-korean-platform/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 전역 레이아웃
│   ├── page.tsx                # 홈 (랜딩)
│   ├── auth/
│   │   ├── page.tsx            # 로그인
│   │   ├── signup/page.tsx     # 회원가입
│   │   ├── callback/route.ts   # OAuth 콜백 (role별 redirect)
│   │   └── _auth-i18n.ts       # 로그인/회원가입 다국어 dict
│   ├── learn/                  # 학습자 영역 (Student)
│   │   ├── layout.tsx          # 하단 탭바 레이아웃
│   │   ├── page.tsx            # 강의 허브 (TOPIK 1/2, EPS-TOPIK)
│   │   ├── topik1/page.tsx
│   │   ├── topik2/page.tsx
│   │   ├── eps-topik/page.tsx
│   │   ├── exam/page.tsx       # 시험보기
│   │   ├── vocab/page.tsx      # 단어외우기
│   │   ├── me/page.tsx         # 마이페이지
│   │   └── [courseId]/         # 개별 강의 플레이어 (Cloudflare Stream)
│   │       ├── page.tsx        # 서버 컴포넌트: 권한 체크 + 데이터 fetch
│   │       └── video-player.tsx # 클라이언트: SDK, 진도 저장, 속도, paywall
│   ├── admin/page.tsx          # Admin 대시보드 (원장·강사)
│   └── master/page.tsx         # Master 콘솔 (pluepe 운영팀)
├── lib/
│   └── supabase/
│       ├── client.ts           # 브라우저 Supabase 클라이언트
│       ├── server.ts           # 서버 컴포넌트 / Server Action용
│       └── middleware.ts       # 세션 갱신 헬퍼
├── middleware.ts               # Next.js 미들웨어 (세션 refresh)
├── PROGRESS.md                 # 일자별 진행 현황 체크리스트
├── supabase/
│   ├── schema.sql              # 테이블 · RLS · 시드 초기 스키마
│   └── migrations/
│       └── 001_courses_is_free.sql  # courses.is_free 컬럼 추가
├── docs/                       # PRD 등 기획 문서
├── .env.local                  # 로컬 환경변수 (커밋 금지)
└── .env.local.example          # 팀 공유용 템플릿
```

## 환경변수

`.env.local.example`에 정의된 키 중 필수 항목:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 클라이언트/서버 공통
- `SUPABASE_SERVICE_ROLE_KEY` — 서버 전용. RLS를 우회하므로 절대 클라이언트에 노출 금지
- Stripe · Cloudflare Stream · Anthropic · SendGrid 키는 해당 Phase에서 추가

## 개발 명령

```bash
npm run dev      # 로컬 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 빌드된 결과 실행
npm run lint     # ESLint
```

## 설계 원칙

- 모든 DB 접근은 Supabase RLS 정책으로 Master / Admin / Student 권한을 분리한다
- 영상은 Cloudflare Stream의 서명된 URL로만 서빙해 다운로드를 차단한다. 플레이어는 `@cloudflare/stream-react` 컴포넌트를 사용하고, 우클릭 방지·서버 측 구독 권한 체크·5초 간격 `progress.last_position_seconds` upsert를 기본 규칙으로 한다
- 결제 상태 변경은 Stripe Webhook → Supabase 저장을 단일 진실원천(SSoT)으로 둔다
- Claude API 호출은 반드시 Route Handler(서버 사이드)에서 수행한다

## Supabase 스키마

`supabase/schema.sql`이 DB 단일 진실원천. 테이블 10개:

| 테이블 | 역할 |
| --- | --- |
| `users` | **`auth.users`와 1:1 매핑된 프로필 + 권한/조직 메타**. 컬럼: `id`, `email`, `name`, `role`(master/admin/student), `academy_id`, `country_code`, `preferred_language` |
| `academies` | B2B 학원 조직 (이름, 국가, 소유 admin, 연락처) |
| `courses` | 강의 (`type`: topik1/topik2/eps-topik, `stream_video_id` Cloudflare Stream UID, `is_free` 무료 여부, `is_published` 공개 여부) |
| `progress` | 학생 × 강의 진도율 및 마지막 재생 위치 |
| `exam_results` | 모의고사 응시 기록 (점수, 답안 `jsonb`) |
| `subscriptions` | Stripe 구독 상태. B2C(`user_id`) XOR B2B(`academy_id`) |
| `seats` | 학원 좌석 집계 (총/사용) |
| `pricing_default` | 기본 가격표 |
| `pricing_country` | 국가별 가격 오버라이드 |
| `pricing_academy` | 학원별 가격 오버라이드 (최우선) |

핵심 규칙:

- **`profiles` 테이블을 별도로 두지 않는다.** `users`가 프로필 역할을 겸한다 (Supabase 공식 profiles 패턴과 동일 구조, 이름만 `users`).
- `auth.users`에 새 유저가 생기면 `handle_new_user()` 트리거가 `public.users` 행을 자동 생성한다.
- RLS helper 함수: `current_user_role()`, `current_user_academy()`, `is_master()` — 모두 `security definer`로 RLS 재귀를 피한다.
- 가격 해석: `resolve_price(plan_type, interval, country?, academy?)` → `academy > country > default` 우선순위로 `(amount_cents, currency)` 반환.
- 코드에서 프로필 조회 시 항상 `from public.users where id = auth.uid()` 패턴을 쓴다 (`profiles`로 쓰지 말 것).

## 로드맵 (3개월 MVP 기준)

| Week | 단계 |
| --- | --- |
| 1~2 | 프로젝트 세팅, Supabase 스키마, 인증, PWA 기초 |
| 3~4 | TOPIK 1 콘텐츠, Cloudflare Stream, 단어 암기 |
| 5~6 | Stripe 결제, 7일 체험, SendGrid 메일 |
| 7~8 | TOPIK 2 콘텐츠, AI 챗봇, 진도 대시보드 |
| 9~10 | B2B Admin 대시보드, EPS-TOPIK |
| 11~12 | IBT 시험 모의고사, PWA 오프라인, 베타 |

베타 목표: 3개월 후 인도네시아 1~2개 학원 · 학생 50명 파일럿.

## 완료 확정 기능 (절대 수정 금지)

`app/unit/[unitId]` 유닛 훈련 시스템에서 아래 동작들은 **확정 상태**다. 새 작업을 할 때 동작 방식을 바꾸지 말 것.

- 다음 버튼 클릭 시 상단 스크롤
- 퀴즈: 선택 → [확인] → 정답/오답 표시
- 정답 확인 후에만 다음 버튼 활성화
- 세션 완료 전 단어/표현/테스트/AI 탭 잠금
- SESSION 배지 제거
- 상단 우측 유닛·TOPIK 텍스트 제거
- XP / 연속학습 숨김
- 완료 배너: 5섹션 모두 완료 시만 표시
- 하단 상태 텍스트 제거
- STEP 4,5 영상 제거
- 섹션 상단 타이틀 제거
- 베트남어 → 한국어 퀴즈 방식 제거
- 테스트 보기: 한글 표기 (천원/오백원)
- 이전 버튼 제거
- 사이드바 레이아웃 (200px + 1fr)
- 테스트 해설 텍스트 표시
- 유닛 완료 버튼 → /my 이동
- 다음 유닛 버튼 → /unit/{n+1} 이동
- 제목 옆 현재 섹션 미니 카드 (고정 너비 160px)
- STEP 탭 숫자 원문자 + ✓ 표시
- 모바일 사이드바 숨김 + 상단 섹션 바로 대체
- 모바일 섹션 바 이전/다음 화살표 이동
- Bunny iframe: `autoplay=false&preload=false&t=0`

## ⚠️ 개발 임시 상태

- `DEV_MODE = false` (운영 상태)
- 배포 전 반드시 확인

## Bunny 영상 연결 정보

- Library ID: 환경변수 `BUNNY_STREAM_LIBRARY_ID` 로 주입 (코드/JSON 하드코딩 금지)
- embed URL 형식:
  `https://iframe.mediadelivery.net/embed/{BUNNY_STREAM_LIBRARY_ID}/{GUID}?autoplay=false&preload=false&t=0`
- Allowed domains: `lucky-begonia-eea7de.netlify.app`, `localhost:3000`
- 키 관리: `BUNNY_STREAM_API_KEY`, `BUNNY_TOKEN_KEY` 는 Netlify Environment Variables 에서만 관리
  (2026.04.21 rotate 완료)
- Netlify 빌드 secrets scan 예외:
  - `SECRETS_SCAN_ENABLED = false`
  - `SECRETS_SCAN_OMIT_KEYS = BUNNY_STREAM_LIBRARY_ID`

## Bunny Title 규칙 (확정)

- TOPIK1: `u1{유닛번호}_step{n}_{언어}`
- TOPIK2: `u2{유닛번호}_step{n}_{언어}`
- EPS:    `u3{유닛번호}_step{n}_{언어}`

예시: `u101_step1_vi` / `u201_step1_en` / `u301_step1_id`

## u01 편의점 vi GUID (최종)

- `u101_step1_vi`: `b1601bdc-b71b-4ca5-8f5f-df90ab18db6e`
- `u101_step2_vi`: `8b6840f1-c801-4ba0-9695-c86a5fb3ece4`
- `u101_step3_vi`: `9079f373-bba7-4558-8a6f-217b43134e1d`

## 프로덕션 배포 (Netlify)

- 프로덕션 URL: `https://lucky-begonia-eea7de.netlify.app`
- GitHub 연동: `github.com/pluepe/pluepe-korean-platform` (개인 계정 pluepe, main 브랜치 push 시 자동 빌드)
- 환경변수: `.env.local` 전체 값 Netlify Dashboard → Site settings → Environment variables 에 1:1 등록
- 검증 경로: `/unit/1` — 영상 재생 · 0%/0/5 학습자 포지션 · 사이드바 잠금 모두 정상 (2026.04.21)

## 배포 관련 주의사항 (실서비스 배포 전 필수 확인)

### 현재 임시 설정 (MVP 단계)
- SECRETS_SCAN_ENABLED = false (Netlify 보안 스캐너 꺼져 있음)
- GitHub 저장소 Public 상태 (pluepe-oss/pluepe-korean-platform)
- Netlify 무료 플랜 (lucky-begonia-eea7de.netlify.app)

### 실서비스 배포 전 반드시 처리할 것
1. SECRETS_SCAN_ENABLED = false 제거
   → 보안 스캐너 다시 켜기
   → 하드코딩된 값 모두 환경변수로 교체 확인

2. GitHub 저장소 Private으로 복구
   → pluepe-oss/pluepe-korean-platform → Private

3. 커스텀 도메인 연결
   → lucky-begonia-eea7de.netlify.app → pluepe.com 등

4. DEV_MODE = false 반드시 확인

5. Supabase RLS 정책 재검토

### 어제 배포 시 발생한 이슈 기록
- Vercel Hobby 플랜 + 조직 계정 → Blocked
  → 개인 GitHub 계정 필요 (pluepe)
- Netlify 보안 스캐너가 아래 값 감지하여 배포 차단:
  → BUNNY_STREAM_LIBRARY_ID 하드코딩
  → NEXT_PUBLIC_APP_URL
  → 임시 해결: SECRETS_SCAN_ENABLED = false
- GitHub Private 저장소 → Fork 불가
  → Public으로 변경 후 Fork
- Bunny Allowed domains 설정 필요
  → 배포 URL 추가해야 영상 재생 가능

### 배포 플랫폼 현황
| 플랫폼 | 계정 | 상태 | URL |
|--------|------|------|-----|
| Netlify | pluepe (개인) | 운영 중 | lucky-begonia-eea7de.netlify.app |
| Vercel | pluepe-7693 (팀) | 구버전 배포 | pluepe-korean-platform.vercel.app |
| GitHub | pluepe-oss (조직) | 원본 저장소 | pluepe-oss/pluepe-korean-platform |
| GitHub | pluepe (개인) | Fork | pluepe/pluepe-korean-platform |

## 완성된 파일 목록 (2026.04.21 기준)

- `app/unit/[unitId]/page.tsx`
- `app/unit/[unitId]/UnitClient.tsx`
- `app/unit/[unitId]/unit.module.css`
- `app/unit/[unitId]/types.ts`
- `app/unit/[unitId]/components/SessionPlayer.tsx`
- `app/unit/[unitId]/components/WordsSection.tsx`
- `app/unit/[unitId]/components/PatternsSection.tsx`
- `app/unit/[unitId]/components/TestSection.tsx`
- `app/unit/[unitId]/components/AISection.tsx`
- `app/api/ai/route.ts`
- `app/api/progress/route.ts`
- `data/topik1/u01_convenience.json`
- `supabase/migrations/002_user_progress.sql`
