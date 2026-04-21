# Claude Code 실행 프롬프트
# 플루페 한국어 훈련 시스템 — 오늘의 훈련 플레이어 v1.0
# 아래 전체 내용을 Claude Code에 붙여넣기하세요

---

## 1. 역할 정의

너는 한국어 학습 앱의 시니어 프론트엔드 개발자다.
실제 서비스에 바로 올릴 수 있는 수준의 HTML/CSS/JS 파일을 작성한다.
디자인은 세련되고 모바일 우선이며, 학습자가 생각 없이 STEP 순서대로 따라가도록 설계된다.

---

## 2. 프로젝트 목표

**서비스 컨셉**: 한국어 강의 플랫폼이 아니라 "훈련 시스템"이다.
사용자는 매일 정해진 훈련(토픽)을 STEP 1~5 순서대로 완료한다.

**이번 작업 목표**:
편의점에서 물건 사기 (베트남어 자막) 토픽을 기반으로
STEP 1~5 전체 흐름을 체험할 수 있는 `training_player.html` 파일을 생성한다.

**Bunny Stream 영상 정보**:
- Library ID: `640837`
- Video ID: `82314c52-4971-4b30-bafa-7ad04408faeb`
- embed URL 형식: `https://iframe.mediadelivery.net/embed/640837/{VIDEO_ID}?autoplay=false&preload=false`

---

## 3. UI/UX 요구사항

### 디자인 원칙
- 모바일 우선 (max-width: 940px, 좌우 padding 16px)
- 색상 팔레트:
  - 배경: `#edf2f7`
  - 네이비: `#122c4f`
  - 카드 배경: `#ffffff`
  - 민트 포인트: `#27d3c3`
  - 오렌지 포인트: `#ff7d5a`
  - 텍스트 기본: `#0f172a`
  - 텍스트 보조: `#64748b`
  - 정답 색상: `#22c55e`
  - 오답 색상: `#ef4444`
- 폰트: `Arial, "Noto Sans KR", sans-serif`
- 카드 border-radius: 22px
- 그림자: `0 12px 30px rgba(15,23,42,0.08)`

### 레이아웃 구조 (위에서 아래 순서)

```
[상단 바]
- 왼쪽: 브랜드명 "pluepe" (네이비, 굵게)
- 오른쪽: 오늘 날짜 chip (흰 배경, 테두리)

[플레이어 카드] ← 전체를 감싸는 흰 카드, 둥근 모서리
  [헤더 영역]
  - breadcrumb: TOPIK 1 월간 · 편의점에서 물건 사기
  - 과정 뱃지: "오늘의 훈련 1 / 3" (민트 배경)
  - 제목: "편의점에서 물건 사기" (크게, 네이비)
  - 부제: "mua đồ ở cửa hàng tiện lợi" (회색)
  - 진행률 행: "STEP X / 5" | 진행 바 (민트 색상, 애니메이션)
  - STEP 탭 5개: 가로 균등 배치
    - 미완료: 흰 배경, 회색 테두리
    - 현재: 네이비 배경, 흰 글자, 그림자
    - 완료: 연초록 배경, 초록 테두리

  [스테이지 카드] ← 각 STEP 내용
    [스테이지 헤더]
    - kicker 뱃지: "STEP 1 · 먼저 보기" (민트 soft 배경)
    - 제목: 각 STEP 제목
    - 설명: 각 STEP 설명

    [영상 영역] ← STEP 1,2,3만 실제 iframe 노출
    - STEP 1,2,3: Bunny iframe 실제 삽입 (aspect-ratio 16:9)
    - STEP 4,5: 네이비 배경 플레이스홀더
      (STEP 4: 단어 아이콘 + "핵심 단어 6개")
      (STEP 5: AI 아이콘 + "AI 튜터")

    [인터랙션 영역] ← 영상 아래, STEP마다 다름

    [미니 노트] ← 학습 팁 (연한 배경 박스)

  [하단 네비게이션]
  - 왼쪽: 제목 + 설명 텍스트
  - 오른쪽: [이전] [다음 단계] 버튼

[완료 카드] ← STEP 5 완료 시 노출
- "오늘의 훈련 1개 완료" 메시지
- "+10 XP · 핵심 표현 6개 학습 완료"
- "다음 세션: 지하철 타기"
```

---

## 4. 기능 요구사항

### STEP 1: 먼저 보기
- Bunny iframe 영상 삽입
- 이해 확인 문제 1개 (객관식 3지선다)
- 정답 클릭 시: 초록으로 강조 + "정답입니다. 잘했어요." 피드백
- 오답 클릭 시: 빨간 강조 + 정답 표시 + 피드백 메시지
- 한 번 답하면 재클릭 불가 (잠금)
- [다음 단계] 클릭 시 STEP 2로 이동

### STEP 2: 빈칸으로 연습하기
- Bunny iframe 영상 삽입 (같은 영상)
- 빈칸 문제 3개 순서대로 노출 (객관식 3지선다)
- 각 문제 독립 채점
- 모든 문제에 힌트 텍스트 포함 (베트남어)
- [다음 단계] 클릭 시 STEP 3으로 이동

### STEP 3: 듣고 따라 말하기
- Bunny iframe 영상 삽입 (같은 영상)
- 따라 말할 문장 3개 버튼으로 나열
- 각 문장 버튼 클릭 시: 민트 색으로 체크 표시 (완료 상태)
- 3개 모두 체크 시: "모두 따라 말했어요!" 메시지 노출
- 음성 인식 없음 — 스스로 체크하는 방식
- [다음 단계] 클릭 시 STEP 4로 이동

### STEP 4: 단어 익히기
- 영상 없음 (네이비 플레이스홀더)
- 단어 카드 6개 그리드 (2열)
- 각 카드: 한국어(크게) + 베트남어 뜻 + 예문
- 카드 클릭 시: 플립 애니메이션 (앞: 한국어/뜻, 뒤: 예문 전체)
- 하단 "퀴즈 시작" 버튼 클릭 시:
  - 랜덤으로 단어 1개 선택
  - 베트남어 뜻 보여주고 한국어 고르기 (4지선다)
  - 정답/오답 피드백 후 [다음 단계] 활성화
- [다음 단계] 클릭 시 STEP 5로 이동

### STEP 5: AI로 확장하기
- 영상 없음 (AI 플레이스홀더)
- AI 질문 버튼 3개
- 클릭 시: 버튼 아래에 Claude API 호출 결과 스트리밍 표시
- Claude API 호출 설정:
  ```javascript
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: "너는 한국어 선생님이야. 학습자는 베트남 사람이고 편의점에서 물건 사기 표현을 배웠어. 짧고 명확하게 답해줘. 한국어 표현과 베트남어 설명을 같이 써줘.",
      messages: [{ role: "user", content: prompt }]
    })
  });
  ```
- 로딩 중: 스피너 + "AI가 답변을 작성하고 있어요..." 표시
- 완료 버튼: 3개 질문 중 1개 이상 사용 시 [훈련 완료] 활성화

### 공통 기능
- STEP 탭 클릭으로 직접 이동 가능
- 이전 버튼: STEP 1에서 비활성화
- 진행 바: STEP 이동 시 부드럽게 업데이트 (transition 0.3s)
- 완료 카드: STEP 5 [훈련 완료] 클릭 시 슬라이드 업 애니메이션

---

## 5. 데이터 구조

아래 `stepData` 객체를 JavaScript에 하드코딩한다.

```javascript
const stepData = {
  1: {
    kicker: 'STEP 1 · 먼저 보기',
    title: '먼저 전체 상황을 가볍게 이해해보세요',
    desc: '지금은 외우는 단계가 아니라 익숙해지는 단계입니다. 영상의 흐름과 말의 분위기를 편하게 느껴보세요.',
    showVideo: true,
    footerTitle: '지금은 STEP 1입니다',
    footerSub: '전체 흐름을 보고, 누가 무엇을 말하는지 편하게 이해해보세요.',
    tip: '한 번에 완벽하게 이해하려 하지 말고, 어디서 쓰는 표현인지 먼저 느껴보세요.',
    quiz: {
      question: '이 상황은 어디인가요?',
      hint: '힌트 · cửa hàng tiện lợi',
      options: [
        { text: '① 편의점', correct: true },
        { text: '② 병원', correct: false },
        { text: '③ 은행', correct: false }
      ]
    }
  },
  2: {
    kicker: 'STEP 2 · 빈칸으로 연습하기',
    title: '중요한 단어를 직접 떠올려보세요',
    desc: '영상을 다시 보고 핵심 단어를 꺼내는 연습을 합니다. 이제부터는 보는 것보다 직접 기억하는 것이 중요합니다.',
    showVideo: true,
    footerTitle: '지금은 STEP 2입니다',
    footerSub: '영상 뒤에 바로 문제 3개를 풀며 핵심 단어를 기억해보세요.',
    tip: '정답을 맞히는 것보다, 왜 그 단어가 들어가는지 다시 생각해보는 것이 더 중요합니다.',
    blanks: [
      {
        question: '빈칸 문제 1',
        hint: '힌트 · một cái',
        sentence: '물 ____ 주세요.',
        options: [
          { text: '① 하나', correct: true },
          { text: '② 둘', correct: false },
          { text: '③ 많이', correct: false }
        ]
      },
      {
        question: '빈칸 문제 2',
        hint: '힌트 · bao nhiêu tiền',
        sentence: '이거 ____예요?',
        options: [
          { text: '① 어디', correct: false },
          { text: '② 얼마', correct: true },
          { text: '③ 언제', correct: false }
        ]
      },
      {
        question: '빈칸 문제 3',
        hint: '힌트 · bằng thẻ',
        sentence: '____로 계산할게요.',
        options: [
          { text: '① 현금', correct: false },
          { text: '② 포인트', correct: false },
          { text: '③ 카드', correct: true }
        ]
      }
    ]
  },
  3: {
    kicker: 'STEP 3 · 듣고 따라 말하기',
    title: '입으로 직접 따라 말해보세요',
    desc: '소리 내어 따라 하면 기억이 훨씬 오래갑니다. 완벽하지 않아도 괜찮으니 리듬과 억양을 먼저 따라가세요.',
    showVideo: true,
    footerTitle: '지금은 STEP 3입니다',
    footerSub: '세 문장을 따라 말한 뒤 다음 단계로 넘어가세요.',
    tip: '입 밖으로 한 번이라도 소리를 내는 것이 중요합니다. 조용히 읽는 것보다 훨씬 효과적입니다.',
    sentences: [
      { korean: '물 하나 주세요.', vietnamese: 'Cho tôi một chai nước.' },
      { korean: '이거 얼마예요?', vietnamese: 'Cái này bao nhiêu tiền?' },
      { korean: '카드로 계산할게요.', vietnamese: 'Tôi thanh toán bằng thẻ.' }
    ]
  },
  4: {
    kicker: 'STEP 4 · 단어 익히기',
    title: '오늘 꼭 기억해야 할 단어 6개',
    desc: '상황에서 바로 쓰는 단어를 익히면 다음 세션의 이해도도 훨씬 높아집니다.',
    showVideo: false,
    footerTitle: '지금은 STEP 4입니다',
    footerSub: '핵심 단어를 카드로 익히고, 퀴즈로 확인해보세요.',
    tip: '단어는 단독으로 외우기보다 짧은 문장 안에서 같이 익힐수록 더 잘 기억됩니다.',
    words: [
      { korean: '물', vietnamese: 'nước', example: '물 하나 주세요.' },
      { korean: '하나', vietnamese: 'một cái', example: '하나 주세요.' },
      { korean: '얼마', vietnamese: 'bao nhiêu', example: '이거 얼마예요?' },
      { korean: '계산', vietnamese: 'thanh toán', example: '카드로 계산할게요.' },
      { korean: '카드', vietnamese: 'thẻ', example: '카드로 할게요.' },
      { korean: '주세요', vietnamese: 'cho tôi', example: '물 주세요.' }
    ]
  },
  5: {
    kicker: 'STEP 5 · AI로 확장하기',
    title: '배운 표현을 다른 상황으로 넓혀보세요',
    desc: '오늘 배운 표현을 카페, 식당, 다른 생활 상황에도 적용해보면 실제 활용력이 훨씬 커집니다.',
    showVideo: false,
    footerTitle: '지금은 STEP 5입니다',
    footerSub: 'AI에게 질문하며 오늘의 표현을 다른 상황으로 확장해보세요.',
    tip: '오늘 배운 표현을 바꾸는 식으로 질문하면 훨씬 쉽게 확장할 수 있습니다.',
    aiPrompts: [
      '"물 하나 주세요"를 카페 상황으로 바꿔줘',
      '"이거 얼마예요?"를 더 공손하게 말해줘',
      '편의점에서 자주 쓰는 표현 3개 더 알려줘'
    ]
  }
};
```

---

## 6. 출력 형식

- 파일명: `training_player.html`
- 단일 파일 (HTML + CSS + JS 모두 포함)
- 외부 라이브러리 없음 (순수 HTML/CSS/JS)
- `stepData` 객체는 JS 상단에 위치
- 함수 분리: `renderStep()`, `bindQuiz()`, `bindSpeaking()`, `bindWordCards()`, `bindAI()`
- Claude API 키는 코드에 포함하지 않음 — 상단 const로 빈값 처리:
  ```javascript
  const ANTHROPIC_API_KEY = ''; // 실행 전 입력
  ```

---

## 7. 제약 조건 (하지 말 것)

- 대시보드 UI 금지 (사이드바, 통계 카드, 테이블 레이아웃 금지)
- 관리자 화면 느낌 금지
- 복잡한 3단 레이아웃 금지
- 영상이 작게 나오는 구조 금지 (영상은 항상 전체 너비)
- Bootstrap, Tailwind 등 외부 CSS 프레임워크 금지
- 한 화면에 모든 STEP 동시 노출 금지 (1번에 1 STEP만)
- 탭 메뉴 상단 고정 금지 (스크롤과 함께 흘러가야 함)
- STEP 4 단어 카드에 외부 이미지 사용 금지
- STEP 5 AI 응답을 mock 데이터로 처리 금지 (반드시 실제 API 호출)
- 완료 버튼을 처음부터 활성화 금지

---

## 실행 명령

```
위 요구사항을 기반으로 training_player.html 파일을 생성해줘.
파일은 C:\Users\song\Desktop\pluepe-korean-platform\ 폴더에 저장해줘.
생성 후 브라우저에서 열어서 STEP 1부터 5까지 동작 확인해줘.
```
