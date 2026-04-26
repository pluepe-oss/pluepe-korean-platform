# pluepe 한국어 학습 플랫폼 — 개발 진행 현황

## 2026.04.26 세션 종료

### 완료
- /my 페이지 1차 일괄 수정 16건
- /my 페이지 2차 일괄 수정 8건
- 4개 계정 시각 검증 (test_t2_basic 2차 제외)
- 콘텐츠팀 JSON 구조 분석
- 인수인계 문서 작성 → docs/handover/2026-04-26_session_handover.md

### 핵심 변경
- TOPIK 1 = 15개 주제 (4 Phase 구조)
- "구독 갱신" → "구독 연장" 일괄 변경
- Trial 학습 목록 시각 구분 (주제 2 활성 / 주제 3 navy 박스)
- 04 결제 내역 카드 구독 상태별 분기
- unitFileMap 갭 자동 처리
- AISection Trial 별도 메시지

### 잔여
- 결함 #t1-19 (expired 결제 이력 메시지)
- test_t2_basic 2차 검증
- 학습 화면 검증 (AI 확장, 모의시험, 학습 완료 화면)
- /unit 접근 제어 검증
- 라이브러리 작업 (콘텐츠팀 JSON 5개 가공)

### 다음 세션 시작점
docs/handover/2026-04-26_session_handover.md 참조

---

## 2026.04.26 일괄 수정 (4개 계정 검증 후 신규 결함 8건)

검증 대상: test_t1_basic, test_trial, test_expired, test_t2_basic
이전 일괄 수정에서 잘 작동하는 부분은 유지, 신규 결함 8건만 통합 수정.

### 변경 내역

- [x] **TOPIK 1 주제 갯수 12 → 15** (`/courses/topik1` CurriculumSection 과 일관성 확보)
  - `app/my/page.tsx` UNIT_CATALOG 13~15 추가 (`locked: true` — 가족·취미·날씨)
  - `TOTAL_UNITS_TOPIK1`, `COURSE_UNIT_COUNT.topik1`, `courseUnitCount` 기본값 모두 15
  - `app/my/_progress-tabs.tsx` TABS topik1 count 15, LOCKED_COPY 본문, trial 안내 본문 모두 15
  - `app/my/components/TodaySection.tsx` TOPIK1_MAX_UNIT 15 + TOPIK1_AVAILABLE_MAX 12 분리 (탐색 범위 1~12 유지)
  - 모바일/PC 동일 — 회색 자물쇠 + "준비 중 · 곧 오픈 예정입니다" (13~15)
- [x] **"구독 갱신하기" → "구독 연장하기"** 일괄 치환
  - `app/my/page.tsx` (3곳: 03 좌·03 우 expired 오버레이, 04 만료 navy 버튼)
  - `app/my/components/TodaySection.tsx` (3곳: aria-label, expired CardLayout, buttonLabel)
  - `app/my/_progress-tabs.tsx` (1곳: LockedBanner)
  - PROGRESS.md §접근 제어 텍스트 1곳
  - 영문 변수명/타입명은 변경 없음 (UI 문구만)
- [x] **Trial 학습목록 시각 분기 정밀화** (`_progress-tabs.tsx` UnitList 4-case)
  1. 활성: navy/mint [시작하기·이어하기·다시 보기]
  2. **Trial 다음 차례 (= 주제 2 미완료) → 자물쇠 X, 숫자 + "이전 주제를 완료하면 열려요"** ★ 카드 활성 톤 유지
  3. **Trial 첫 잠금 (= 주제 3) → navy 안내 박스 + 흰색 텍스트 + [구독하기] navy CTA** ★ 화면 강조
  4. 두 번째 이후 trial-blocked / 일반 progress-locked: 회색 자물쇠
- [x] **AISection Trial 메시지 분기** (Basic / Trial / Premium 각 메시지)
  - `accountKind` prop 추가, UnitClient 가 전달
  - trial: "체험 중에는 3가지 사용 가능 / 구독 후 Premium 시 5가지" / [구독하기 → /pricing]
  - basic: "Basic 에서는 3가지 / Premium 시 +N개" / [업그레이드 → /pricing?upgrade=premium]
  - premium: 배너 표시 안 함
- [x] **04 결제 내역 카드 4분기 메시지** (`/my` 04 섹션)
  - `b2c_active`: "다음 결제 예정" + 일자 + 가격 + [결제 내역 보기 →]
  - `trialing`: "첫 결제 예정" + trial_ends_at + 가격 + "체험 종료 후 자동 결제" 안내
  - `expired`: "구독이 만료되었습니다" + "구독 연장 후 가능" 안내
  - `b2b`: "학원에서 관리" + 학원 문의 안내
  - 가격 매핑: basic ₩7,700/월, premium ₩11,900/월 (모든 코스 동일)
- [x] **PRD_v7 §10 콘텐츠 로드맵 정정**
  - "TOPIK1 (12유닛)" → "TOPIK1 (15주제)"
  - 표 1~12 + 13~15 "준비 중 (잠금)" 추가
  - **4 Phase 구조표 신규 추가** (CurriculumSection 과 1:1 일관)
  - 개발 우선순위에 Phase 4 단계 추가
- [x] **unitFileMap 갭 처리** (콘텐츠 미등록 자동 잠금)
  - `_progress-tabs.tsx`: `implemented=false && !locked` → "콘텐츠 준비 중 · 곧 오픈됩니다" 회색 자물쇠 (3~12 적용)
  - `components/UnitCard.tsx`: 미연결 컴포넌트도 일관성 차원에서 `coming_soon` / `content_missing` 상태 분기 추가
  - 화면에는 1~15 모두 노출되지만 실제 진입 가능: 1, 2 (그 외는 회색 자물쇠 또는 navy 안내 박스)
- [x] 작업 8 (cache: 'no-store') 정책 유지 — 이전 검증에서 정상 반영 확인

### 보류 티켓 (이번 작업에서 처리 안 함)

- #14: GNB 구현 (메인 페이지 기획 후)
- #15: 콘텐츠 난이도 분기 (unit JSON 보강 후)
- #16: `/pricing` 전면 재기획
- #17: 약점 분석 섹션
- #18: 모의시험 횟수 (Basic 1 / Premium 3) 별도 작업
- #19: TOPIK 1 주제 2~15 라이브러리 구축 (콘텐츠 작업)

---

## 2026.04.25 확정 정책 (오늘)

- EPS-TOPIK 지원언어: VN / EN / ID → **VN / TH / ID** (영어 → 태국어로 변경)
- "세션" → **"오늘의 학습"** 용어 변경 예정 (전체 일괄 적용 예정)
- `/pricing` 전면 재기획 예정 (현재 구현본 폐기)
- UI 텍스트 한국어 원칙 확정 (CLAUDE.md §UI 텍스트 언어 규칙 참조)

### /pricing 재기획 확정 사항

- `users.intended_plan` 컬럼 추가 예정 (회원가입 후 선택한 미결제 플랜 저장용)
- 미결제 재로그인 시 "이전 선택 있어요" 화면 노출
  → 저장된 `intended_plan` 을 읽어 사용자에게 복귀 지점 제시
- 버튼 2개 구성:
  1. [이어서 구독하기] — 저장된 플랜으로 Stripe Checkout 재진입
  2. [처음부터 다시 선택] — `intended_plan` clear 후 STEP 1 부터 재시작

### 접근 제어 로직 확정 (accountKind × preferred_language 분기)

| 상황 | 조건 | 라우팅 |
|---|---|---|
| 회원가입 후 결제 전 | subscription 없음 | `/pricing` 리다이렉트 |
| 언어 미설정 | `users.preferred_language === null` | `/onboarding/language` |
| 구독 없음 | `accountKind === 'none'` | `/pricing` |
| 체험 중 | `accountKind === 'trialing'` | `/my` (각 상품 `unit/1` 만 접근 가능) |
| 체험 만료 | `accountKind === 'expired'` | `/my` (전체 잠금) |
| 유료 구독자 | `accountKind === 'b2c_active'` | `plan_type` 기준 해당 상품 탭 오픈 |

### TOPIK 2 / EPS 유닛 경로 예약 (향후 구현)

- `/unit/topik2/[unitId]` — TOPIK 2 유닛 플레이어 (예약)
- `/unit/eps/[unitId]` — EPS-TOPIK 유닛 플레이어 (예약)
- 현재 `/unit/[unitId]` 는 TOPIK 1 전용으로 사용 중
- 향후 상품별 유닛 경로 분리 후 라우팅 변경 예정

## 2026.04.25 완료 (오늘 추가분)

- [x] `/courses/topik1` 강좌소개 페이지 완성
  - Hero 섹션 (가·나·다 카드 스택)
  - 학습 방식 5단계 (설명 문장 + 줄바꿈)
  - 학습 목록 (4개 Phase 아코디언 — 다중 열기 가능, 최소 1개 유지)
  - Basic vs Premium 플랜 섹션
  - 하단 navy CTA 배너
  - 영어 레이블 전체 삭제
  - 섹션 간격 조정
  - Phase 4 카드 스타일 통일

## 2026.04.26 완료
- [x] /courses/topik1 강의 소개 페이지 생성 (15개 유닛 / 4 Phase)
- [x] /courses/topik2 강의 소개 페이지 생성 (20개 유닛 / 4 Phase)
- [x] /courses/eps-topik 강의 소개 페이지 생성 (20개 유닛 / 4 Phase)
- [x] 공통 UnitAccordion 컴포넌트 생성
- [x] 빌드 통과 (37 routes)
- [x] STEP 10 완료: intended_plan 컬럼 추가
      - `supabase/migrations/014_users_intended_plan.sql` 생성
      - `users.intended_plan` TEXT (nullable) + CHECK 제약 (6개 허용값)
      - 결제 완료 시 null로 초기화하는 컬럼 코멘트 추가
- [x] /courses/topik2 페이지 스펙 리라이트
      - 헤더 "TOPIK 2 한국어 기초 과정" / AI 쓰기 첨삭 강조
      - "콘텐츠 준비 중" 배너 추가 (mint tint)
      - Hero CTA 를 secondary(mint outline) 로 변경해 orange CTA 1개(하단 "7일 무료로 시작하기 →") 규칙 준수
      - Basic vs Premium 표에 AI 쓰기 첨삭 / 쓰기 연습 행 추가
- [x] /courses/eps-topik 페이지 스펙 리라이트
      - 헤더 "EPS-TOPIK 한국어 과정"
      - 언어 배지 VN / TH / ID 로 교체 (영어 → 태국어)
      - 유닛 수 15개로 축소, 3 Phase(산업 현장/생활/시험대비) 재편
      - 듣기 테스트 단계 + 산업 현장 듣기 비중 강조
      - Hero CTA secondary + 하단 orange CTA 단일화
- [x] 로그인 리다이렉트 통합 (단일 진실 공급원)
      - `lib/auth-redirect.ts` 신규: `resolveLoginDestination(userId)` — `getAccountContext()` 재사용
      - `app/auth/callback/route.ts` OAuth 콜백 리팩토링
      - `app/auth/_actions.ts` 신규 server action `getLoginDestination()`
      - `app/auth/page.tsx` `redirectByRole()` → server action 호출 방식으로 교체
      - 분기: preferred_language=null→/onboarding/language, kind=none+intended_plan→/pricing?resume=true,
        kind=none→/pricing, 그 외→/my
      - admin/master 역할 분기 제거 (현재 불필요)
- [x] /learn 페이지 완전 삭제
      - `app/learn/` 전체 디렉토리(17개 파일) 제거
      - `app/learn/me/signout-button.tsx` / `portal-button.tsx` → `app/my/components/` 로 이동
      - `app/my/page.tsx` import 경로 업데이트
- [x] 프로젝트 전체 `/learn` 하드코딩 `/my` 로 교체
      - `app/admin/_admin-nav.tsx` L76, L96 (학습자 화면 링크 × 2)
      - `app/admin/layout.tsx` L24 (비관리자 redirect)
      - `app/unit/[unitId]/UnitClient.tsx` L304 (railBrand 로고 링크)
      - `app/my/page.tsx` L357, L508 (`/learn/exam` → `/my`)
      - `app/auth/invite/_invite-form.tsx` L43, L81 (초대 수락 후 redirect × 2)
      - `app/auth/invite/page.tsx` L157 (계정 불일치 안내 CTA)
- [x] 빌드 통과 확인 (`npm run build`, 23.6s, 18 pages)
      - 경로 목록에 `/learn` 소멸, `http://localhost/learn` → 404 응답 검증
      - 루트 `proxy.ts` (Next 16 미들웨어 리네임) 는 세션 갱신만 수행 — `/learn` 리다이렉트 없음
- [x] /my 4계정 검증 후 결함 8건 일괄 수정
      1. UnitCard 잠금 분기 정정 — 구독자에게 [구독하기] 버튼 표시 제거
         (이전 주제 미완료 시: 자물쇠 + "이전 주제를 완료하면 열려요" 텍스트만)
      2. Trial 첫 잠금 주제(주제 3) navy 안내 박스: "체험은 주제 2까지 가능해요. 구독하고 12개 주제 전체를 학습할 수 있어요"
      3. planTier 콘텐츠 분기:
         - AISection: Basic 3개 / Premium 5개 + "Premium 에서 5가지 AI 확장 학습이 가능해요" 배너
         - 모의시험 횟수(1/3) 분기는 모의시험 페이지 재구현 시 적용 예정
      4. Today 카드 → 화살표 제거 → 명확한 navy [바로가기] 버튼 (orange 는 expired/trial한계만)
      5. Today 카드 "약 20분" 표시 삭제 (메타 → "5단계 중 N단계 · N%" 또는 "주제 N · 5단계 학습")
      6. 03 카드 "다시 연습해 보세요" → "다시 복습해 보세요"
         "지난 테스트에서 틀린 문제 0개" / "아직 테스트 기록이 없어요" 문구 제거
         학습 완료 주제 ≥ 1 시 "학습한 N개 주제 복습 가능" 동적 표시
      7. /unit 학습 완료 화면: 🎉 + 주제명 + orange [다음 주제 시작/구독하기/마이페이지로] + secondary [한번 더 복습] / [마이페이지로]
         - trial 주제 2 완료 → orange [구독하고 계속하기 →] /pricing
         - 마지막 주제 12 완료 → orange [마이페이지로 →]
      8. /my 캐시 정책: `dynamic = "force-dynamic"` + `revalidate = 0` (학습 직후 즉시 반영)
      9. 빌드 통과 확인 (Compiled successfully, exit 0)
- [x] Today 섹션 hero 안 통합 (원본 디자인 복원)
      - hero 위 별도 섹션 → Navy hero 내부 4컬럼 그리드 (2fr 1fr 1fr 1fr)
      - Today 카드: 흰 배경 / rounded 22 / shadow-card / 자체가 `<Link>` (별도 버튼 없음)
      - 레이블 12px mint, 제목 18px navy, 메타 13px sub, 우측 → 화살표
      - 잠금 상태(topik2/eps 콘텐츠 미준비)는 `<div>` 로 클릭 차단, 회색 배경
      - 모바일: Today full-width (col-span-2), 통계 2x2 또는 단일 컬럼
      - 빌드 통과 (18 pages, 30.1s)
- [x] /my 일괄 수정 (Trial 정책 확정 + 16결함 통합 패치)
      Trial 정책: "결제 등록 + 7일 무과금 + 주제 1, 2 체험"
      - Today 섹션 최상단 이동 (PRD §2 준수)
      - TodaySection 9가지 분기 정의 (Trial 2주제 한계 반영)
      - /unit 접근 제어 trial unitId<=2 허용 (이전: 1만 허용)
      - 새 reason: trial-limit-reached (주제 3+ 차단 시)
      - CourseTabs(ProgressTabs) trial 분기 b2c_active 통합 (이전: 모두 민트 → b2c_active 동일)
      - expired 잠금 회색 처리 (orange CTA 1개 규칙)
      - 03 섹션 trial 활성, 모의시험 navy(전체 완료시), expired blur 잠금
      - 04 결제 카드 trial "무료 체험 중 + 자동 결제 안내" 표시 + PortalButton
      - 결제 내역 카드 PortalButton 중복 제거 (텍스트만)
      - 헤더 통계 trial 정상 카운트 (b2c_active 동일)
      - 헤더 mint 원에 사용자 이름 첫 글자 표시
      - 헤더 인사말 좌측 정렬 (text-left)
      - 코스명 옆 "12 주제" 단위 표기
      - 학습 목록 진도바: 진행 중/완료만 표시, 미시작·잠금은 숨김
      - 이전 주제 5섹션 미완료 시 다음 주제 시작 버튼 잠금 (UnitList 재구현)
      - 첫 잠금 주제에 navy 안내 박스 1회 표시 (이전: 모든 잠금에 orange 버튼)
      - SignOutButton 빨강 → secondary navy outline (디자인 시스템 §4-2)
      - "유닛" → "주제" UI 텍스트 일괄 교체 (app/ 전체, 변수/타입명은 유지)
      - ?reason= 쿼리 안내 카드 (trial-locked / trial-limit-reached / plan-mismatch / previous-unit-required)
      - 빌드 통과 (18 pages, exit 0)
- [x] TodaySection 6+1 상태 분기 + expired 무한 루프 수정
      - 결함: `/my` 의 옛 hero "오늘 학습" 카드가 `accountKind` 무관하게 `/unit/{slug}` mint 버튼을 노출
        → expired 클릭 시 `/unit/[unitId]` 접근 제어가 다시 `/my` 로 리다이렉트하여 무한 루프
      - `app/my/components/TodaySection.tsx` 7 상태로 보강:
        1. fresh + b2c/b2b → "학습 시작하기 →" orange `/unit/1`
        2. in_progress (b2c/b2b/trialing) → "이어서 학습하기 →" orange `/unit/{n}`
        3. next (b2c) → "다음 유닛 시작하기 →" orange `/unit/{n+1}`
        4. all_done (b2c) → "처음부터 다시 학습하기" **navy** `/unit/1`
        5. b2c/b2b + topik2|eps → 회색 "🔒 콘텐츠 준비 중" 비활성
        6. expired → "구독 연장하기 →" orange **`/pricing`** (`/unit/*` 절대 금지)
        7. fresh + trialing → "체험 학습 시작하기 →" orange `/unit/1`
      - trialing maxUnit=1 강제 (unit 2+ 추천 차단으로 `/my?reason=trial-locked` 루프 방지)
      - `/my/page.tsx` 옛 hero Today 카드 제거, `<TodaySection />` 을 hero 외부 독립 섹션으로 배치
      - 이용 정보 섹션 trialing/expired 의 "구독하기" 버튼 orange → navy 로 변경 (orange CTA 1개 규칙 보호)
      - 빌드 통과 확인 (exit 0, 18 pages)

## 다음 작업 예정
- [ ] /my 탭 구조 변경 빌드 확인 및 로컬 검증
- [ ] /pricing 5단계 퍼널 페이지 개발
- [ ] / 랜딩 페이지 개발
- [ ] Stripe 상품 12개 생성 (price_T1_B_monthly 등)
- [ ] 무료/유료 접근 제한 로직

## 2026.04.25 완료
- [x] `/onboarding/language` 언어 선택 페이지 신규 생성 (`app/onboarding/language/page.tsx`)
      - plan 쿼리 기반 언어 분기: topik1/topik2 → vi/en/zh, eps-topik → vi/en/id
      - 선택 후 변경 불가 알럿 모달
      - Supabase `users.preferred_language` 업데이트
      - D형 디자인 (max-width 480px, 중앙 집중 레이아웃)
- [x] `preferred_language` 기본값 `'ko'` → `null` 변경
      - `supabase/migrations/005_preferred_language_null.sql` 추가
      - 기준 확정: null=미설정, vi/en/zh/id=선택완료
- [x] `/my` 마이페이지 전면 재설계 확정 (커밋 `c3cae3f`)
- [x] streak 시스템 구현 완료 (커밋 `c3cae3f`)
- [x] `user_progress` 복구 로직 추가 (커밋 `c3cae3f`)

## 2026.04.26 확정 정책

### 회원 유형 5분기 (accountKind)
| 유형 | 조건 | /my 접근 |
|---|---|---|
| b2b | academy_id 있음 | ✅ 허용 |
| trialing | status = 'trialing' | ✅ 허용 |
| expired | status = 'canceled' OR 만료일 지남 | ✅ 허용 (전체 잠금) |
| b2c_active | status = 'active' | ✅ 허용 |
| none | 구독 없음 | /pricing 리다이렉트 |

### 체험중 (trialing) 탭 접근 정책
- TOPIK 1 탭: 유닛 1개
- TOPIK 2 탭: 유닛 1개
- EPS-TOPIK 탭: 유닛 1개
- 복습 섹션: 허용 (학습 데이터 기반)
- 시험 섹션: 잠금

### 체험 만료 (expired) 정책
- /my 접근 허용
- 탭 3개 전체 잠금
- 하단 CTA: "구독하기 →" (/pricing 연결)

### /free-trial 정책
- 회원가입 필요, 카드 등록 없음
- 진도 저장 없음 (/free-trial 전용 공간)
- TOPIK 1 유닛 1개만, TOPIK 2/EPS 접근 없음
- /my 와 완전히 분리된 별도 공간

### 상품 구조 최종 확정 (2026.04.26)

#### 유닛 수
- TOPIK 1    → 15개 (기존 12개에서 변경 — 코드 전반 수정 필요)
- TOPIK 2    → 20개
- EPS-TOPIK  → 20개

#### 가격표 (USD)
| Price ID | 상품 | 등급 | 주기 | 가격 | 월 환산 |
|---|---|---|---|---|---|
| price_T1_B_monthly | TOPIK 1 | Basic | 월간 | $12.90 | - |
| price_T1_B_yearly | TOPIK 1 | Basic | 연간 | $92.90 | $7.70 |
| price_T1_P_monthly | TOPIK 1 | Premium | 월간 | $19.90 | - |
| price_T1_P_yearly | TOPIK 1 | Premium | 연간 | $142.90 | $11.90 |
| price_T2_B_monthly | TOPIK 2 | Basic | 월간 | $16.90 | - |
| price_T2_B_yearly | TOPIK 2 | Basic | 연간 | $121.90 | $10.20 |
| price_T2_P_monthly | TOPIK 2 | Premium | 월간 | $24.90 | - |
| price_T2_P_yearly | TOPIK 2 | Premium | 연간 | $179.90 | $15.00 |
| price_EPS_B_monthly | EPS-TOPIK | Basic | 월간 | $14.90 | - |
| price_EPS_B_yearly | EPS-TOPIK | Basic | 연간 | $106.90 | $8.90 |
| price_EPS_P_monthly | EPS-TOPIK | Premium | 월간 | $22.90 | - |
| price_EPS_P_yearly | EPS-TOPIK | Premium | 연간 | $164.90 | $13.70 |

#### 향후 확장 예정
| Price ID | 내용 | 금액 |
|---|---|---|
| price_EXAM_addon | 모의고사 1회 추가권 | 미정 |
| coupon_XX | 할인 쿠폰 | % 미정 |

#### Stripe 설정
- 통화: USD 기본 (Adaptive Pricing 활성화 권장 — IP 기반 현지 통화)
- 무료체험: trial_period_days 7일
- 상품 6개 (T1 Basic/Premium, T2 Basic/Premium, EPS Basic/Premium)
- Price ID 12개

#### 지원 언어
- TOPIK 1/2  → VN / EN / CN
- EPS-TOPIK  → VN / EN / ID

#### /pricing 5단계 퍼널
- STEP 1: 목표 선택 (TOPIK 1 / TOPIK 2 / EPS-TOPIK)
- STEP 2: 언어 선택 (상품별 분기)
- STEP 3: 상품 소개 (선택 상품 전용 페이지)
- STEP 4: 구독 선택 (Free 7일체험 / Basic / Premium)
- STEP 5: 결제 → Stripe Checkout

#### 테스트 계정 필요 목록 (SQL 준비 완료)
| 유형 | 이메일 | 상태 |
|---|---|---|
| b2b (학원생) | test_b2b@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| trialing (체험중) | test_trial@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| expired (체험만료) | test_expired@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| b2c_active TOPIK1 Basic | test_t1_basic@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| b2c_active TOPIK1 Premium | test_t1_premium@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| b2c_active TOPIK2 Basic | test_t2_basic@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| b2c_active TOPIK2 Premium | test_t2_premium@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| b2c_active EPS Basic | test_eps_basic@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| b2c_active EPS Premium | test_eps_premium@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| free-trial 방문자 | test_freetrial@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |

### 테스트 계정 필요 목록 (SQL 준비 완료)
회원 유형별 테스트 ID 생성 필요 — 상품 확정 후 일괄 생성

| 유형 | 이메일 | 상태 |
|---|---|---|
| b2b (학원생) | test_b2b@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| trialing (체험중) | test_trial@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| expired (체험만료) | test_expired@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| b2c_active TOPIK1 | test_topik1@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| b2c_active TOPIK2 | test_topik2@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| b2c_active PREMIUM | test_premium@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |
| free-trial 방문자 | test_freetrial@pluepe.com | SQL 준비 완료 (Dashboard 수동 생성 필요) |

## 다음 작업 예정 (2026.04.26~)
- [ ] `/my` 학습 목록 탭 구조 변경 (TOPIK1 / TOPIK2 / EPS 탭 분리)
- [ ] `/pricing` 상품 페이지
- [ ] 무료/유료 접근 제한 로직
- [ ] `/onboarding/checkout` 페이지 (미구현)
- [ ] `learning_start_date` 자동 기록 (미완)
- [ ] 모바일 반응형 확인

## 2026.04.23 완료 (후속)
- [x] `TestSection.tsx` — 듣기 문항 스크립트 노출 정책 개선
      - 문제 풀이 중(`s.status === "idle"`)에는 스크립트 숨김 (🔊 듣기 버튼만 노출)
      - 정답 확인 후(`s.status !== "idle" && q.script`)에만 "스크립트" 박스로 원문 공개
      - 실제 TOPIK1 듣기 시험과 동일한 체감 + 오답 복습용 정보 확보 양립
- [x] `data/topik1/u01_convenience_vi.json` — 금액 보기 한국어 표기 통일
      - `listening` 3문항 options 아라비아 → 한국어 (예: "1,500원" → "천오백 원")
      - `reading` 1문항 options, `mini_test` 2문항 options 동일 변환
      - 간판/영수증 텍스트(`reading_sign`/`reading_notice`/`reading_dialogue.text`)는 시각적 리얼리티 유지 위해 아라비아 숫자 보존
      - listening script 내부 금액 발화도 한국어로 바꿔 TTS 안정성 확보
- [x] `npm run build` 통과 (33 routes, TypeScript 검사 정상)

## 2026.04.23 완료
- [x] `app/learn/[courseId]/video-player.tsx` 진도 버그 수정
      - Player.js SDK 로드 + ready/timeupdate/ended 이벤트 구독
      - Bunny iframe 실제 재생 위치 기준 percent 계산
      - 5초 throttle + 중복 저장 방지 (`lastSavedAtRef`, `lastSavedSecondsRef`)
      - ended 시 최신 duration 으로 100% 저장
- [x] `supabase/migrations/003_learning_streak.sql` 작성
      - `users.learning_start_date timestamptz` + `users.streak int default 0` 추가
      - `user_progress.activity_date date` 추가
      - `(user_id, activity_date)` 복합 인덱스
- [x] `/my` 마이페이지 신규 개발 (서버 컴포넌트, `app/my/page.tsx`)
      - 6섹션: 헤더(Phase/Day/진도바) · Today(Phase별 CTA) · Progress(유닛 카드 12개) · Weakness(베타: 텍스트) · Exam(잠금/오픈) · Account(B2B/trialing/B2C/none 4분기)
      - 데이터: users(name·언어·academy_id·learning_start_date·streak) + user_progress(unit_id×section 집계) + subscriptions(self∪academy)
      - UNIT_CATALOG 매핑: `topik1_u01`→/unit/1(편의점), `topik1_u02`→/unit/2(지하철), 3~12 잠금
      - Phase 계산: learning_start_date 기준 Day 1~12 / 13~20 / 21~28
      - `/learn/me/signout-button` · `/learn/me/portal-button` 재사용 (파일 미수정)
- [x] 유닛 다국어(VI/EN/ZH/ID) 확장 1단계
      - `data/topik1/u01_convenience.json` → `u01_convenience_vi.json` 리네이밍 + 공통 필드명 구조 전환
      - `data/topik1/u01_convenience_en.json` 신규 추가 (영상은 PLACEHOLDER_EN)
      - `types.ts` — `translation` / `meaning` / `hint` / `example` / `options_ko` 공통 구조로 리팩터
      - `page.tsx` — Supabase `users.preferred_language` 기반 언어별 JSON 동적 로드 + `unitFileMap` 도입, placeholder 유닛은 Bunny 라이브러리 주입 건너뛰기
      - Session / Words / Patterns 컴포넌트 필드 참조 및 퀴즈 구조 업데이트
      - STEP 5 복습: 퀴즈형 → 카드 열람형으로 전환
      - SessionPlayer: PLACEHOLDER 영상일 때 "영상 준비 중입니다 / Video coming soon" 플레이스홀더 표시 + 해당 STEP 영상 시청 자동 충족
      - `/api/ai` — `language` 파라미터 분기 (vi/en/zh/id 별 시스템 프롬프트)
      - `AISection` — Claude 호출 시 `unit.language` 전달
- [x] 유닛 2 (지하철 타기) VI 콘텐츠 추가
      - `data/topik1/u02_subway_vi.json` 신규 (nested `session.step1/2/3` + 최상위 `bunny_video_ids` 포맷)
      - `page.tsx` unitFileMap 에 `"2": u02_subway` 추가 + `normalizeUnitShape()` 로 u02 nested 세션 → 공통 포맷 변환
      - `types.ts` — `bunny_video_ids?` 옵셔널 필드 추가
      - `SessionPlayer` 영상 해석: `bunny_video_ids.step{n}` → `step_videos[n]` → `bunny_video_id` 순으로 확장 (u01 기존 동작 유지)

## 2026.04.22 완료
- [x] PRD v7.0 확정
- [x] 마이페이지 PRD 확정
- [x] 전체 메뉴 구조도 확정
- [x] 베타 오픈 상품 리스트 확정
- [x] docs/ 문서 6개 저장
- [x] app/api/progress/route.ts 에러 핸들링 강화
- [x] Supabase user_progress 테이블 생성 (트리거 포함)
- [x] Bunny Player.js SDK 영상 완료 감지
- [x] seek 스킵 방지
- [x] 영상 AND 퀴즈 완료 정책 적용
- [x] 전체 퀴즈 정답 위치 분산
- [x] DEV_MODE = false 복구

## 다음 작업 예정
- [ ] Supabase DB 마이그레이션 (learning_start_date / streak)
- [ ] /my 마이페이지 개발
- [ ] /courses 유닛 목록 페이지
- [ ] / 랜딩 페이지
- [ ] 무료/유료 접근 제한 로직
- [ ] 로딩 스피너 (검은 배경 개선)
- [ ] 유닛 2 콘텐츠 생성

## 2026.04.21 완료

- [x] 유닛 1 (편의점에서 물건 사기) MVP 전체 완성
- [x] 5섹션 구현 (세션/단어/표현/테스트/AI확장)
- [x] 사이드바 레이아웃 전환 (200px + 1fr)
- [x] Supabase user_progress 테이블 + RLS
- [x] Claude API 서버 라우트 (/api/ai)
- [x] 퀴즈 확인 버튼 방식
- [x] 섹션 잠금 로직
- [x] 완료 배너
- [x] 테스트 해설 텍스트 표시
- [x] 유닛 완료(/my) / 다음 유닛 버튼 라우팅
- [x] DEV_MODE 개발 편의 플래그 → 배포 전 false 복구
- [x] 다음 버튼 클릭 시 상단 스크롤 수정
- [x] 제목 옆 현재 섹션 미니 카드 (고정 너비 160px)
- [x] STEP 탭 숫자 원문자 + ✓ 표시
- [x] 모바일 사이드바 → 상단 섹션 바 전환
- [x] 모바일 이전/다음 화살표 추가
- [x] Bunny 영상 STEP별 연결 (u01 vi 3개 최종)
- [x] Bunny iframe autoplay=false&preload=false&t=0
- [x] Bunny Title 규칙 확정
      (u1{유닛번호}_step{n}_{언어})
- [x] API 키 보안 점검 및 재발급
- [x] Vercel 배포 준비 완료
- [x] Netlify 프로덕션 배포 완료
      (`lucky-begonia-eea7de.netlify.app`, 개인 GitHub `pluepe/pluepe-korean-platform` fork)
- [x] Bunny 보안 설정 — Allowed domains 등록 + API Key / Token Key rotate
- [x] Netlify 환경변수 전체 주입 + `SECRETS_SCAN_ENABLED=false` / `SECRETS_SCAN_OMIT_KEYS=BUNNY_STREAM_LIBRARY_ID`
- [x] Bunny Library ID 하드코딩 제거
      (`data/topik1/u01_convenience.json`, `app/unit/[unitId]/page.tsx` → `process.env.BUNNY_LIBRARY_ID`)
- [x] `/unit/1` 프로덕션 E2E 검증 (영상 재생 · 0/5 포지션 · 사이드바 잠금 정상)

## 다음 작업 예정

- [ ] 유닛 2 (카페에서 주문하기) 콘텐츠 생성
- [ ] 마이페이지 진도율 연동
      (Bunny iframe postMessage 버그)
- [ ] 홈페이지 유닛 목록 페이지
- [ ] 무료/유료 접근 제한 로직
- [ ] Korean Studio: 썸네일 자동화
- [ ] Korean Studio: split_video.py 타임코드 수정

---

## 완료 목록

### 2026.04.21
**Netlify 프로덕션 배포 + Bunny 보안 정리 (세션 마무리)**
- [x] Netlify 사이트 생성 — 개인 GitHub `pluepe/pluepe-korean-platform` fork 연동
      URL: `lucky-begonia-eea7de.netlify.app`
- [x] Netlify Environment variables — `.env.local` 전체 값 등록
- [x] Netlify 빌드 설정 — `SECRETS_SCAN_ENABLED=false`, `SECRETS_SCAN_OMIT_KEYS=BUNNY_STREAM_LIBRARY_ID`
- [x] Bunny Dashboard — Allowed domains 에 `lucky-begonia-eea7de.netlify.app` + `localhost:3000` 추가
- [x] Bunny 키 재발급 — `BUNNY_STREAM_API_KEY`, `BUNNY_TOKEN_KEY` 모두 rotate
- [x] 하드코딩 제거 — `data/topik1/u01_convenience.json` 의 `bunny_library_id` 값 제거
- [x] 환경변수 연동 — `app/unit/[unitId]/page.tsx` 에서 `process.env.BUNNY_LIBRARY_ID` 로 주입
- [x] 프로덕션 E2E 검증 — `lucky-begonia-eea7de.netlify.app/unit/1`
      영상 재생 OK · 0% / 0/5 학습자 포지션 OK · 사이드바 잠금 OK

**유닛 1 (편의점에서 물건 사기) 훈련 시스템 MVP**
- [x] `data/topik1/u01_convenience.json` — CLAUDE_v3.md §8 전체 구조
      (session 5 STEP · words 8개 + quiz 3 · patterns 3 + blank quiz · mini_test 3문제 · ai_extension 3)
- [x] `app/unit/[unitId]/page.tsx` — 서버 컴포넌트, params 기반 JSON 동적 import, notFound 처리
- [x] `app/unit/[unitId]/types.ts` — UnitData 타입 + SECTION_ORDER/LABEL
- [x] `app/unit/[unitId]/UnitClient.tsx` — 5섹션 상위 탭 전환 + 진도바 + 완료 카드
- [x] `app/unit/[unitId]/unit.module.css` — navy/mint/orange 디자인 시스템 포팅 (training_player.html 기반)
- [x] `components/SessionPlayer.tsx` — Bunny iframe + STEP 1~5 (보기/빈칸/따라말하기/단어카드/복습)
- [x] `components/WordsSection.tsx` — 플래시카드 8개(플립) + words_quiz 3문제
- [x] `components/PatternsSection.tsx` — 패턴 3개 + 각 빈칸 퀴즈
- [x] `components/TestSection.tsx` — listening/reading/situation 3문제 + 오답 해설 + 결과 점수
- [x] `components/AISection.tsx` — ai_extension 3 프롬프트 → /api/ai 호출 + 에러 상태 처리
- [x] `app/api/ai/route.ts` — Claude API 서버 프록시 (fetch 직접 호출, SDK 미사용, unitTitle system 삽입)
- [x] `app/api/progress/route.ts` — user_progress upsert (비로그인 silent skip)
- [x] `supabase/migrations/002_user_progress.sql` — user_progress 테이블 + RLS + updated_at 트리거
- [x] 섹션 완료 조건: session(5 STEP 전체) · words(퀴즈 3 답변) · patterns(3 답변) · test(3 답변) · ai(1+ 호출)
- [x] 완료 기준: `localhost:3000/unit/1` 접속 시 전체 유닛 동작

### 2026.04.19
**/learn/me 로그아웃 버튼**
- [x] `app/learn/me/signout-button.tsx` — 클라이언트 컴포넌트, 확인 모달 + 빨간색 CTA
- [x] `supabase.auth.signOut()` → `router.replace("/auth")` + `router.refresh()`
- [x] 마이페이지 하단 섹션 추가 (구독자/비구독자 모두 노출)

**Admin 대시보드 E2E 시드**
- [x] `supabase/migrations/009_seed_admin_academy.sql` 작성
      (pluepe@gmail.com → admin 승격 + 테스트 학원 + 좌석 10석, 재실행 안전)

**Student 초대 플로우 전체 구현**
- [x] `supabase/migrations/010_invitations.sql` — invitations 테이블 + RLS + 좌석 증가/초대 수락 RPC
- [x] `lib/email/templates/student-invite.ts` — Resend 초대 메일 HTML 템플릿
- [x] `/api/admin/invitations` POST — 좌석 체크(used + pending < total) + 토큰 생성 + Resend 메일
- [x] `/api/invitations/lookup` GET — 토큰으로 초대 상세 조회 (accept 페이지용)
- [x] `/api/invitations/accept` POST — `accept_invitation` RPC 호출 (atomic: academy 매핑 + seats.used +1 + invitation 소진)
- [x] `/admin/students` — 초대 버튼 + 잔여 좌석 표시 + 대기 중 초대 목록 섹션
- [x] `/auth/invite?token=xxx` — 서버 컴포넌트 토큰 검증 + 상태별 분기(pending/accepted/expired/revoked)
- [x] InviteForm 클라이언트 컴포넌트 — 비로그인(signUp → accept) / 로그인(accept만) 이중 플로우
- [x] 이메일 충돌 가드 — 다른 계정으로 로그인된 경우 안내 카드
- [x] 좌석 초과 시 "좌석 없음" disabled 버튼으로 초대 차단
- [x] 빌드 통과 (27개 route)

---

### 2026.04.18
**Admin 원장 대시보드 착수**
- [x] `app/admin/layout.tsx` — 서버 auth 체크 + role guard (admin/master만 접근, student는 `/learn` 리다이렉트)
- [x] `app/admin/_admin-nav.tsx` — 데스크톱 사이드바(고정) + 모바일 상단 탭바 반응형
- [x] `app/admin/page.tsx` 대시보드 — 통계 카드 4개(학생 수·좌석 사용·평균 진도·7일 활동), 좌석 진행 바(90% 이상 빨간 경고), 학원 정보 dl
- [x] `app/admin/students/page.tsx` — 데스크톱 테이블 + 모바일 카드 리스트, users×progress 집계(평균 진도·완료 수·최근 학습 상대시간)
- [x] academy_id 미매핑 관리자 대응 UI (안내 카드 + Master에게 요청 안내)

**유료 강의 E2E + Next.js 16 마이그레이션**
- [x] `migration 006_seed_paid_course` 실행 (Video UID `37827d246ba393ddcc1b78c3e7115759`)
- [x] 비구독자 paywall → 결제 → 재생 E2E 검증 완료
- [x] 루트 `middleware.ts` → `proxy.ts` 리네이밍 (함수명도 `proxy`)
- [x] Next.js 16 deprecation 경고 제거 (빌드 통과)

**시험보기 기능 전체 구현**
- [x] questions 테이블 생성 + RLS + 샘플 14문항 시드
- [x] exam_results 컬럼 확장 (exam_type, category_breakdown 등)
- [x] `/api/exam/questions` GET (구독 체크 + correct_answer 서버 보호)
- [x] `/api/exam/submit` POST (서버 채점 + 카테고리/섹션별 분석)
- [x] `/learn/exam` 허브 페이지 (3카드 + 최근 기록)
- [x] `/learn/exam/[examType]` IBT 플레이어 (타이머·섹션탭·번호그리드·제출확인)
- [x] `/learn/exam/result/[resultId]` 결과 페이지 (점수·취약점 분석·오답노트·해설)
- [x] 마이페이지 시험 기록 자동 반영
- [x] E2E 전체 검증 완료

**E2E 검증**
- [x] `/learn/me` 4섹션 렌더 확인 (구독 카드·진도·시험·포털 CTA)
- [x] "처음부터 다시 보기" 버튼 → `last_position_seconds=0` + `percent` 유지 확인
- [x] Stripe Dashboard → Billing → Customer Portal 활성화 완료
- [x] 포털 버튼 → "정말 해지하시겠어요?" 모달 → Stripe 페이지 리다이렉트 확인
- [x] `/api/cron/trial-reminders` Bearer 인증 + 쿼리 동작 확인 (HTTP 200)
- [x] D-3 / D-1 / D-0 버킷 발송 테스트 통과 (Resend Dashboard 수신 로그 확인)
- [x] Supabase `migrations/005_subscription_trial_reminders.sql` 실행 완료

**RLS 보완**
- [x] `subscriptions` 정책을 `_self_or_member_select`로 교체
      (학원 소속 student도 자기 학원 구독 조회 가능, role 무관)
- [x] `supabase/migrations/002_subscriptions_academy_member_select.sql` 추가
- [x] `/learn/[courseId]/page.tsx`에서 user 구독 + academy 구독 동시 체크

**Stripe 결제 플로우**
- [x] `stripe` 서버 SDK 설치
- [x] `lib/stripe/server.ts` — Stripe 클라이언트 싱글턴 + Price ID 매핑
- [x] `/pricing` 페이지 (B2C 월/년, B2B 월간 3카드)
      `resolve_price` RPC로 국가/학원 오버라이드 반영
- [x] `/api/stripe/checkout` — plan_type 받아 Checkout 세션 생성,
      `trial_period_days: 7`, client_reference_id + metadata 저장
- [x] `/api/stripe/webhook` — `checkout.session.completed` +
      `customer.subscription.*` 이벤트에서 `subscriptions` upsert
      (service role 클라이언트로 RLS 우회)
- [x] `.env.local.example`에 Stripe Price ID 3종 + NEXT_PUBLIC_APP_URL 추가
- [x] `.env.local`에 Stripe 실키 주입
      (publishable, secret, webhook secret — 사용자 제공, 2026-04-18)
- [x] `/pricing` 카드에 "7일 무료체험" 뱃지 명시 + B2B 좌석제 표기 보완
- [x] `supabase/migrations/003_pricing_public_read.sql`
      pricing_default · pricing_country를 공개 read로 전환
      (비로그인 랜딩 방문자도 가격 카드 노출 — resolve_price RPC RLS 차단 이슈 해결)

**Stripe 에러 핸들링 + 실결제 검증**
- [x] Checkout route 전체 try/catch, `Stripe.errors.StripeError` 분기 처리
      (No such price 등 Stripe 에러가 JSON 응답으로 노출되도록)
- [x] 클라이언트 `res.text()` + 수동 JSON.parse —
      "Unexpected end of JSON input" 대신 정확한 HTTP 상태/에러 원문 표시
- [x] Stripe Dashboard에서 Product 3종 + Price 생성
      (b2c_monthly $9.99/월, b2c_yearly $89/년, b2b_monthly $7/월·좌석)
- [x] `.env.local`에 Price ID 3종 주입 + Node 스크립트로 `prices.retrieve` 검증 통과
- [x] 실결제 테스트 완료: 카드 클릭 → Stripe Checkout 리다이렉트 OK

**Cloudflare Stream DRM (Signed URL)**
- [x] `supabase/migrations/004_courses_subtitle_lang.sql` — `courses.subtitle_lang` 컬럼 + 인덱스
- [x] `/learn/topik1` · `topik2` · `eps-topik` placeholder 제거,
      `app/learn/_course-list.tsx` 공통 서버 컴포넌트로 `courses` 테이블 쿼리 연결
      (레벨/자막/무료·유료 뱃지 표시, 비로그인 시 `/auth` 리다이렉트)
- [x] 테스트 영상 재생 E2E 검증 (공개 Video UID 방식)
- [x] `jsonwebtoken` 설치 + `lib/cloudflare/stream.ts`
      `signStreamToken(videoId, ttl)` RS256 JWT 서명 유틸
- [x] Cloudflare Stream Signing Key 생성 (스크립트로 1회 발급)
      `.env.local`에 `CLOUDFLARE_STREAM_SIGNING_KEY_ID` + `_PEM`(base64) 저장
- [x] 테스트 영상 `requireSignedURLs=true` API 활성화
- [x] `/learn/[courseId]/page.tsx`에서 signed JWT 생성 후 VideoPlayer에 전달
- [x] VideoPlayer prop `videoId` → `videoSrc`로 변경, 드래그 방지 추가
- [x] `.env.local.example`에 Signing Key 2종 placeholder 추가
- 참고: Cloudflare Stream `downloads` 엔드포인트 미생성 상태 + `requireSignedURLs` 덕분에
        다운로드 URL 자체가 존재하지 않아 다운로드 불가 (기본값)
- [x] 브라우저 E2E DRM 검증 완료 (로그인 상태 재생 OK + manifest 직접 접근 차단 확인)

**플레이어 · 마이페이지**
- [x] VideoPlayer에 "↻ 처음부터 다시 보기" 버튼
      `progress.last_position_seconds`만 0으로 update, percent/completed_at 보존
      (update 방식이라 신규 행 생성 없음)
- [x] `/api/stripe/portal` — Customer Portal 세션 생성 라우트
      (self + academy_id의 stripe_customer_id 조회, 없으면 404)
- [x] `/learn/me` 마이페이지 4섹션
      ① 구독 상태 카드 (플랜명 · 상태 뱃지 · 체험 D-day · 체험 종료일 · 다음 결제일)
      ② 학습 진도 리스트 (progress × courses join, Progress bar 완료 시 초록)
      ③ 최근 시험 기록 (exam_results, 데이터 없을 때 빈 상태 UI)
      ④ 구독 관리 버튼 → Stripe Customer Portal 리다이렉트
- [x] `PortalButton` 클라이언트 컴포넌트 — res.text() + JSON.parse 방어적 파싱
- [x] 비구독자 전용 CTA — 하단에 "7일 무료로 시작하기" emerald 버튼
      + "체험 종료 전 언제든 해지 가능 · 해지 시 요금 없음" 안내문
- [x] PortalButton에 "정말 해지하시겠어요?" 확인 모달 추가
      (취소 / 이동하기 2버튼, aria-modal 접근성)

**Resend 체험 만료 이메일 (D-3 / D-1 / D-day)**
- [x] SendGrid → Resend로 메일 스택 변경 (CLAUDE.md 반영)
- [x] `resend` SDK 설치, `lib/email/resend.ts` — 클라이언트 싱글턴 + sendEmail 유틸
- [x] `lib/email/templates/trial-ending.ts`
      bucket별 subject/headline + 한국어 HTML 템플릿
      (체험 종료일·다음 결제일 박스 + 구독 관리 CTA)
- [x] `supabase/migrations/005_subscription_trial_reminders.sql`
      subscriptions에 `trial_reminder_3d/1d/0d_sent_at` 3개 타임스탬프 컬럼
      + trialing 파셜 인덱스
- [x] `/api/cron/trial-reminders` GET 핸들러
      Bearer CRON_SECRET 인증, service role로 조회,
      D-0 > D-1 > D-3 우선순위로 중복 없이 한 번 발송,
      발송 성공 시 컬럼 타임스탬프 update
- [x] B2C / B2B 수신자 분기 (users.email / academies.contact_email)
- [x] `vercel.json` — `0 15 * * *` (매일 00:00 KST) 스케줄
- [x] `.env.local` + `.example`에 `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET` 추가

---

### 2026.04.17
**프로젝트 기반**
- [x] Next.js 16.2.4 + React 19 + Tailwind v4 프로젝트 생성
- [x] Supabase 연결 (client/server/middleware)
- [x] .env.local 환경변수 설정 (Supabase URL/anon/service-role)
- [x] CLAUDE.md 프로젝트 문서 작성
- [x] 타겟 지역에 한국 추가 (동남아 3국 + 한국)

**DB·스키마**
- [x] Supabase DB 테이블 10개 생성
      (users, academies, courses, progress, exam_results,
       subscriptions, seats, pricing_default/country/academy)
- [x] RLS 정책 적용 (Master / Admin / Student 3단계)
- [x] courses.is_free 컬럼 migration (supabase/migrations/001)

**인증**
- [x] Supabase Auth 연동 (이메일 + Google + 카카오 OAuth)
- [x] 로그인 페이지 `/auth` (모바일 우선, 5개 언어 전환, role별 redirect)
- [x] 회원가입 페이지 `/auth/signup` (모바일 우선, 5개 언어)
- [x] OAuth 콜백 라우트 `/auth/callback` (role 기반 자동 이동)
- [x] 로그인/회원가입 공용 다국어 모듈 `app/auth/_auth-i18n.ts`

**학습자 UI**
- [x] 학습자 메인 `/learn` 레이아웃 + 하단 탭바
      (강의 / 시험보기 / 단어외우기 / 마이페이지)
- [x] 강의 허브 카드 3종 (TOPIK 1/2, EPS-TOPIK)
- [x] 서브 라우트 6개 (topik1, topik2, eps-topik, exam, vocab, me)
- [x] Cloudflare Stream 영상 플레이어 `/learn/[courseId]`
      (@cloudflare/stream-react SDK, 우클릭 방지,
       0.75/1/1.25/1.5x 속도 전환,
       5초마다 progress.last_position_seconds 자동 저장,
       마지막 위치 자동 재개, 완료 시 completed_at 기록)
- [x] 유료/무료 강의 분기 + 비구독자 paywall 모달

**Role별 placeholder**
- [x] /admin, /master 기본 페이지

---

## 내일 (2026.04.19)

### 우선순위 1: Admin 대시보드 E2E + 시드
- [ ] academy 1건 + admin 계정 매핑 + seats 행 생성 시드 SQL
- [ ] `/admin` 대시보드 렌더 확인 (통계 카드·좌석 바·학원 정보)
- [ ] `/admin/students` 학생 목록 · 진도 집계 확인 (데스크톱 테이블 + 모바일 카드)
- [ ] student 초대 플로우 설계 (이메일 초대 or 가입 시 학원 코드 입력)

### 우선순위 2: Resend 프로덕션 배포 마무리
- [ ] Resend 프로덕션 env 등록 (Vercel Dashboard)
- [ ] Resend 도메인 인증 (pluepe 도메인 확보 후 `RESEND_FROM_EMAIL` 교체)

### 우선순위 3: Master 운영자 콘솔 (전체 학원 / 매출 / 강의 업로드)
- [ ] `/master` — 전체 학원 · 구독 · 매출 요약
- [ ] `/master/courses/new` 강의 업로드 폼
      (Cloudflare Direct Upload → requireSignedURLs: true → courses row 생성)

---

## 이후 (우선순위순)

- [ ] Master 콘솔 (`/master`) — 전체 학원·구독·매출 요약
- [ ] AI 챗봇 (Claude API, `app/api/chat/route.ts`, Sonnet 모델)
- [ ] 오답 해설 AI (exam_results.answers → Claude API)
- [ ] Cloudflare Stream 업로드 플로우 (Master용 강의 등록 UI)
- [ ] 단어 암기 (SRS 간격 반복 로직)
- [x] ~~시험 모의고사 (IBT 스타일 UI + 타이머 + 자동 채점)~~ — 2026.04.18 완료 + E2E 검증 통과
- [x] ~~Resend 메일 템플릿 (체험 D-3 / D-1 / D-day 알림)~~ — 2026.04.18 완료 + E2E 검증 통과
- [ ] PWA manifest + service worker (오프라인 단어장)
- [ ] 국가별 가격 override seed (pricing_country) — 인도네시아·중국·캄보디아
- [ ] i18n 전역 확장 (로그인 외 학습자 UI까지 5개 언어)
- [ ] Vercel 배포 + 커스텀 도메인

---

## 수동 설정 잔여 (비개발자 직접 처리)

- [ ] Supabase Dashboard → Authentication → Providers에서 Google·Kakao 활성화
      (각각 Client ID/Secret 발급 후 입력)
- [ ] Supabase Authentication → URL Configuration에 localhost + 프로덕션 URL 등록
- [ ] Supabase SQL Editor에 `supabase/migrations/001_courses_is_free.sql` 실행
- [ ] Supabase SQL Editor에 `supabase/migrations/002_subscriptions_academy_member_select.sql` 실행
- [ ] Supabase SQL Editor에 `supabase/migrations/003_pricing_public_read.sql` 실행
- [ ] Supabase SQL Editor에 `supabase/migrations/004_courses_subtitle_lang.sql` + 테스트 강의 시드 실행
- [x] Supabase SQL Editor에 `supabase/migrations/005_subscription_trial_reminders.sql` 실행
- [ ] Supabase SQL Editor에 `supabase/migrations/006_seed_paid_course.sql` 실행
- [ ] Supabase SQL Editor에 `supabase/migrations/009_seed_admin_academy.sql` 실행
- [ ] Supabase SQL Editor에 `supabase/migrations/010_invitations.sql` 실행
- [ ] Supabase SQL Editor에 `supabase/migrations/002_user_progress.sql` 실행 (유닛 훈련 진도 저장용)
- [ ] Supabase SQL Editor에 `supabase/migrations/003_learning_streak.sql` 실행 (learning_start_date / streak / activity_date 컬럼 추가)
- [ ] Supabase SQL Editor에서 `supabase/migrations/004_users_streak_rls.sql` 실행 (users_update_own 정책 — streak 업데이트용)
- [ ] Supabase Dashboard → Authentication → Users → Add user (`student1@test.com`)
- [ ] Supabase SQL Editor에 `supabase/migrations/011_seed_test_student.sql` 실행 (위 가입 후)
- [x] Supabase SQL Editor에 `supabase/migrations/007_questions_table.sql` 실행
- [x] Supabase SQL Editor에 `supabase/migrations/008_exam_results_extend.sql` 실행
- [ ] Resend Dashboard에서 프로덕션 도메인 인증 (pluepe 도메인 생기면)
- [ ] Vercel Dashboard → Project → Environment Variables에 RESEND_API_KEY + CRON_SECRET 등록 (배포 시)
- [ ] Cloudflare Stream에 테스트 영상 업로드 후 Video UID 확보
- [ ] Cloudflare Dashboard에서 Stream API Token 발급 → `.env.local`에 주입
- [x] Stripe Dashboard에서 Product/Price 3종 생성 후 Price ID 복사 → `.env.local`
- [ ] Stripe Dashboard → Developers → Webhooks에 `/api/stripe/webhook` 엔드포인트 등록 (배포 시)
- [x] Stripe Dashboard → Settings → Billing → Customer Portal 기능 활성화
- [ ] `.env.local`에 `ANTHROPIC_API_KEY` 추가 (유닛 AI 확장 섹션 동작용) — **training_player.html에 유출된 기존 키는 Anthropic 콘솔에서 즉시 revoke 필요**

---

## 스택
- Frontend: Next.js 16.2.4 + Tailwind v4 + TypeScript
- DB/Auth: Supabase (PostgreSQL + RLS + @supabase/ssr)
- 영상: Cloudflare Stream (@cloudflare/stream-react)
- 결제: Stripe
- AI: Claude API (Sonnet)
- 메일: Resend (Vercel Cron 트리거)
- 호스팅: Vercel
