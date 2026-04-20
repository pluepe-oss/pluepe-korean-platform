# pluepe 한국어 학습 플랫폼 — 세션 인수인계 문서
# 최종 업데이트: 2026.04.19

---

## ⚠️ 신규 세션 시작 시 이 파일을 먼저 업로드하세요

---

## 1. 프로젝트 기본 정보

- **프로젝트명**: pluepe 한국어 학습 플랫폼
- **GitHub**: 푸시 완료 상태 (2026.04.19 기준)
- **PRD 버전**: v3.0 (PRD_v3.md 참고)
- **기술 스택**: Next.js 16 + React 19 + Supabase + Tailwind CSS v4 + Cloudflare Stream + Stripe + Claude API

---

## 2. ✅ 개발 완료 현황 (2026.04.19 기준)

| 항목 | 상태 | 비고 |
|------|------|------|
| Next.js 16 + Supabase + Tailwind 세팅 | ✅ 완료 | |
| Supabase 스키마 10개 테이블 + RLS | ✅ 완료 | |
| migrations 001~011 | ✅ 전부 실행 완료 | |
| 인증 (이메일 / Google / 카카오) | ✅ 완료 | |
| Cloudflare Stream DRM (Signed URL) | ✅ 완료 | |
| Stripe 구독 결제 + 7일 무료체험 | ✅ 완료 | |
| 마이페이지 | ✅ 완료 | |
| 시험보기 (IBT) | ✅ 완료 | |
| Admin 대시보드 | ✅ 완료 | |
| Student 초대 플로우 | ✅ 완료 | |
| GitHub 푸시 | ✅ 완료 | |

---

## 3. 🔜 다음 작업 (내일 ~ Phase 1 시작)

### 즉시 할 것
1. **Video ID 9개 확보 후 DB 등록** (Cloudflare Stream)
   - TOPIK 1 × 3강, TOPIK 2 × 3강, EPS-TOPIK × 3강 (오픈 시 각 4강 목표)
2. **courses 테이블 컬럼 추가** (migration 012 작성)
   ```sql
   ALTER TABLE courses ADD COLUMN language text;       -- vi/en/zh/id
   ALTER TABLE courses ADD COLUMN order_index int;     -- 강의 순서
   ALTER TABLE courses ADD COLUMN topic text;          -- 편의점/지하철/카페...
   ALTER TABLE courses ADD COLUMN exam_type text;      -- topik1/topik2/eps-topik
   ```
3. **PRD v3.0 코드 반영 시작**

---

## 4. PRD v3.0 핵심 정책 요약

### 상품 구성 (언어별)
| 상품 | 자막 언어 | 대상 |
|------|---------|------|
| 한국어-베트남어 | vi | 베트남 |
| 한국어-영어 | en | 글로벌 |
| 한국어-중국어 | zh | 중국 |
| 한국어-인도네시아어 | id | 인도네시아 |

> ⚠️ 언어 = 상품 단위. 한 언어 구독 시 타 언어 콘텐츠 접근 불가.

### 가격 정책
| 플랜 | 가격 |
|------|------|
| B2C 월간 | $9.99/월 |
| B2C 연간 | $89/년 |
| B2B 10석 | $300/년 |
| B2B 20석 | $500/년 |
| B2B 30석+ | $700/년 |

### 모의고사 오픈 정책
- B2C 월간: 가입 월수만큼 순차 오픈 (1개월→1개 ... 12개월→12개)
- B2C 연간: 즉시 6개 + 6개월 후 나머지 6개
- B2B: 계약 즉시 12개 전체

### AI 챗봇 사용 제한
- B2C: 하루 20회 (자정 초기화)
- B2B: ID당 월 20회 (매월 1일 초기화)
- 데모: 하루 5회
- 핵심단어(core): AI 질문 불가 / 응용단어(extended): 가능

### 계정 유형
| 유형 | 역할 |
|------|------|
| master | pluepe 운영팀 전체 관리 |
| admin | 학원 원장/강사 |
| student | 일반 학습자 |
| demo | 영업 데모 (시험별 3강 + 샘플 5문항) |

---

## 5. Phase 별 개발 우선순위

### Phase 1 — DB 구조 개편 (다음 작업)
- [ ] courses language/order_index/topic/exam_type 컬럼 추가 (migration 012)
- [ ] platform_settings 테이블 생성
- [ ] subscriptions 언어별 상품 구조 변경 (product_id, plan_type, is_license)
- [ ] exams open_month 컬럼 추가
- [ ] academies 라이선스 컬럼 추가 (language, license_seats, license_start/end, license_amount)
- [ ] user_chat_usage 테이블 생성
- [ ] 접근 제어 로직 전면 재설계 (언어별 상품 단위)
- [ ] 동시 재생 좌석 수 제한

### Phase 2 — 콘텐츠 기능
- [ ] 단어외우기 (topic별 + AI 질문)
- [ ] AI 챗봇 (사용량 카운트 연동)
- [ ] 모의고사 순차 오픈 로직
- [ ] 무료체험 별도 메뉴 (/free-trial)
- [ ] 영업 데모 계정 발급

### Phase 3 — 운영 도구
- [ ] Master 콘솔 platform_settings 관리
- [ ] 강의 업로드 UI
- [ ] B2B 만료 30일 전 재계약 알림
- [ ] TOPIK 시험 D-day 알림

### Phase 4 — 성장
- [ ] 스트릭 기능
- [ ] 레벨업 배너
- [ ] PWA 오프라인 단어장
- [ ] 신규 강의 추가 알림 푸시

---

## 6. DB 신규 테이블 스펙 (platform_settings / user_chat_usage)

```sql
-- platform_settings
CREATE TABLE platform_settings (
  key   text PRIMARY KEY,
  value text
);
INSERT INTO platform_settings VALUES
  ('free_preview_count',       '1'),
  ('trial_exam_count',         '5'),
  ('yearly_instant_open',      '6'),
  ('b2c_chat_daily_limit',     '20'),
  ('b2b_chat_monthly_limit',   '20'),
  ('demo_chat_daily_limit',    '5');

-- user_chat_usage
CREATE TABLE user_chat_usage (
  user_id     uuid REFERENCES auth.users,
  academy_id  uuid REFERENCES academies,
  year_month  text,        -- 예: '202604'
  total_count int DEFAULT 0,
  limit_count int,
  UNIQUE (user_id, year_month)
);
```

---

## 7. 손익분기점 참고

```
월 고정비: 약 $175 (Vercel + Supabase + Cloudflare + Resend + Claude API)
BEP: B2C 18명 OR B2B 학원 1곳
베타 목표: 인도네시아 학원 1~2곳 + 학생 50명 (3개월 후)
```

---

## 8. 신규 세션 시작 스크립트

새 세션 열면 Claude에게 아래 문장으로 시작하세요:

```
이 파일(SESSION_HANDOFF_20260419.md)과 PRD_v3.md를 읽고
pluepe 프로젝트 현황 파악 후 [오늘 할 작업] 부터 시작해줘.
```

---
*이 문서는 세션 종료 시마다 업데이트 필요*
