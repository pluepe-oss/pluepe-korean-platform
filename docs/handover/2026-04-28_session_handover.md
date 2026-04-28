# pluepe 한국어 플랫폼 — 세션 인수인계 (2026.04.28)

## 오늘 완료된 작업

### 문항 품질 고도화
- 자동 검수 규칙 6/7/8 추가 (`scripts/convert_unit.py:_AUDIT_RULES`):
  ⑥ 문장 자연스러움 (어미 호응 + 도메인 혼입)
  ⑦ 정답 유일성 (다수 정답 가능 시 재생성)
  ⑧ 문맥 억지 (앞 절과 답 논리 불일치)
- 전체 유닛 재변환 완료 (153문항 검수 통과, 실패 0건)
- 총 누적 자동 재생성: **44건** (사람 검수 없이 자동 수정)
  · u104 라운드: 10건 (규칙 6/7/8 도입 직후 트리거)
  · u101/u102/u103/u301 라운드: 14건
  · 직전 누적: 30건

### 플랫폼 기능
- EPS 라우트 `/unit/eps/[unitId]` 신설 (`app/unit/eps/[unitId]/page.tsx`)
- 마이페이지 EPS 탭 자동 선택 (`<ProgressTabs initialTab={ctx.planType ?? undefined}>`)
- EPS 학습 진도 + 복습 링크 분기
  · `activeCatalog = ctx.planType === "eps" ? EPS_UNIT_CATALOG : UNIT_CATALOG`
  · `reviewHref` — EPS 면 `/unit/eps/${slug}` 로 라우팅
- AI 확장 복습 기능 (사용 내역 localStorage 저장)
  · `RESPONSE_KEY` 상수 + mount 시 `states[i] = { status: "ok", text }` 복원
- AI 확장 마이그레이션 가드 추가
  · `used=true` & `response=null` 인 슬롯 → 자동으로 USED 클리어 (스테일 USED 잔존 키 처리)
- 사이드바 + 배너 텍스트 수정 (`SECTION_LABEL` / `SECTION_SUB` / `STEP_META`):
  세션 → 오늘의 학습 / 단어 → 단어 학습 / 표현 → 문장 연습
  테스트 → 실력 테스트 / STEP1 보기 → 영상
- EPS 사이드바 코스명 "EPS-TOPIK" 표시 (`UnitClient.tsx:307` `unit.exam_type` 분기)
- 연습 횟수 "이번 달" 월간 표시 — `(unit_id, activity_date)` 고유 조합 카운트, KST 기준 매월 1일 자동 리셋

### 운영 / 데이터
- `test_t1_basic@pluepe.com` user_progress 정리 — `topik1_u02/u03/u04` 15행 삭제, `topik1_u01` 5섹션만 유지
- 어드민 스크립트 `scripts/_purge_user_progress.py` 추가 (서비스 롤 키 사용, 운영 데이터 변경 주의)

### 프로세스 문서
- **`docs/process/NEW_UNIT_PROCESS.md` 신설** — 새 유닛 추가 8단계 표준 프로세스 + TOPIK2 향후 추가 가이드 (라우트 신설부터)
- 현재 어드민/검증 스크립트 4종 정리 (`convert_unit` / `_inspect_unit_output` / `_check_fallbacks` / `_purge_user_progress`)

### 런칭 일정 확정
- 런칭일: **2026-05-30**
- TOPIK1: 10개 / TOPIK2: 10개 / EPS: 10개 오픈
- 콘텐츠 납품: 2026-05-10
- 무료체험관: `/free-trial`, 마이페이지 없음, 코스별 유닛 1개
- B2B: 온라인 신청 폼 + 이메일 안내

---

## 미완료 / 다음 세션 작업 (우선순위 순)

### 1순위 — 런칭 필수
- [ ] 랜딩 메인 페이지 `/`
- [ ] GNB 공개 헤더
- [ ] `/pricing` 5단계 퍼널 + Stripe 연결
- [ ] 무료체험관 `/free-trial`
- [ ] 회원가입 → 결제 → 학습 전체 흐름 검증

### 2순위 — 런칭 품질
- [ ] 외국어 노출 규칙 UI 반영 (단어카드 + 말하기만 허용 / 해설은 한국어만)
- [ ] 유닛 잠금/해제 시스템
- [ ] 이어하기 버튼 → 마지막 완료 섹션으로
- [ ] u104 카탈로그 정합성 (4번 식당 → 쇼핑몰 — `app/my/page.tsx` `UNIT_CATALOG[8]` 의 unit 9 제목 중복도 정리)
- [ ] #t1-19 만료 사용자 결제 메시지

### 3순위 — 배포 준비
- [ ] pluepe.com 도메인 연결
- [ ] GitHub Private 전환 (현재 pluepe-oss/pluepe-korean-platform Public)
- [ ] Netlify 보안 스캐너 재활성화 (`SECRETS_SCAN_ENABLED=true`)
- [ ] B2B 신청 폼 페이지

### 4순위 — 콘텐츠 (5/10 납품 후)
- [ ] TOPIK1 6개 추가 변환 (현재 4개 implemented → 10개로)
- [ ] TOPIK2 10개 신규 변환 + 라우트 (`docs/process/NEW_UNIT_PROCESS.md` 의 TOPIK2 가이드 참조)
- [ ] EPS 9개 추가 변환 (현재 1개 → 10개로)

---

## 확정 정책 (메모리 저장됨)

memory/ 에 project memory 로 보존:
- `stats_reset_policy.md` — 학습 진도 누적 / streak 일일 리셋 / 연습 횟수 월간 리셋
- `launch_2026_05_30.md` — 런칭 일정 + 코스별 오픈 유닛 수 + 무료체험관/B2B 동선

요약:
- **학습 진도**: 완료 주제 수 누적, 리셋 없음
- **연속학습**: 하루 1섹션+ 완료 시 +1, 안 하면 0 리셋, 최대 365일
- **연습 횟수**: 하루 유닛당 1회, 매월 1일 (KST) 리셋, "이번 달" 표시

---

## 테스트 계정 (비밀번호 `Test1234!`)

```
test_t1_basic       test_t1_premium
test_t2_basic       test_t2_premium
test_eps_basic      test_eps_premium
test_b2b            test_trial
test_expired        test_freetrial
```

각 계정의 planType / planTier / kind 매핑은 `lib/account-kind.ts` 의 `getAccountContext` 분기 참조.

---

## 검증된 변경 파일 (이번 세션 — push 대상)

```
M  scripts/convert_unit.py                         # 검수 규칙 6/7/8 추가
A  scripts/_purge_user_progress.py                 # 어드민 스크립트
A  docs/process/NEW_UNIT_PROCESS.md                # 표준 프로세스 문서
A  docs/handover/2026-04-28_session_handover.md    # 본 인수인계
M  data/topik1/u01_convenience_{vi,en,zh}.json     # 재변환
M  data/topik1/u02_subway_{vi,en,zh}.json          # 재변환
M  data/topik1/u03_cafe_{vi,en,zh}.json            # 재변환
M  data/topik1/u04_shopping_{vi,en,zh}.json        # u104 라운드 산출물
M  data/eps_topik/u01_work_instruction_{vi,th,id}.json  # 재변환
```
