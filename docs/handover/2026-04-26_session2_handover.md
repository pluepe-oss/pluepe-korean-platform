# pluepe 한국어 플랫폼 — 세션 인수인계 문서 (2차)

작성일: 2026.04.26 (오후 세션)
세션: 라이브러리 작업 — 콘텐츠팀 JSON → 플랫폼 JSON 변환 파이프라인 구축

## 📌 프로젝트 정보

- 경로: C:\Users\song\Desktop\pluepe-korean-platform
- GitHub: pluepe-oss/pluepe-korean-platform (주의: pluepe/ 아님)
- 콘텐츠 repo: pluepe-oss/korean-studio
- 배포: lucky-begonia-eea7de.netlify.app
- DB: Supabase
- Stack: Next.js 15 + Supabase + Tailwind + TypeScript

## ✅ 오늘 완료된 작업

### 1. 변환 파이프라인 구축 (scripts/convert_unit.py)
- 콘텐츠팀 JSON → 플랫폼 JSON 자동 변환 스크립트 (~370줄)
- 기능:
  - 직접 매핑 (단어/표현/영상 GUID/주제명)
  - Claude API 자동 생성 (퀴즈 7종: step1_quiz/step2_blanks/step5_review/words_quiz/patterns.blank_quiz/mini_test/ai_extension)
  - 번역 폴백: 빈 번역 필드 발견 시 Claude API로 ko→대상언어 일괄 번역 (1회 호출)
  - 언어 파라미터: --languages vi,en,zh 등으로 다국어 일괄 변환
  - Windows cp949 안전 처리
  - API 실패 시 폴백 처리

### 2. 폴더 구조 생성
- data/content_team/topik1/ — 콘텐츠팀 원본 JSON 보관
- data/content_team/eps_topik/ — EPS 원본 JSON 보관
- data/topik1/ — 플랫폼 학습 데이터 (변환 결과물)
- data/eps_topik/ — EPS 플랫폼 학습 데이터
- scripts/ — 변환 스크립트

### 3. 콘텐츠팀 JSON 5개 복사 완료
- data/content_team/topik1/u101_편의점에서_물건_사기.json
- data/content_team/topik1/u102_지하철_타기.json
- data/content_team/topik1/u103_카페에서_음료_주문하기.json
- data/content_team/topik1/u104_쇼핑몰에서_옷_사기.json
- data/content_team/eps_topik/u301_작업_지시_이해하기.json

### 4. vi 언어 변환 완료 — 5개 유닛

| 유닛 | 출력 파일 | Bunny | 번역폴백 | is_free |
|---|---|---|---|---|
| u101 편의점 | data/topik1/u01_convenience_vi.json | ⚠️ GUID 미업로드 | 사용안함 | true |
| u102 지하철 | data/topik1/u02_subway_vi.json | ✅ | 사용안함 | false |
| u103 카페 | data/topik1/u03_cafe_vi.json | ✅ | 15개 일괄 | false |
| u104 쇼핑몰 | data/topik1/u04_shopping_vi.json | ✅ | 사용안함 | false |
| u301 EPS작업지시 | data/eps_topik/u01_work_instruction_vi.json | ✅ | 13개 일괄 | true |

## 🔧 파이프라인 사용법

### 기본 실행
python scripts/convert_unit.py --input data/content_team/topik1/u102_지하철_타기.json --languages vi

### 다국어 일괄 변환
python scripts/convert_unit.py --input data/content_team/topik1/u102_지하철_타기.json --languages vi,en,zh

### EPS (vi/th/id)
python scripts/convert_unit.py --input data/content_team/eps_topik/u301_작업_지시_이해하기.json --languages vi,th,id

### GUID 업로드 후 재변환 (u101)
콘텐츠팀 JSON bunny_guids.vi 채운 후:
python scripts/convert_unit.py --input data/content_team/topik1/u101_편의점에서_물건_사기.json --languages vi

### 신규 유닛 추가 시
scripts/convert_unit.py 상단 SLUG_MAP에 1줄 추가 후 실행
예: "u105": "restaurant"

## 🚨 미결 사항 및 결정 필요

### 1. u101 편의점 Bunny GUID 미업로드 (🔴 블로커)
- 콘텐츠팀이 Bunny.net에 영상 업로드 후 bunny_guids.vi 채워서 재납품 필요
- 재납품 후 변환 스크립트 재실행 1번으로 해결

### 2. u104 쇼핑몰 ↔ 플랫폼 카탈로그 4번 불일치 (🟡 결정 필요)
- PRD 4번: 식당에서 음식 주문하기
- 콘텐츠팀 제작: u104 = 쇼핑몰에서 옷 사기
- 추천: 플랫폼 카탈로그를 실제 제작 순서에 맞춰 수정
  → app/my/page.tsx UNIT_CATALOG 4번을 쇼핑몰로 교체
  → 식당은 콘텐츠팀 다음 제작 시 해당 번호 배치
- 현재: unitFileMap에 미등록 상태라 학습화면 미노출 (안전)

### 3. en/zh 언어 변환 미완료 (🟡 다음 세션)
TOPIK1 4개 유닛의 영어/중국어 버전 미생성
명령어:
python scripts/convert_unit.py --input data/content_team/topik1/u102_지하철_타기.json --languages en,zh
python scripts/convert_unit.py --input data/content_team/topik1/u103_카페에서_음료_주문하기.json --languages en,zh
python scripts/convert_unit.py --input data/content_team/topik1/u104_쇼핑몰에서_옷_사기.json --languages en,zh

### 4. EPS th/id 언어 변환 미완료 (🟡 다음 세션)
python scripts/convert_unit.py --input data/content_team/eps_topik/u301_작업_지시_이해하기.json --languages th,id

### 5. unitFileMap 미등록 (🟡 다음 세션)
현재 /unit/[unitId]/page.tsx unitFileMap에 1, 2번만 등록
→ u03/u04/EPS u01을 학습화면에 노출하려면 매핑 추가 필요
→ u104 카탈로그 정합성 결정 후 진행

### 6. Supabase DB 등록 미완료 (🟡 다음 세션)
변환된 JSON을 DB에 등록해야 실제 플랫폼 구동 가능

## ⏳ 이월된 이전 세션 잔여 결함

### #t1-19: expired 결제 이력 메시지 모호
현재: "구독이 만료되었습니다 / 이전 결제 이력을 확인하려면 구독 연장 후 가능합니다"
수정: "구독 정보 없음 / 구독 연장 시 결제 정보가 표시됩니다"
파일: app/my/page.tsx 04 결제 내역 카드
우선순위: 🟡

### test_t2_basic 2차 검증 미완료
우선순위: 🟡

## 🎯 다음 세션 추천 순서

1. u104 카탈로그 정합성 결정 → 플랫폼 카탈로그 수정
2. en/zh/th/id 언어 변환 완료 (명령어만 실행)
3. unitFileMap 등록
4. Supabase DB 등록
5. 플랫폼에서 유닛 실제 플레이 검증
6. u101 GUID 수신 후 재변환

## 📂 핵심 파일 위치

### 변환 파이프라인
- 스크립트: scripts/convert_unit.py
- 원본 JSON: data/content_team/topik1/ / data/content_team/eps_topik/
- 변환 결과: data/topik1/ / data/eps_topik/

### 코드
- /my 페이지: app/my/page.tsx
- /unit 페이지: app/unit/[unitId]/page.tsx
- 유닛 컴포넌트: app/unit/[unitId]/components/
- 타입 정의: app/unit/[unitId]/types.ts
- 강의 목록: app/courses/topik1/_components/CurriculumSection.tsx

### 문서
- PRD_v7_pluepe_korean_platform.md
- PRD_mypage.md
- design_system.md
- CLAUDE.md
- PROGRESS.md

## 🔑 테스트 계정 (비밀번호 Test1234!)

| 이메일 | 유형 |
|---|---|
| test_trial@pluepe.com | TOPIK1 Basic 체험 |
| test_expired@pluepe.com | 구독 만료 |
| test_t1_basic@pluepe.com | TOPIK1 Basic |
| test_t1_premium@pluepe.com | TOPIK1 Premium |
| test_t2_basic@pluepe.com | TOPIK2 Basic |
| test_t2_premium@pluepe.com | TOPIK2 Premium |
| test_eps_basic@pluepe.com | EPS Basic |
| test_eps_premium@pluepe.com | EPS Premium |
| test_b2b@pluepe.com | B2B 학원생 |
| test_freetrial@pluepe.com | 미구독 |

## 📋 전체 보류 티켓

### 라이브러리
- #25: 라이브러리 데이터 구조 분석 ✅ 완료
- #26: 콘텐츠팀 JSON → 플랫폼 JSON 변환 파이프라인 ✅ 완료
- #27: 데이터 등록 + 검증 🔄 진행중 (en/zh/th/id + DB등록 남음)

### 코드
- #t1-19: expired 결제 이력 메시지 🟡
- #14: GNB 구현 (메인 페이지 기획 후)
- #15: 콘텐츠 난이도 분기 (unit JSON 보강 후)
- #16: /pricing 전면 재기획
- #17: 약점 분석 섹션
- #18: 모의시험 횟수 분기
- #19: 메인 페이지 (랜딩) 구현 🔴 블로커 (배포 전 필수)
