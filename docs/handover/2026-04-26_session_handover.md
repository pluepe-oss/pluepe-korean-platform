# pluepe 한국어 플랫폼 — 세션 인수인계 문서

작성일: 2026.04.26
세션: /my 페이지 검증 + 라이브러리 작업 정책 수립

## 📌 프로젝트 정보

- 경로: C:\Users\song\Desktop\pluepe-korean-platform
- GitHub: pluepe/pluepe-korean-platform
- 콘텐츠 repo: pluepe-oss/korean-studio
- 배포: lucky-begonia-eea7de.netlify.app
- DB: Supabase
- Stack: Next.js 15 + Supabase + Tailwind + TypeScript

## ✅ 완료된 작업 (이번 세션)

### 1. DB 시드 보정
- preferred_language NULL 문제 해결
- test_trial 비밀번호 재설정
- subscriptions 컬럼 확인 (trial_ends_at 사용)

### 2. /my 페이지 1차 일괄 수정 (16건)
- TodaySection 분기 정상화
- 헤더 좌측 정렬, 사용자 이니셜
- "유닛" → "주제" 일괄 변경
- 03 카드 정리

### 3. 4개 계정 1차 시각 검증
- test_t1_basic, test_trial, test_expired, test_t2_basic
- 8건 추가 결함 발견

### 4. /my 페이지 2차 일괄 수정 (8건)
- ★ TOPIK 1 주제 12 → 15 (4 Phase 구조)
- ★ "구독 갱신" → "구독 연장" 일괄 변경
- ★ Trial 학습 목록 시각 구분 (주제 2 활성 / 주제 3 navy 안내 박스)
- AISection Trial 별도 메시지
- 04 결제 내역 카드 구독 상태별 분기
- PRD §10 정정 (12 → 15)
- unitFileMap 갭 처리 (자동 "준비 중")

### 5. 4개 계정 2차 시각 검증
- test_t1_basic, test_trial, test_expired 검증 완료
- test_t2_basic 2차 미검증 (다음 세션)
- 신규 결함 1건 발견 (#t1-19)

### 6. 데이터 구조 분석
- 콘텐츠팀 JSON vs 플랫폼 JSON 차이점 파악
- 변환 방식 옵션 정리
- 라이브러리 작업 정책 수립

## 🎯 확정된 정책

### 다국어 정책
- TOPIK 1, TOPIK 2: VI / EN / ZH (3개 언어)
- EPS-TOPIK: VI / TH / ID (3개 언어)

### TOPIK 1 = 15개 주제 (4 Phase)
- Phase 1 (1~5): 처음 한국어 (편의점/지하철/카페/식당/길)
- Phase 2 (6~9): 생활 한국어 (병원/약국/은행/쇼핑몰)
- Phase 3 (10~12): 일상 한국어 (학원/숙소/일정)
- Phase 4 (13~15): 나에 대해 (가족/취미/날씨) - locked: true

### 콘텐츠 라이브러리
- 어휘/패턴/문항 30개 이상씩
- AI 확장: Basic 3개 / Premium 5개
- 모의시험: Basic 1회 / Premium 3회

### 콘텐츠팀 vs 플랫폼 역할 분담
- 콘텐츠팀: 대본 + 영상 + 다국어 번역
- 플랫폼: JSON 변환 + 부족 데이터 자동 생성 (Claude Chat 활용)

### 데이터 저장
- 콘텐츠팀 JSON: korean-studio/exports/platform_scripts/
- 학습 JSON 저장: data/topik1/, data/eps_topik/
- 파일명: u{번호}_{영문}_{언어}.json

## 🚨 잔여 결함

### 결함 #t1-19: expired 결제 이력 메시지 모호 (간단 수정)

현재:
"구독이 만료되었습니다"
"이전 결제 이력을 확인하려면 구독 연장 후 가능합니다"

문제: 무료 체험 후 만료된 사용자도 "이전 결제 이력" 표시 → 혼란

수정안 (옵션 B 권장):
"구독 정보 없음"
"구독 연장 시 결제 정보가 표시됩니다"

영향: app/my/page.tsx 04 결제 내역 카드
우선순위: 🟡

## ⏳ 미완료 작업

### 검증 미완료
- test_t2_basic 2차 캡처
- 학습 화면 진입 검증:
  - AI 확장 갯수 (Basic 3 / Premium 5)
  - 모의시험 횟수 분기
  - 학습 완료 화면
- /unit 접근 제어 (시나리오 B)
- /pricing resume 검증 (시나리오 C, limited)
- /courses 페이지 검증 (시나리오 D)

### 라이브러리 작업 미시작
콘텐츠팀이 5개 JSON 제공 (korean-studio/exports/platform_scripts/):
- u101 편의점 (TOPIK1, GUID 미업로드 ⚠️)
- u102 지하철 (TOPIK1, GUID ✅)
- u103 카페 (TOPIK1, GUID ✅)
- u104 쇼핑몰 (TOPIK1, GUID ✅)
- u301 EPS 작업 지시 (EPS, GUID ✅)

작업 필요:
1. 데이터 변환 방식 결정
   - 옵션 B 권장: 변환 레이어 (플랫폼 코드 변경 X)
2. ID 체계 결정
   - 옵션 A 권장: 1xx/2xx/3xx 체계 (콘텐츠팀과 일관)
3. u101 vs u01 정합성 확인
4. 부족 데이터 자동 생성 (Claude Chat 활용):
   - 본테스트 30~40개
   - AI 확장 5개
   - 어휘/패턴 퀴즈 각 10개
   - 문장 뱅크 50+
5. 다언어 분리 (1파일=다언어 → 1파일=1언어)
6. 플랫폼 JSON 형식으로 변환
7. 영상 GUID 매핑

예상 작업 시간: 28~32시간

## 🎫 보류 티켓 목록

### 코드 작업
- #14: GNB 구현 (메인 페이지 기획 후)
- #15: 콘텐츠 난이도 분기 (unit JSON 보강 후)
- #16: /pricing 전면 재기획 (가격 정책 확정 후)
- #17: 약점 분석 섹션 (모의시험 데이터 누적 후)
- #18: 모의시험 횟수 분기 (Basic 1 / Premium 3)
- #19: 메인 페이지 (랜딩) 구현
- #t1-19: expired 결제 이력 메시지

### 라이브러리 작업
- #25: 라이브러리 데이터 구조 분석 (Phase 1)
- #26: 콘텐츠팀 JSON → 플랫폼 JSON 변환 (Phase 2)
- #27: 데이터 등록 + 검증 (Phase 3)

## 🔑 테스트 계정 (모든 비밀번호 Test1234!)

| 이메일 | 유형 |
|---|---|
| test_b2b@pluepe.com | B2B 학원생 |
| test_trial@pluepe.com | TOPIK1 Basic 체험 |
| test_expired@pluepe.com | 구독 만료 |
| test_t1_basic@pluepe.com | TOPIK1 Basic |
| test_t1_premium@pluepe.com | TOPIK1 Premium |
| test_t2_basic@pluepe.com | TOPIK2 Basic (콘텐츠 준비 중) |
| test_t2_premium@pluepe.com | TOPIK2 Premium |
| test_eps_basic@pluepe.com | EPS Basic |
| test_eps_premium@pluepe.com | EPS Premium |
| test_freetrial@pluepe.com | 미구독 (intended_plan 테스트용) |

## 📂 핵심 파일 위치

### 코드
- /my 페이지: app/my/page.tsx + components/
- /unit 페이지: app/unit/[unitId]/page.tsx + components/
- /courses 페이지: app/courses/topik1/_components/CurriculumSection.tsx
- 인증: app/auth/, lib/account-kind.ts, lib/auth-redirect.ts
- 학습 데이터: data/topik1/u01_convenience_vi.json (표본)
- 타입 정의: app/unit/[unitId]/types.ts (UnitData 인터페이스)

### 문서
- PRD_v7_pluepe_korean_platform.md (전체 서비스 PRD)
- PRD_mypage.md (마이페이지 PRD)
- design_system.md (디자인 시스템)
- CLAUDE.md (프로젝트 규칙)
- PROGRESS.md (진행 기록)

## 🚦 다음 세션 시작 시 옵션

### 옵션 A: 잔여 검증 완료
- 결함 #t1-19 수정
- test_t2_basic 2차 캡처
- 학습 화면 검증 (AI 확장, 모의시험, 학습 완료)
- /unit 접근 제어 검증
- 예상 시간: 1~2시간

### 옵션 B: 라이브러리 작업 시작
- 데이터 변환 방식 결정
- ID 체계 결정
- 5개 콘텐츠팀 JSON 가공 시작
- 예상 시간: 4~6시간 (Phase 1만)

### 옵션 C: 빌드 + Netlify 배포
- 현재 상태로 일단 배포
- 잔여 결함은 추후 처리
- 예상 시간: 30분
