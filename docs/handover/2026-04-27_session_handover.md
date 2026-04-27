# 2026-04-27 세션 인수인계

## 1. 오늘 완료된 작업

### 환경 세팅
- 새 노트북에서 Node.js 위치(`C:\Program Files\nodejs\`) 확인 → 셸 PATH 미반영 이슈 회피용으로 `npm.cmd`를 풀패스로 호출하는 절차 정착
- `.next` 캐시 손상으로 발생하던 Turbopack panic(`Next.js package not found`) → `.next` 정리 후 dev 재시작으로 해소 (Ready 7.4s → 609ms 단축)

### 콘텐츠 변환 (다국어)
- `scripts/convert_unit.py` 모델을 deprecated `claude-sonnet-4-20250514` → `claude-sonnet-4-6` 으로 교체
- TOPIK1 u102 / u103 / u104 → en, zh 변환 완료
- EPS u301 → th, id 변환 완료

### 라우팅 및 UI
- `app/unit/[unitId]/page.tsx` `unitFileMap` 에 `"3": u03_cafe`, `"4": u04_shopping` 추가
- `app/unit/[unitId]/components/SessionPlayer.tsx:88` — `currentVideoId` undefined 시 `startsWith` 호출 NPE 수정 (`?.startsWith("PLACEHOLDER") ?? true`, embed URL 도 `?? ""`)
- **EPS 라우트 신설** `app/unit/eps/[unitId]/page.tsx` — 기존 TOPIK1 라우트 기반, 다음 5가지만 분기:
  - `loadUnitJson` 경로 → `@/data/eps_topik/`
  - `SUPPORTED_LANGS` → `["vi", "th", "id"]` (EPS 의 `th` 신규 지원)
  - `prevUnitTableId` prefix → `eps_u`
  - `THIS_ROUTE_COURSE = "eps"` (account-kind.ts 의 planType union 과 일치 — `"eps-topik"` 아님)
  - `unitFileMap = {"1": "u01_work_instruction"}`
- `UnitLanguage` 타입에 `"th"` 추가 (`app/unit/[unitId]/types.ts:3`)
- 마이페이지(`app/my/page.tsx`):
  - `UNIT_CATALOG` 의 u03 / u04 `implemented: true` 로 변경 (u04 제목은 `"쇼핑몰에서 옷 사기"` 로 통일 — 후술 정합성 이슈 참고)
  - `EPS_UNIT_CATALOG` 신설 (`eps_u01` "작업 지시 이해하기")
  - `epsUnitsForTabs` 계산 + `<ProgressTabs>` 에 `epsUnits`, `initialTab` props 전달
- `app/my/_progress-tabs.tsx`:
  - `Props.epsUnits?` / `Props.initialTab?` 추가
  - EPS 탭에서 `epsUnits` 우선 사용 (없으면 기존 `EPS_PLACEHOLDER` 폴백)
  - `prevUnitDone` 의 `topik1_u` 하드코딩 → `unit.id` 에서 prefix 자동 추출 (EPS 호환)
- 마이페이지 기본 탭 자동 선택: `initialTab={ctx.planType ?? undefined}` 로 사용자 planType 에 맞는 탭이 처음부터 활성
- `app/my/components/TodaySection.tsx` — EPS 사용자에 대해 "콘텐츠 준비 중" 분기에서 분리:
  - `EPS_UNITS = { 1: "작업 지시 이해하기" }` 도입
  - `eps_u01` 진도 기반으로 학습 시작 / 이어하기 / 다시 학습 카드 노출
  - `href="/unit/eps/1"`

### `scripts/convert_unit.py` 문항 품질 전면 고도화
1. **도메인 미스매치 방지** — 본 유닛 주제 / 핵심 어휘를 프롬프트에 명시 주입. `_PATTERN_DOMAIN_RULES` + `_domain_words_for_unit()` 헬퍼. 이전 라운드의 "지하철 유닛에 카페 예문" 같은 LLM 환각 0건으로 줄어듦
2. **문법 변별력 있는 오답** — 패턴별 표준 오답 가이드 (V-기 전에 / V-고 나서 / V-아도 / V-면 돼요 / V-세요)
3. **해설 한국어 전용** — `gen_mini_test` 의 `explanation` 에 외국어 단어/문자 절대 금지 명시. 자동 검증 도입
4. **정답 번호 분산** (코드 레벨 안전망) — `_diversify_consecutive_answers()` 헬퍼: LLM이 분산 규칙을 지키지 못한 경우 결정적으로 options swap. `gen_step2_blanks` 와 `gen_mini_test` 결과에 적용
5. **세션 ↔ 단어 퀴즈 의도 중복 금지** — `gen_words_quiz` 에 `session_step1`, `session_step2` 결과를 컨텍스트로 주입. "동일 단어 등장은 허용하되 같은 의도 중복 금지" 규칙
6. **EPS 산업 용어집 내장** — `EPS_GLOSSARY` 상수 (부품/보호구/조립하다/불량품/작업 지시서 등 8개의 vi/th/id 표준 매핑). `course="eps"` 일 때 번역 프롬프트에 자동 주입
7. **JSON 파싱 실패 자동 복구** — `gen_patterns_with_quiz` 에 `_gen_single_pattern_quiz()` 개별 재시도 (최대 2회). 이전 라운드의 batch 파싱 실패 → 폴백 placeholder 노출 케이스 해소
8. 메타 질문 형식(`"어떤 단어를 쓰나요?"`) 완전 금지 + 선택지 기본형 동사 금지 (어미 호응 가드)

### 검증 헬퍼
- `scripts/_inspect_unit_output.py` 신설 — 변환된 유닛 JSON 의 6개 항목 자동 점검:
  1. words_quiz 3개 (질문/선택지/정답/hint)
  2. patterns 전체 (도메인 매칭 + 폴백 placeholder 감지)
  3. mini_test[0] 전체
  4. explanation 한국어 전용 정규식 검증
  5. 정답 위치 분포 (연속 동일 + 60% 이상 집중 경고)
  6. 세션↔단어 phrase 5자 이상 일치 검출 (한글 3자 이상 조건)

## 2. 미완료 / 다음 세션

### 콘텐츠 의존
- **u101 편의점 Bunny GUID 대기** — 콘텐츠팀이 Bunny.net 에 영상 업로드 + GUID 발급 후 `data/content_team/topik1/u101_편의점에서_물건_사기.json` 의 `bunny_guids` 필드 채워야 vi 변환 가능
- **u104 카탈로그 정합성** — `app/my/page.tsx` 의 `UNIT_CATALOG` 에서 unit 4 = "쇼핑몰에서 옷 사기" 로 변경했는데, unit 9 도 같은 제목 → 둘 중 하나의 제목을 정리해야 함. (변환된 콘텐츠는 `u04_shopping` 이므로 unit 9 의 제목을 다른 주제로 교체하거나 카탈로그 슬롯을 재배치할 필요)

### 기능
- **이어하기 버튼 → 마지막 완료 섹션으로 이동** 현재는 유닛 시작점으로만 이동
- **마이페이지 유닛 잠금 시스템** — `_progress-tabs.tsx:262-270` 의 `prevUnitDone` 일반화는 했으나 UI 표시 규칙 (잠금 자물쇠 / Trial cue / 진도 잠금) 도 EPS 흐름 종합 검증 필요
- **#t1-19 만료 사용자 결제 메시지 수정** (별도 트래커 ID)

### 콘텐츠 재생성
- **TOPIK1 u02~u04 의 en / zh** — 현재는 고도화 이전 프롬프트로 생성된 상태. 새 프롬프트로 재변환 필요
  ```
  python scripts/convert_unit.py --input data/content_team/topik1/u102_지하철_타기.json --languages en,zh
  python scripts/convert_unit.py --input data/content_team/topik1/u103_카페에서_음료_주문하기.json --languages en,zh
  python scripts/convert_unit.py --input data/content_team/topik1/u104_쇼핑몰에서_옷_사기.json --languages en,zh
  ```
- **EPS u01 의 th / id** — 이번 세션 초반 변환분이 고도화 이전 프롬프트 기준
  ```
  python scripts/convert_unit.py --input data/content_team/eps_topik/u301_작업_지시_이해하기.json --languages th,id
  ```

### 환경 잡일 (관찰)
- dev 로그에 `GET /UNIT/eps/1 404` (대문자 UNIT) 다수 — 어딘가의 코드/링크가 대문자 URL을 만들고 있을 가능성. 추적 필요 (사용자 직접 입력일 수도 있어 우선순위 낮음)

## 3. 외국어 노출 규칙 (확정)

| 영역 | 외국어 노출 | 비고 |
| --- | --- | --- |
| 단어카드 설명 (`step4_words.translation`, `words[].translation`) | **허용** | 학습자 모국어로 의미 제공 |
| 세션 말하기 설명 (`step5_review[].translation`, `step3_sentences[].translation`) | **허용** | 한국어 표현의 의미 안내 |
| 패턴 의미 설명 (`patterns[].meaning`) | **허용** | 문법 패턴의 학습자 모국어 설명 |
| **문제 해설 (`mini_test[].explanation`)** | **금지 — 한국어 전용** | 외국어 단어/문자 절대 금지. `_inspect_unit_output.py` 정규식 검증 통과해야 함 |
| 힌트 (`words_quiz[].hint`, `step2_blanks[].hint`) | 허용 (학습자 모국어) | 한국어 정답 직역 금지 |
| 선택지 (`options`) | 한국어 전용 | 모든 generator 공통 |

## 4. 운영 메모

- 모든 `convert_unit.py` 호출 시 `python` 실행 가능. `.env.local` 에서 `ANTHROPIC_API_KEY` 자동 로드
- dev 재시작 절차 (CLAUDE.md 규칙): `TaskStop` → `rm -rf .next` → `npm run dev`. 최근 세션에서 panic 발생 시 이 절차로 해소 확인
- `_inspect_unit_output.py` 사용법: `python scripts/_inspect_unit_output.py data/topik1/u02_subway_vi.json`
