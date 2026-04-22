# pluepe 프로젝트 폴더 구조 및 작업 분담
> 작성일: 2026.04.22 | 확정판

---

## 1. 폴더 역할 정의

### korean-studio/ — 콘텐츠 제조 공장
> 기획부터 영상 완성 + Bunny 업로드까지 전부 여기서 완결

| 항목 | 내용 |
|---|---|
| 유닛 기획 | topics.txt |
| 대본 | content.json / scripts_review/ |
| 단어·패턴·문법 | vocabulary / key_expressions / grammar_points |
| 영상 자동 생성 | MP4 / PDF 학습지 / SRT 자막 |
| 번역 검증 | translation_check.json |
| Bunny 업로드 | split_video.py --upload |

---

### pluepe-korean-platform/ — 학습자 서비스
> 학습자가 실제 사용하는 플랫폼 전담

| 항목 | 내용 |
|---|---|
| 마이페이지 | 진도율·수강 현황 |
| 유닛 플레이어 | Bunny iframe 임베드 (video-player.tsx) |
| 시험 | 퀴즈·평가 |
| 랜딩 | 서비스 소개 |
| 결제 | 구독·결제 |
| 수강 진도 저장 | postMessage 기반 진도 API |
| 문서화 | docs/ |

---

## 2. 작업 흐름

```
korean-studio
기획 → 대본 → 단어/패턴 → 영상 → Bunny 업로드
                    ↓
     완성된 JSON → pluepe-korean-platform/data/ 복사
                    ↓
pluepe-korean-platform
플레이어 → 진도저장 → 마이페이지 → 시험 → 결제
```

---

## 3. 연결 고리 주의사항

### ⚠️ 주의 1 — JSON 복사 타이밍
```
korean-studio에서
vi + en + zh (또는 vi + en + id)
3개 언어 모두 완료된 토픽만
        ↓
pluepe-korean-platform/data/ 복사
```
- 미완성 언어가 있으면 복사 금지
- 일부 언어만 올라가면 플레이어가 빈 상태로 노출됨

### ⚠️ 주의 2 — 진도 저장 버그 (현재 미해결)
- video-player.tsx의 Bunny postMessage 수신 로직 깨진 상태
- Bunny iframe embed 방식으로 교체한 이후 발생
- postMessage 이벤트 방식이 Bunny iframe과 호환되지 않는 것으로 추정
- 현재 플랫폼에 GUID 연결해도 진도율 0% 고정
- JSON 복사 전에 이 버그 먼저 수정 필요

---

## 4. 작업 순서 확정

```
① video-player.tsx 진도 버그 수정 (최우선)
        ↓
② 버그 확인 완료
        ↓
③ JSON 복사 + 플랫폼 연결
```

---

## 5. 터미널 작업 방식

같은 pluepe-korean-platform 폴더에서 터미널 2개로 동시 작업.

| 터미널 | 작업 |
|---|---|
| 터미널 1 | 유닛 JSON 생성 → data/topik1/ 저장 |
| 터미널 2 | 플랫폼 개발 (마이페이지 등) |

---

*이 문서는 2026.04.22 기준 확정된 작업 분담 기준입니다.*
