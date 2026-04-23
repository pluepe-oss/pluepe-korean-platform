# pluepe 디자인 시스템 — 전체 기준 문서
> 작성일: 2026.04.23 | 유닛 플레이어 확정 요소 기반 전체 사이트 기준
> 모든 신규 페이지는 이 문서를 먼저 읽고 작업한다

---

## 1. 캔버스 & 레이아웃 기준

### 기준 해상도 (확정)
```
데스크톱 기준: 1440×900
컨테이너 max-width: 1280px (좌우 padding 80px)
모바일 기준: 390px (iPhone 기준)
브레이크포인트: 768px (md — 모바일/데스크톱 전환)
```

### 페이지 템플릿 4종
```
A형 — 공개형 (랜딩, 프라이싱, 온보딩)
      상단 GNB + 중앙 집중 콘텐츠
      max-width: 640px (좁은 폼) ~ 1280px (랜딩)

B형 — 유닛 플레이어 (확정 — 절대 수정 금지)
      사이드바 200px + 콘텐츠 1fr
      모바일: 사이드바 숨김 + 상단 섹션 바 대체

C형 — 대시보드 (마이페이지, 어드민)
      단일 컬럼, max-width: 800px, 좌우 auto margin
      모바일 우선 설계

D형 — 온보딩 / 인증 (좁은 집중형)
      max-width: 480px, 수직 중앙 정렬
      단계별 스텝 UI
```

---

## 2. 컬러 시스템 (확정)

### 브랜드 컬러
```css
--navy   : #122c4f;   /* 브랜드 메인, CTA 버튼, 헤더, 사이드바 */
--mint   : #27d3c3;   /* 포인트, 진행바, 완료 표시, 정답 */
--orange : #ff7d5a;   /* 강조 CTA, 경고, 중요 알림 */
```

### 시스템 컬러
```css
--bg     : #edf2f7;   /* 전체 페이지 배경 */
--card   : #ffffff;   /* 카드, 패널 배경 */
--text   : #0f172a;   /* 본문 텍스트 */
--sub    : #64748b;   /* 보조 텍스트, 레이블 */
--ok     : #22c55e;   /* 정답, 성공, 완료 */
--err    : #ef4444;   /* 오답, 에러, 위험 */
--border : #e2e8f0;   /* 기본 보더 */
--disabled-bg   : #e2e8f0;   /* 비활성 버튼 배경 */
--disabled-text : #94a3b8;   /* 비활성 버튼 텍스트 */
```

### 컬러 사용 원칙
```
navy   → 주요 액션 버튼, 헤더, 사이드바 배경, 브랜드 강조
mint   → 진행 상태, 완료 체크, hover 포인트
orange → 가장 중요한 CTA 1개 (Today 섹션, 무료체험 버튼)
ok     → 정답 피드백, 완료 배지, streak 표시
err    → 오답 피드백, 에러 메시지
sub    → 부가 설명, 힌트, 잠금 안내 텍스트
```

---

## 3. 타이포그래피 (확정)

### 폰트
```css
font-family: Arial, "Noto Sans KR", sans-serif;
```

### 폰트 사이즈 체계
```css
/* 제목 */
h1  : 28px, font-weight: 700   /* 페이지 메인 제목 */
h2  : 22px, font-weight: 600   /* 섹션 제목 */
h3  : 18px, font-weight: 600   /* 카드 제목 */
h4  : 16px, font-weight: 600   /* 소제목 */

/* 본문 */
body     : 15px, font-weight: 400, line-height: 1.6
body-sm  : 14px, font-weight: 400
caption  : 13px, font-weight: 400, color: --sub
tiny     : 12px, font-weight: 400, color: --sub

/* UI 요소 */
button   : 15px, font-weight: 600
label    : 13px, font-weight: 500
badge    : 12px, font-weight: 600
```

---

## 4. 컴포넌트 기준 (확정)

### 4-1. 보더 & 쉐도우
```css
border-radius-card   : 22px   /* 메인 콘텐츠 카드 */
border-radius-button : 12px   /* 버튼 */
border-radius-badge  : 8px    /* 배지, 태그 */
border-radius-input  : 10px   /* 인풋 */

shadow-card : 0 12px 30px rgba(15, 23, 42, 0.08)
shadow-none : none (사이드바, 헤더 등)
```

### 4-2. 버튼
```css
/* Primary — navy 배경 */
.btn-primary {
  background: #122c4f;
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:hover { background: #1a3d6e; }

/* CTA — orange (가장 중요한 행동 1개만) */
.btn-cta {
  background: #ff7d5a;
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
}
.btn-cta:hover { background: #e86945; }

/* Secondary — 테두리형 */
.btn-secondary {
  background: white;
  border: 1.5px solid #122c4f;
  color: #122c4f;
  border-radius: 12px;
  padding: 10px 20px;
}

/* Disabled */
.btn-disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.85;
}

/* 원칙: 한 화면에 orange CTA 1개만. 나머지는 navy 또는 secondary */
```

### 4-3. 카드
```css
.card {
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  padding: 24px;
}

/* 잠금 카드 (무료체험자) */
.card-locked {
  position: relative;
  filter: none;             /* 카드 자체는 흐리게 하지 않음 */
}
.card-locked-content {
  filter: blur(2px);        /* 내부 콘텐츠만 blur */
  pointer-events: none;
}
.card-locked-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
/* 잠금 표시: 🔒 아이콘 + 설명 1~2줄 + CTA 버튼 */
```

### 4-4. 진행바
```css
.progress-bar-track {
  background: #e2e8f0;
  border-radius: 99px;
  height: 8px;
}
.progress-bar-fill {
  background: #27d3c3;   /* mint */
  border-radius: 99px;
  height: 8px;
  transition: width 0.3s ease;
}
/* 완료 시: background: #22c55e (ok) */
```

### 4-5. 퀴즈 / 선택지 (확정 — 수정 금지)
```
동작 방식:
  선택지 클릭 → 선택 상태 표시
  [확인] 버튼 클릭 → 정답/오답 피드백
  정답 확인 후에만 다음 버튼 활성화

정답 피드백: 초록(#22c55e) 배경 + ✓ 아이콘
오답 피드백: 빨강(#ef4444) 배경 + ✗ 아이콘
해설 텍스트: 정답/오답 모두 회색 박스로 표시
```

### 4-6. 배지 / 상태 표시
```css
/* 완료 */
.badge-done {
  background: #dcfce7;
  color: #16a34a;
  border-radius: 8px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}

/* 진행 중 */
.badge-active {
  background: #dbeafe;
  color: #1d4ed8;
}

/* 잠금 */
.badge-locked {
  background: #f1f5f9;
  color: #94a3b8;
}

/* 무료체험 */
.badge-trial {
  background: #fff7ed;
  color: #c2410c;
}
```

---

## 5. 유닛 플레이어 레이아웃 (B형 — 확정, 수정 금지)

```
데스크톱 (≥768px):
┌─────────────────────────────────────┐
│  상단 헤더 (유닛명 + 섹션 미니카드)  │
├────────┬────────────────────────────┤
│ 사이드바│  메인 콘텐츠               │
│ 200px  │  1fr                       │
│        │                            │
│ 섹션탭 │  섹션별 학습 콘텐츠         │
│ (5개)  │                            │
│        │                            │
└────────┴────────────────────────────┘

모바일 (<768px):
┌─────────────────────────────────────┐
│  상단 섹션 바 (← 섹션명 →)          │
├─────────────────────────────────────┤
│  메인 콘텐츠 (풀 너비)               │
└─────────────────────────────────────┘
```

### 유닛 플레이어 확정 동작 (절대 수정 금지)
```
- 다음 버튼 클릭 시 상단 스크롤
- 퀴즈: 선택 → [확인] → 정답/오답 표시
- 정답 확인 후에만 다음 버튼 활성화
- 세션 완료 전 단어/패턴/테스트/AI 탭 잠금
- 완료 배너: 5섹션 모두 완료 시만 표시
- 테스트 해설 텍스트 표시 (정답/오답 둘 다)
- 유닛 완료 버튼 → /my 이동
- 다음 유닛 버튼 → /unit/{n+1} 이동
- 제목 옆 현재 섹션 미니 카드 (고정 너비 160px)
- STEP 탭: 숫자 원문자 + ✓ 표시
- 모바일 섹션 바: 이전/다음 화살표
- Bunny iframe: autoplay=false&preload=false&t=0
- AI 확장 버튼: 유닛별 1회 사용 제한 (localStorage)
```

---

## 6. 네비게이션 구조

### GNB (A형 — 공개 페이지)
```
┌─────────────────────────────────────────┐
│ pluepe 로고   [플랜 보기]  [로그인]      │
│              [7일 무료로 시작하기 →] CTA │
└─────────────────────────────────────────┘
높이: 64px / 배경: white / 하단 보더 1px
```

### 학습자 GNB (C형 — 로그인 후)
```
┌─────────────────────────────────────────┐
│ pluepe 로고   강의  시험  단어  [마이페이지]│
└─────────────────────────────────────────┘
모바일: 하단 탭바 (4탭) 대체
```

### 사이드바 (B형 — 유닛 플레이어)
```
너비: 200px (데스크톱) / 숨김 (모바일)
배경: #122c4f (navy)
텍스트: white
섹션 탭 5개: 세션 / 단어 / 패턴 / 테스트 / AI
잠금 탭: opacity 0.4 + cursor: not-allowed
```

---

## 7. 마이페이지 기준 (C형)

```
레이아웃: 단일 컬럼, max-width: 800px
배경: #edf2f7 (--bg)
섹션 간격: 24px gap
카드 패딩: 24px

섹션 우선순위:
1. Today      → orange CTA, 가장 크게
2. Progress   → 유닛 카드 목록
3. Weakness   → 약점 분석
4. Exam       → 시험 현황
5. Account    → 계정 정보

잠금 처리 (무료체험자):
- 유료와 동일 디자인
- 내부 콘텐츠 blur 처리
- 🔒 아이콘 + 설명 1~2줄 + "구독하고 [기능명] →" CTA
```

---

## 8. 온보딩 / 인증 기준 (D형)

```
레이아웃: 중앙 집중, max-width: 480px
배경: #edf2f7
카드: white, border-radius: 22px, shadow

스텝 표시: 상단 "Step N / 전체" 텍스트
진행 표시: 상단 얇은 진행바 (mint)

버튼:
- 주요 행동: navy full-width 버튼
- 경고 동작 후 확인: orange 버튼
- 취소: secondary 버튼

알럿 모달:
- 반투명 배경 overlay
- 중앙 카드 (max-width: 320px)
- 취소 / 확인 2버튼
```

---

## 9. 공통 UX 원칙

```
한 화면에 한 가지 행동        → 선택지 나열 금지, 다음 행동 자동 제시
orange CTA는 화면당 1개만     → 가장 중요한 행동 1개에만 사용
잠금 기능 설명 필수            → 🔒 + 설명 + CTA (빈 블록 금지)
빈 상태 UI 필수               → 데이터 없을 때 안내 문구 + 시작 버튼
에러 처리 필수                → 토스트 또는 인라인 에러 메시지
로딩 상태 처리 필수            → 스피너 또는 스켈레톤
```

---

## 10. 반응형 원칙

```
B형 유닛 플레이어:
  ≥768px → 사이드바 200px + 콘텐츠 1fr
  <768px → 사이드바 숨김 + 상단 섹션 바 (← 이전 / 섹션명 / 다음 →)

C형 마이페이지:
  ≥768px → max-width: 800px 중앙 정렬
  <768px → 풀 너비, padding 16px

D형 온보딩:
  ≥768px → max-width: 480px 중앙 정렬
  <768px → 풀 너비, padding 16px

공통:
  터치 타겟 최소 44px (모바일 버튼)
  폰트 최소 14px (모바일 가독성)
```

---

## 11. 파일 참조 위치

```
CSS 변수 정의    : app/unit/[unitId]/unit.module.css
유닛 컴포넌트    : app/unit/[unitId]/components/
타입 정의        : app/unit/[unitId]/types.ts
공통 UI 컴포넌트 : components/ui/
```

---

## 12. 신규 페이지 체크리스트

```
[ ] 페이지 템플릿 유형 확인 (A/B/C/D형)
[ ] 캔버스 기준 적용 (1440×900, max-width)
[ ] 컬러 시스템 준수 (navy/mint/orange만 사용)
[ ] orange CTA 1개 이하 확인
[ ] 모바일 반응형 처리
[ ] 빈 상태 UI 처리
[ ] 에러/로딩 상태 처리
[ ] 잠금 기능 설명 + CTA 처리
```

---

*이 문서는 2026.04.23 기준 전체 사이트 디자인 기준입니다.*
*유닛 플레이어 확정 요소(Section 5)는 절대 수정 금지.*
