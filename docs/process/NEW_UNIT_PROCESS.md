# 새 유닛 추가 표준 프로세스

새 학습 유닛(주제)을 pluepe 플랫폼에 추가할 때 따르는 8단계 표준 프로세스. 모든 코스(TOPIK1 / TOPIK2 / EPS-TOPIK)에 공통으로 적용된다.

---

## 0. 사전 준비

진행 전 확보가 필요한 것들:

- 유닛 번호 결정 (코스별 1번부터 순차)
- Bunny.net Stream 에 영상 업로드 + GUID 발급
  · 학습자 언어별 STEP1 / STEP2 / STEP3 각각의 GUID 필요
  · Bunny Title 규칙: TOPIK1 = `u1NN_step{n}_{lang}`, EPS = `u3NN_step{n}_{lang}` (CLAUDE.md 참조)
- 콘텐츠팀의 한국어 원본 (대화·어휘·패턴)

---

## 1. 콘텐츠팀 JSON 작성

**경로**: `data/content_team/{course}/{unit_code}_{한국어이름}.json`

| 코스 | unit_code | 디렉토리 |
| --- | --- | --- |
| TOPIK1 | u1NN (예: u101) | `data/content_team/topik1/` |
| TOPIK2 | u2NN (예: u201) | `data/content_team/topik2/` |
| EPS-TOPIK | u3NN (예: u305) | `data/content_team/eps_topik/` |

**필수 필드**:

| 필드 | 비고 |
| --- | --- |
| `unit` | u1NN / u2NN / u3NN 형식 |
| `topic_titles` | `{ ko, vi, en, zh, th, id, ... }` |
| `level` | `TOPIK1` / `TOPIK2` / `EPS-TOPIK` |
| `dialogue` | `[{role, ko}]` |
| `key_expressions` | `[{ko, situation, vi/en/...}]` |
| `vocabulary` | `[{ko, vi/en/...}]` |
| `grammar_points` | `[{pattern, explanation, example_ko, vi/en/..., example_vi/...}]` |
| `languages` | 변환 대상 언어 코드 배열 (예: `["vi", "en", "zh"]`) |
| `bunny_guids` | `{ vi: {step1, step2, step3}, en: {...}, ... }` |

**팁**: 기존 `data/content_team/topik1/u101_*.json` 또는 `data/content_team/eps_topik/u301_*.json` 을 템플릿으로 복사한 뒤 값만 교체.

---

## 2. SLUG_MAP 등록

`scripts/convert_unit.py` 의 `SLUG_MAP` 에 unit_code → 영문 슬러그 매핑을 추가한다. 영문 슬러그는 출력 파일명 (`uNN_{slug}_{lang}.json`) 에 사용된다.

```python
SLUG_MAP = {
    ...
    "u305": "your_slug",  # 새로 추가
}
```

규칙:
- 영문 소문자 + 언더스코어
- 4~12자 권장
- 의미 식별 가능해야 함 (예: `cafe` / `subway` / `work_instruction`)

---

## 3. 변환 실행

```bash
python scripts/convert_unit.py --input <콘텐츠팀 JSON 경로> --languages <언어 콤마 구분>
```

언어 권장:
- TOPIK1 / TOPIK2: `vi,en,zh`
- EPS: `vi,th,id`

산출물 경로:
| 코스 | 디렉토리 |
| --- | --- |
| TOPIK1 | `data/topik1/uNN_{slug}_{lang}.json` |
| TOPIK2 | `data/topik2/uNN_{slug}_{lang}.json` |
| EPS | `data/eps_topik/uNN_{slug}_{lang}.json` |

---

## 4. 자동 검수 통과 확인

각 언어 변환 직후 `audit_and_repair` 사이클(검수 8개 규칙 + 최대 2회 재검수 + 항목별 재생성)이 자동 실행된다.

기대 출력:
```
🔍 검수 시작 (총 N문항)
🔍 검수 결과: 오류 0건 ✓     ← 1차 통과
✅ 검수 완료: 통과 N / 재생성 R / 실패 0
```

**통과 기준**: 실패 = 0 (있으면 WARNING 로그가 남고 사람 검토 필요).

추가 점검:
```bash
# 단일 파일 — 정답 분포 / 단위명·반의어 / phrase 중복 / 폴백 placeholder
python scripts/_inspect_unit_output.py <output json>

# 여러 파일 일괄 — 폴백 placeholder 만 빠르게 체크
python scripts/_check_fallbacks.py <files...>
```

---

## 5. 라우터 `unitFileMap` 등록

| 코스 | 라우터 파일 | 등록 위치 |
| --- | --- | --- |
| TOPIK1 | `app/unit/[unitId]/page.tsx` | `unitFileMap` |
| TOPIK2 | `app/unit/topik2/[unitId]/page.tsx` (라우트가 없으면 신설 필요 — 아래 TOPIK2 가이드 참조) | `unitFileMap` |
| EPS-TOPIK | `app/unit/eps/[unitId]/page.tsx` | `unitFileMap` |

예시 (TOPIK1):
```ts
const unitFileMap: Record<string, { file: string; unitNumber: number }> = {
  ...
  "5": { file: "u05_your_slug", unitNumber: 5 },
};
```

`SUPPORTED_LANGS` 와 라우트의 `THIS_ROUTE_COURSE` 도 신규 유닛이 사용하는 코스/언어와 일치하는지 점검.

---

## 6. 마이페이지 카탈로그 갱신

### `app/my/page.tsx`

| 코스 | 카탈로그 상수 | 작업 |
| --- | --- | --- |
| TOPIK1 | `UNIT_CATALOG` | 해당 unit 항목의 `implemented: false → true` 로 변경 (또는 새 항목 추가) |
| EPS | `EPS_UNIT_CATALOG` | 새 항목 push |
| TOPIK2 | `TOPIK2_UNIT_CATALOG` (현재 미존재 — TOPIK2 첫 추가 시 신설) | — |

각 항목 형식:
```ts
{ unitId: "topik1_u05", slug: "5", number: 5, title: "...", implemented: true, theme: "..." }
```

### `app/my/components/TodaySection.tsx`

| 코스 | 매핑 상수 | 작업 |
| --- | --- | --- |
| TOPIK1 | `TOPIK1_UNITS` (number → 제목) | 신규 유닛 번호의 제목 추가 |
| EPS | `EPS_UNITS` | 신규 유닛 추가 |
| TOPIK2 | (현재 분기 없음 — TOPIK2 첫 추가 시 신설) | — |

또한 `TOPIK1_AVAILABLE_MAX` (현재 12) 는 TOPIK1 13~15 가 영구 잠금이라 그대로. 신규 가용 범위가 늘어나면 갱신.

---

## 7. 검증

1. **유닛 페이지 흐름** — 로그인된 브라우저로 `/unit/{n}` 또는 `/unit/eps/{n}` 진입
   - 5섹션 (오늘의 학습 / 단어 학습 / 문장 연습 / 실력 테스트 / AI 확장) 흐름 정상 작동
   - 영상 STEP1~3 재생 확인 (Bunny embed)
   - 퀴즈 정답 분포 / 단위명 / 반의어 자연스러움 사람 눈으로 1차 점검
2. **마이페이지** — `/my` 진입 시 신규 유닛 카드가 노출되고 "시작하기" 클릭 시 정상 라우팅 (TOPIK1 → `/unit/{n}`, EPS → `/unit/eps/{n}`)
3. **진도 저장** — 한 섹션 완료 후 `/my` 새로고침 → 학습 진도 / 연습 횟수 갱신 확인
4. **모바일 반응형** — 720px 이하에서 사이드바 → 상단 섹션바로 자동 전환

---

## 8. Git 커밋 + 푸시

권장 메시지 스타일 (기존 commit log 참조):
```
feat(content): {course} u{NN} {주제} 추가 — {언어 리스트}
```

```bash
# 변경 파일 단위로 staging (sensitive 파일 회피)
git add data/content_team/{course}/<새 입력 JSON>
git add data/{course}/                     # 변환 산출물 (또는 명시적으로 8개 파일)
git add scripts/convert_unit.py            # SLUG_MAP 변경 시
git add app/unit/.../page.tsx              # unitFileMap 변경
git add app/my/page.tsx                    # 카탈로그 변경
git add app/my/components/TodaySection.tsx # 제목 매핑 변경

git commit -m "feat(content): topik1 u05 길 묻기 추가 — vi/en/zh"
git push origin main
```

---

# TOPIK2 향후 추가 가이드 — 라우트 신설부터

TOPIK2 는 현재 라우트 디렉토리 자체가 없다. 첫 TOPIK2 유닛 변환 전에 라우트를 먼저 만들어야 한다.

## A. 라우트 신설

`app/unit/topik2/[unitId]/page.tsx` 를 신설 — **`app/unit/eps/[unitId]/page.tsx` 를 베이스로 복사** 후 5가지 분기만 변경:

| 분기점 | TOPIK2 값 |
| --- | --- |
| `loadUnitJson` 의 import 경로 | `@/data/topik2/${baseFile}_${lang}.json` |
| `SUPPORTED_LANGS` | `["vi", "en", "zh"]` (TOPIK1 과 동일) |
| `prevUnitTableId` prefix | `topik2_u${...}` |
| `THIS_ROUTE_COURSE` | `"topik2"` |
| `unitFileMap` | TOPIK2 유닛만 |

`account-kind.ts` 의 `planType` union 에는 이미 `"topik2"` 가 포함돼 있어 추가 작업 불필요.

## B. TOPIK2 카탈로그 (마이페이지)

`app/my/page.tsx` 에 `TOPIK2_UNIT_CATALOG` 신설:
```ts
const TOPIK2_UNIT_CATALOG: UnitCatalogEntry[] = [
  { unitId: "topik2_u01", slug: "1", number: 1, title: "...", implemented: true, theme: "..." },
  ...
];
```

`unitsForTabs` 옆에 `topik2UnitsForTabs` 도 계산하고, `<ProgressTabs topik2Units={...}>` prop 으로 전달.

`activeCatalog` 분기에도 TOPIK2 추가:
```ts
const activeCatalog =
  ctx.planType === "eps" ? EPS_UNIT_CATALOG :
  ctx.planType === "topik2" ? TOPIK2_UNIT_CATALOG :
  UNIT_CATALOG;
```

## C. ProgressTabs

`app/my/_progress-tabs.tsx`:
- `Props.topik2Units?: Unit[]` 추가 (`epsUnits` 와 동일 패턴)
- `activeTab === 'topik2'` 분기에서 `topik2Units` 우선 사용 — 없으면 기존 `TOPIK2_PLACEHOLDER` 폴백

## D. TodaySection — TOPIK2 별도 분기

현재 `app/my/components/TodaySection.tsx` 는 `planType === "topik2"` 를 "콘텐츠 준비 중" disabled 카드로 처리. EPS 가 분리된 패턴을 따라 `topik2` 도 별도 분기 추가:
- `TOPIK2_UNITS` 상수 (번호 → 제목)
- `topik2_uXX` 진도 기반 카드 ("학습 시작" / "이어하기" / "다시 학습")
- href = `/unit/topik2/${num}`

## E. 콘텐츠 변환

`scripts/convert_unit.py` 의 `parse_unit_code` / `output_dir_for_course` 는 이미 `topik2` 처리됨 — 별도 수정 없이 다음 명령으로 변환 가능:
```bash
python scripts/convert_unit.py --input data/content_team/topik2/u201_<주제>.json --languages vi,en,zh
```

산출물: `data/topik2/u01_<slug>_<lang>.json`

---

# 어드민 / 검증 스크립트

| 스크립트 | 용도 |
| --- | --- |
| `scripts/convert_unit.py` | 메인 변환 파이프라인 (콘텐츠팀 JSON → 플랫폼 JSON × 언어). 검수+재생성 사이클 내장 |
| `scripts/_inspect_unit_output.py` | 단일 유닛 산출물 검증 (정답 분포 / phrase 중복 / 폴백 placeholder) |
| `scripts/_check_fallbacks.py` | 여러 파일 일괄 폴백 placeholder 검사 |
| `scripts/_purge_user_progress.py` | 특정 학습자 user_progress 정리 (서비스 롤 키 사용 — 운영 데이터 변경 주의) |
