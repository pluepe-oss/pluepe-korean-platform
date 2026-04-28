"""콘텐츠팀 JSON → 플랫폼 JSON 변환 스크립트.

실행:
    python scripts/convert_unit.py --input data/content_team/topik1/u102_지하철_타기.json
    python scripts/convert_unit.py --input ... --languages vi
    python scripts/convert_unit.py --input ... --languages vi,en,zh

ID 변환: u101 → topik1_u01 / u201 → topik2_u01 / u301 → eps_u01
출력 경로: data/topik1/, data/topik2/, data/eps_topik/
파일명: u{번호2자리}_{영문슬러그}_{언어}.json

부족한 필드(퀴즈, 미니테스트 등)는 Claude API(claude-sonnet-4-6) 로 자동 생성.
오류 시 안전한 기본값으로 폴백.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

# Windows 콘솔(cp949) 에서 이모지/한글 출력 시 UnicodeEncodeError 방지
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace")  # type: ignore[attr-defined]
    except Exception:  # noqa: BLE001
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BUNNY_LIBRARY_ID = "640837"
MODEL = "claude-sonnet-4-6"
DEFAULT_DURATION_MIN = 25

# 무료 진입 가능 유닛 (각 코스 첫 유닛)
FREE_UNIT_IDS = {"topik1_u01", "eps_u01"}

LANGUAGE_NAMES = {
    "vi": "Vietnamese (베트남어)",
    "en": "English (영어)",
    "zh": "Chinese Simplified (중국어 간체)",
    "th": "Thai (태국어)",
    "id": "Indonesian (인도네시아어)",
}

# 콘텐츠팀 unit code → 영문 슬러그.
# 신규 unit 추가 시 여기에 매핑을 등록한다 (없으면 topic_titles.en 자동 슬러그화 폴백).
SLUG_MAP = {
    "u101": "convenience",
    "u102": "subway",
    "u103": "cafe",
    "u104": "shopping",
    "u105": "directions",
    "u106": "hospital",
    "u107": "pharmacy",
    "u108": "bank",
    "u109": "shopping_clothes",
    "u110": "academy",
    "u111": "housing",
    "u112": "schedule",
    "u113": "family",
    "u114": "hobby",
    "u115": "weather",
    "u301": "work_instruction",
}


# ────────────────────────── 유틸 ──────────────────────────


def load_dotenv(path: Path) -> None:
    """.env.local 을 환경변수에 머지 (이미 설정된 키는 보존)."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def parse_unit_code(unit_code: str) -> tuple[str, str, int]:
    """u101 → ("topik1", "topik1_u01", 1)."""
    m = re.match(r"^u(\d)(\d{2})$", unit_code)
    if not m:
        raise ValueError(f"Invalid unit code: {unit_code!r}")
    course_digit, num = m.group(1), int(m.group(2))
    course_map = {"1": "topik1", "2": "topik2", "3": "eps"}
    if course_digit not in course_map:
        raise ValueError(f"Unknown course prefix in {unit_code!r}")
    course = course_map[course_digit]
    return course, f"{course}_u{num:02d}", num


def slugify_fallback(text: str) -> str:
    if not text:
        return "unit"
    s = re.sub(r"[^a-zA-Z0-9_]+", "_", text.lower())
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "unit"


def output_dir_for_course(course: str) -> Path:
    name = "eps_topik" if course == "eps" else course
    out = PROJECT_ROOT / "data" / name
    out.mkdir(parents=True, exist_ok=True)
    return out


def find_example_ko(word_ko: str, dialogue: list[dict]) -> str:
    """대화에서 word_ko 를 포함하는 한국어 문장 추출. 없으면 폴백."""
    for line in dialogue:
        ko = line.get("ko", "")
        if word_ko and word_ko in ko:
            return ko
    return f"{word_ko}을(를) 사용해요." if word_ko else ""


# ────────────────────────── Claude API ──────────────────────────


def make_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("⚠️  ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않습니다.", file=sys.stderr)
        print("    .env.local 또는 셸 환경변수로 등록 후 다시 실행하세요.", file=sys.stderr)
        sys.exit(1)
    try:
        import anthropic  # type: ignore
    except ImportError:
        print("⚠️  anthropic 패키지가 설치되어 있지 않습니다. `pip install -r requirements.txt`", file=sys.stderr)
        sys.exit(1)
    return anthropic.Anthropic(api_key=api_key)


def claude_json(client, prompt: str, system: str, max_tokens: int = 1500) -> Any:
    """Claude 호출 + JSON 파싱. 실패 시 None."""
    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.content[0].text.strip()
        # 코드 펜스 제거
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return json.loads(text)
    except Exception as e:  # noqa: BLE001 — API/파싱 실패 모두 폴백
        print(f"  [Claude 호출/파싱 실패] {e}", file=sys.stderr)
        return None


def translate_batch(client, texts: list[str], lang: str, course: str = "") -> list[str]:
    """ko → lang 일괄 번역. 한 번의 API 호출로 처리. 실패 시 원문 폴백.

    학습 콘텐츠 번역 보강용. 입력 순서와 출력 순서가 1:1 일치해야 한다.
    응답이 길이/타입 검증 실패하면 원문을 그대로 반환해 안전 폴백.
    course == "eps" 면 산업 현장 표준 용어집을 프롬프트에 주입.
    """
    if not texts:
        return []
    numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(texts))
    glossary_block = EPS_GLOSSARY if course == "eps" else ""
    prompt = f"""아래 한국어 문장/단어/표현들을 {lang_name(lang)} 로 자연스럽게 번역해줘.
- 학습용 콘텐츠이므로 정확하고 자연스럽게 번역
- 단어 1개만 있는 경우는 사전적 의미 위주로
- 문법 설명문은 동등한 의미의 짧은 표현으로
- 어미가 1:1 매칭되지 않는 경우 짧은 설명을 괄호로 병기 (예: "V-기 전에 (trước khi V)")

{glossary_block}
원문 ({len(texts)}개):
{numbered}

오직 JSON 배열만 출력 (원문과 같은 순서, 정확히 {len(texts)}개 문자열):
["번역1", "번역2", ...]
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=3000)
    if (
        isinstance(result, list)
        and len(result) == len(texts)
        and all(isinstance(x, str) for x in result)
    ):
        return result
    print(f"  [일괄 번역 실패 또는 길이 불일치] 원문 그대로 사용", file=sys.stderr)
    return list(texts)


def fill_missing_translations(content: dict, lang: str, course: str, client) -> None:
    """key_expressions / vocabulary / grammar_points 의 빈 lang 필드를 일괄 번역하여 채움.

    원본 content 를 in-place 로 갱신한다. 한 번의 API 호출로 처리해 비용 최소화.
    grammar_points[lang] 은 explanation 우선, 없으면 pattern 텍스트를 번역.
    grammar_points[example_{lang}] 은 example_ko 를 번역.
    course="eps" 일 때 산업 현장 용어집을 적용.
    """
    slots: list[tuple[dict, str, str]] = []  # (target_obj, key_to_set, korean_source)

    for e in content.get("key_expressions", []):
        if not e.get(lang) and e.get("ko"):
            slots.append((e, lang, e["ko"]))

    for v in content.get("vocabulary", []):
        if not v.get(lang) and v.get("ko"):
            slots.append((v, lang, v["ko"]))

    for gp in content.get("grammar_points", []):
        if not gp.get(lang):
            src = gp.get("explanation") or gp.get("pattern") or ""
            if src:
                slots.append((gp, lang, src))
        ex_key = f"example_{lang}"
        if not gp.get(ex_key) and gp.get("example_ko"):
            slots.append((gp, ex_key, gp["example_ko"]))

    if not slots:
        return

    print(f"  → 빈 {lang} 번역 필드 {len(slots)}개 일괄 번역 중...")
    texts = [s[2] for s in slots]
    translations = translate_batch(client, texts, lang, course=course)
    for (obj, key, ko_src), tr in zip(slots, translations):
        # tr 가 빈 문자열이면 원문(ko_src) 으로 폴백
        obj[key] = tr if tr else ko_src


def dialogue_summary(content: dict, max_lines: int = 8) -> str:
    lines = content.get("dialogue", [])[:max_lines]
    return "\n".join(f"{l.get('role', '')}: {l.get('ko', '')}".strip(": ") for l in lines)


def lang_name(lang: str) -> str:
    return LANGUAGE_NAMES.get(lang, lang)


SYSTEM_BASE = (
    "You are a Korean language curriculum designer with 20 years of e-learning experience "
    "and a Korean teaching credential. Author high-quality test items that match the "
    "real-world context (EPS-TOPIK = industrial worksite, TOPIK 1/2 = daily life). "
    "Output ONLY valid JSON. No commentary, no markdown fences, no preamble."
)


def domain_context(course: str) -> str:
    """course → 문항 작성용 도메인 컨텍스트 (한국어)."""
    if course == "eps":
        return (
            "산업 현장 (공장/제조/건설/조선/농축산 등) — 감독관과 외국인 근로자 간 실무 대화. "
            "표준 어휘: 작업 지시서, 부품, 조립, 포장, 운반, 점검, 보고, 보호구, 불량품, 완성품, "
            "생산 라인, 마감 시간, 안전 수칙."
        )
    if course == "topik2":
        return "TOPIK 2 중급 한국어 — 사회/경제/문화 등 다양한 준학술 대화."
    return "TOPIK 1 일상 생활 — 편의점, 식당, 카페, 병원, 교통 등 외국인 학습자가 한국에서 자주 마주하는 상황."


# 산업 현장 표준 용어집 (EPS 번역 시 우선 적용).
EPS_GLOSSARY = """\
표준 산업 현장 용어 (가능한 한 아래 표현을 우선 사용):
- 부품: vi=linh kiện / th=ชิ้นส่วน / id=komponen
- 보호구: vi=thiết bị bảo hộ / th=อุปกรณ์ป้องกัน / id=APD
- 보고하다: vi=báo cáo / th=รายงาน / id=lapor
- 조립하다: vi=lắp ráp / th=ประกอบ / id=merakit
- 확인하다: vi=kiểm tra / th=ตรวจสอบ / id=mengecek
- 불량품: vi=hàng lỗi / th=ของเสีย / id=produk cacat
- 작업 지시서: vi=phiếu chỉ thị / th=ใบสั่งงาน / id=lembar instruksi
- 마감 시간: vi=thời hạn / th=เวลาส่งงาน / id=batas waktu
"""


# ────────────────────────── 항목별 생성기 ──────────────────────────


def gen_step1_quiz(client, content: dict, lang: str) -> dict:
    topic = content.get("topic_titles", {}).get("ko") or content.get("topic", "")
    prompt = f"""대상 학습자 언어: {lang_name(lang)}.
한국어 학습 유닛 주제: "{topic}".
대화 일부:
{dialogue_summary(content, 6)}

위 상황이 "어디서" 일어나는지 묻는 3지선다 퀴즈 1문제를 만들어줘.
- question 은 한국어 (예: "이 상황은 어디인가요?")
- options 는 한국어 장소명 3개 (정답 + 오답 2개)
- answer 는 정답 인덱스 (0~2)

# 정답 위치
- answer 를 0(①) 으로 고정하지 말 것. 0~2 중 자연스러운 위치에 정답을 배치.

오직 다음 JSON 한 객체만 출력:
{{"question": "...", "options": ["...", "...", "..."], "answer": 1}}
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=300)
    if isinstance(result, dict) and "options" in result and "answer" in result:
        return result
    return {
        "question": "이 상황은 어디인가요?",
        "options": [topic or "장소", "다른 곳", "또 다른 곳"],
        "answer": 0,
    }


def gen_step2_blanks(client, content: dict, lang: str, course: str = "") -> list[dict]:
    expressions = content.get("key_expressions", [])[:3]
    expr_text = "\n".join(
        f'- "{e.get("ko", "")}" / {lang}="{e.get(lang, "")}" / 상황: {e.get("situation", "")}'
        for e in expressions
    )
    prompt = f"""대상 학습자 언어: {lang_name(lang)}
도메인 컨텍스트: {domain_context(course)}

아래 핵심 표현 3개를 사용해 "빈칸 채우기" 퀴즈 3문제를 만들어줘.

# 형식
- sentence: 한국어 문장에서 핵심 어휘 또는 문법 요소 한 곳을 ____ 로 비운다
  · 핵심 어휘 빈칸 예: "모르면 바로 ____보세요." (정답: 물어)
  · 어미/조사 빈칸 예: "순서____로 작업하세요." (정답: 대)
- options: 한국어 3개 (정답 1 + 그럴듯한 오답 2)
- answer: 정답 인덱스 0~2
- hint: {lang_name(lang)} 로 의미만 짧게 (1~3 단어, 한국어 정답 직역 금지)

# 절대 금지
- "어떤 단어를 쓰나요?" 같은 메타 질문 금지
- 빈칸 뒤 어미와 호응이 안 되는 선택지 금지 ("____합니다" 뒤에 "조립하다" 같은 기본형 X)
- 도메인과 무관한 단어를 오답 선택지에 넣지 말 것

# 오답 선택지 기준
- 같은 도메인 ({domain_context(course)}) 안에서 의미가 다른 단어로 구성

# 한국어 단위명 (의존명사) 호응 규칙 (중요!)
빈칸이 단위명인 경우 반드시 문맥에 맞는 단위로 정답·오답을 구성한다.
정답과 오답 모두 같은 카테고리 단위명만 사용 (서로 다른 카테고리 혼합 금지).
- 음료/커피/차/술  → 잔  (오답 예: 컵, 병, 모금)
- 음식/물건/상품  → 개  (오답 예: 봉지, 박스, 그릇)
- 종이/서류/티켓  → 장  (오답 예: 부, 권, 매)
- 번호/순서/노선  → 번  (오답 예: 호, 차, 회)
- 사람          → 명 / 분  (오답 예: 인, 사람)

# 반의어 대비 구조 인식 (중요!)
문장에 대비되는 두 선택지(A vs ___)가 제시된 경우 반드시 "반의어"를 정답으로 둔다.
유사어/동의어/정도 차이만 있는 단어는 대비 구조의 정답으로 불가.
- 따뜻하게 ↔ 차갑게 (O) / 뜨겁게 (X — 유사어 · 정도 차이)
- 크다 ↔ 작다 (O) / 거대하다 (X — 유사어)
- 길다 ↔ 짧다 (O) / 늘어나다 (X — 행위)
- 빠르다 ↔ 느리다 (O) / 천천히 (X — 부사형 · 의미 약함)
- 많다 ↔ 적다 (O) / 부족하다 (X — 결과 표현)
오답 선택지에는 유사어/정도 차이 표현을 배치해 변별력을 만든다 (예: 따뜻하게 vs ____ 정답 "차갑게", 오답 "시원하게" / "뜨겁게" / "미지근하게").

# 정답 위치 분산
- 3문제의 answer 를 0/1/2 에 고르게 분산
- 모두 0(①)으로 고정하지 말 것
- 같은 번호 2번 이상 연속 금지

핵심 표현:
{expr_text}

오직 JSON 배열만 출력 (3개 객체):
[{{"sentence": "...", "hint": "...", "options": ["...","...","..."], "answer": 1}}]
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=1100)
    if isinstance(result, list) and result:
        result = _diversify_consecutive_answers(result)
        return result[:3]
    return [
        {
            "sentence": e.get("ko", "____"),
            "hint": e.get(lang, ""),
            "options": ["보기1", "보기2", "보기3"],
            "answer": 0,
        }
        for e in expressions
    ] or [
        {"sentence": "____.", "hint": "", "options": ["1", "2", "3"], "answer": 0}
    ]


def build_step3_sentences(content: dict, lang: str) -> list[dict]:
    return [
        {"ko": e.get("ko", ""), "translation": e.get(lang, "")}
        for e in content.get("key_expressions", [])[:3]
    ]


def build_step4_words(content: dict, lang: str) -> list[dict]:
    return [
        {
            "korean": v.get("ko", ""),
            "translation": v.get(lang, ""),
            "example": find_example_ko(v.get("ko", ""), content.get("dialogue", [])),
        }
        for v in content.get("vocabulary", [])[:6]
    ]


def gen_step5_review(client, content: dict, lang: str) -> list[dict]:
    expressions = content.get("key_expressions", [])[:3]
    expr_text = "\n".join(
        f'- ko="{e.get("ko", "")}" / 상황: {e.get("situation", "")}'
        for e in expressions
    )
    prompt = f"""아래 한국어 표현 3개의 "사용 상황(context)" 을 {lang_name(lang)} 로 짧게 번역해줘.
context 는 "이 표현을 어떤 상황에서 쓰는지" 를 한 문장으로.

표현:
{expr_text}

오직 JSON 배열만 출력 (3개 객체, 한국어 표현 순서 그대로):
[{{"context": "..."}}]
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=500)
    contexts = []
    if isinstance(result, list):
        contexts = [str(r.get("context", "")) for r in result if isinstance(r, dict)]
    out = []
    for i, e in enumerate(expressions):
        out.append({
            "ko": e.get("ko", ""),
            "translation": e.get(lang, ""),
            "context": contexts[i] if i < len(contexts) else (e.get("situation") or ""),
        })
    return out


def build_words(content: dict, lang: str) -> list[dict]:
    """전체 vocabulary → 플랫폼 words. example 은 한국어 예문의 단순 직역(API 미사용).
    번역 정확도가 필요한 항목은 추후 별도 작업으로 보강."""
    out = []
    for v in content.get("vocabulary", []):
        ko = v.get("ko", "")
        example_ko = find_example_ko(ko, content.get("dialogue", []))
        out.append({
            "korean": ko,
            "translation": v.get(lang, ""),
            "example_ko": example_ko,
            "example": "",  # 추후 별도 번역 보강
        })
    return out


def gen_words_quiz(
    client,
    content: dict,
    lang: str,
    course: str = "",
    session_step1: dict | None = None,
    session_step2: list[dict] | None = None,
) -> list[dict]:
    vocab = content.get("vocabulary", [])
    vocab_text = "\n".join(
        f'- ko="{v.get("ko", "")}" / {lang}="{v.get(lang, "")}"' for v in vocab[:8]
    )

    # 세션 퀴즈에서 이미 사용된 문장/단어 — words_quiz 중복 출제 금지 가드용
    session_block_lines: list[str] = []
    if isinstance(session_step1, dict) and session_step1.get("question"):
        session_block_lines.append(f'- step1_quiz: "{session_step1["question"]}"')
    if isinstance(session_step2, list):
        for i, q in enumerate(session_step2):
            if isinstance(q, dict) and q.get("sentence"):
                session_block_lines.append(f'- step2_blanks[{i}]: "{q["sentence"]}"')
    session_block = "\n".join(session_block_lines) if session_block_lines else "(세션 퀴즈 정보 없음)"

    prompt = f"""대상 학습자 언어: {lang_name(lang)}
도메인 컨텍스트: {domain_context(course)}

아래 어휘로 어휘 퀴즈 3문제를 만들어줘.

# 절대 금지
- "어떤 단어를 쓰나요?" / "어떤 상황에서 이 단어를 쓰나요?" 같은 메타 질문 금지
- options 에 기본형 동사(-다 형태) 사용 금지 — 빈칸 뒤 어미와 호응되는 형태로만
  · 잘못된 예: "____해야 합니다" + ["조립하다", "확인하다", ...] → 어미 충돌
  · 올바른 예: "____해야 합니다" + ["조립", "확인", "검사", "보고"] (명사형)
- 정답과 무관한 도메인 단어를 오답으로 사용하지 말 것

# 세션 퀴즈 중복 출제 금지 — "문제 의도(intent)" 기준 (중요!)
아래 세션 퀴즈와 "문제 의도가 동일한" 문항은 만들지 말 것.
- 동일한 단어가 등장하는 것은 허용 — 어휘 반복 자체는 자연스러움
- 같은 단어를 같은 문법/상황 맥락에서 다시 묻는 것은 금지
- 문제 의도(어떤 표현을 / 어떤 문법 결합으로 / 어떤 상황에서 묻는가) 가 다르면 같은 단어 재사용 OK
- 가능하면 세션에서 깊이 다루지 않은 어휘/표현을 우선 활용

세션 퀴즈 (의도 중복 금지 대상):
{session_block}

# 형식 (3문제 모두 아래 두 형식 중 하나로 선택. 분포: fill 2개 + meaning 1개 권장)
1) type="fill" — 빈칸 채우기
   · question: 한국어 문장에 ____ 빈칸
     예) "제품을 완성하기 위해 부품을 순서대로 ____합니다."
   · options: 한국어 4개 (정답 1 + 같은 도메인 오답 3)
     예) ["조립", "포장", "운반", "점검"]

2) type="meaning" — 정의형
   · question: "~을(를) 무엇이라고 합니까?"
     예) "기계나 제품을 이루는 하나하나의 낱개를 무엇이라고 합니까?"
   · options: 한국어 4개 (정답 1 + 같은 도메인 유사 단어 3)
     예) ["부품", "공구", "불량품", "완성품"]

# 공통 필드
- answer: 정답 인덱스 0~3
- hint: {lang_name(lang)} 로 정답 의미만 1~3 단어 (한국어 직역 금지)

# 정답 위치 분산
- 3문제의 answer 를 0/1/2/3 에 고르게 분산 (예: 1, 3, 0 / 2, 0, 3 등)
- 같은 번호로 정답이 집중되거나 같은 번호 2번 이상 연속 금지

어휘:
{vocab_text}

오직 JSON 배열만 출력 (3개 객체):
[{{"type":"fill","question":"...","options":["...","...","...","..."],"answer":0,"hint":"..."}}]
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=1500)
    if isinstance(result, list) and result:
        return result[:3]
    return [
        {
            "type": "fill",
            "question": "____ 합니다.",
            "options": ["보기1", "보기2", "보기3", "보기4"],
            "answer": 0,
            "hint": "",
        }
    ]


def _domain_words_for_unit(content: dict, limit: int = 12) -> str:
    """vocabulary + key_expressions 의 한국어를 모아 도메인 어휘 힌트 문자열로 반환."""
    words: list[str] = []
    for v in content.get("vocabulary", [])[:8]:
        ko = v.get("ko", "")
        if ko:
            words.append(ko)
    for e in content.get("key_expressions", [])[:5]:
        ko = e.get("ko", "")
        if ko:
            words.append(ko)
    return ", ".join(words[:limit])


_PATTERN_DOMAIN_RULES = """\
# 도메인 강제 규칙 (절대)
- 모든 sentence 예문은 반드시 본 유닛 주제 "{topic}" 와 관련된 어휘만 사용
- 다른 주제(카페/편의점/병원/지하철/쇼핑몰 등 본 유닛과 다른 도메인)의 어휘 혼입 절대 금지
- 본 유닛 핵심 어휘 가이드: {domain_words}

# 문법 변별력 원칙
- 패턴의 문법 규칙을 이해해야 풀 수 있는 문항 (눈치로 못 맞추도록)
- 오답은 유사하지만 의미/결합이 다른 문법 형태로만 구성. 예시:
  · V-기 전에 → 오답: -ㄴ 후에 / -기 때문에 / -고 나서
  · V-고 나서 → 오답: -기 전에 / -고 싶어서 / -아도
  · V-아도 괜찮아요 → 오답: -아서 / -으면 / -기
  · V-면 돼요 → 오답: -고 / -해도 / -하기
  · V-세요 → 오답: -하면 / -해도 / -하기
"""


def _diversify_consecutive_answers(items: list[dict]) -> list[dict]:
    """연속된 동일 answer 인덱스 발견 시 options 를 swap 해 다른 위치로 정답을 옮긴다.

    LLM이 정답 분산 규칙을 지키지 못한 경우의 안전망. 결정적 동작:
    items[i].answer == items[i-1].answer 이면 items[i] 의 options 안에서 정답을
    items[i-1].answer 와 다른 첫 후보 위치로 swap. items[i].answer 갱신.
    """
    for i in range(1, len(items)):
        item = items[i]
        prev = items[i - 1]
        if not isinstance(item, dict) or not isinstance(prev, dict):
            continue
        prev_ans = prev.get("answer")
        cur_ans = item.get("answer")
        if not isinstance(prev_ans, int) or not isinstance(cur_ans, int):
            continue
        if cur_ans != prev_ans:
            continue
        opts = item.get("options")
        if not isinstance(opts, list) or not (0 <= cur_ans < len(opts)):
            continue
        # prev_ans 와 다른 첫 후보 위치로 정답 텍스트 swap
        for new_idx in range(len(opts)):
            if new_idx == prev_ans or new_idx == cur_ans:
                continue
            opts[cur_ans], opts[new_idx] = opts[new_idx], opts[cur_ans]
            item["answer"] = new_idx
            break
    return items


def _is_valid_quiz(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and isinstance(obj.get("sentence"), str)
        and isinstance(obj.get("answer"), str)
        and isinstance(obj.get("options"), list)
        and len(obj.get("options", [])) >= 2
    )


def _gen_single_pattern_quiz(
    client,
    gp: dict,
    lang: str,
    course: str,
    topic: str,
    domain_words: str,
    max_retries: int = 2,
) -> dict | None:
    """단일 패턴 quiz 1개 생성. 파싱/검증 실패 시 max_retries 회 재시도. 모두 실패 → None."""
    rules = _PATTERN_DOMAIN_RULES.format(topic=topic, domain_words=domain_words)
    prompt = f"""대상 학습자 언어: {lang_name(lang)}
도메인 컨텍스트: {domain_context(course)}
본 유닛 주제: "{topic}"

다음 한국어 문법 패턴 1개에 대해 "빈칸 채우기" 퀴즈를 1문제 만들어줘.

패턴: {gp.get('pattern', '')}
참고 예문(한국어): {gp.get('example_ko', '')}

{rules}

# 형식
- sentence: 패턴이 적용된 한국어 문장에서 패턴 한 곳을 ____ 로 비움
- answer: 정답 한국어 패턴 조각 (예: "기 전에")
- options: 한국어 4개 (정답 1 + 유사 문법 오답 3)

# 정답 위치 분산
- options 배열에서 정답 텍스트를 항상 첫 번째(①)에 두지 말 것
- 정답이 ①②③④ 중 자연스러운 위치에 오도록 options 순서를 셔플

오직 JSON 한 객체만 출력:
{{"sentence":"...","answer":"...","options":["...","...","...","..."]}}
"""
    for attempt in range(max_retries + 1):
        result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=500)
        if _is_valid_quiz(result):
            return result
        if attempt < max_retries:
            print(
                f"    ↻ 패턴 '{gp.get('pattern', '')}' quiz 재시도 ({attempt + 1}/{max_retries})",
                file=sys.stderr,
            )
    return None


def gen_patterns_with_quiz(client, content: dict, lang: str, course: str = "") -> list[dict]:
    """grammar_points → patterns. blank_quiz 는 batch 1회 시도 후, 실패 항목은 개별 재시도(최대 2회)."""
    gps = content.get("grammar_points", [])
    if not gps:
        return []

    topic = content.get("topic_titles", {}).get("ko") or content.get("topic", "")
    domain_words = _domain_words_for_unit(content)
    rules = _PATTERN_DOMAIN_RULES.format(topic=topic, domain_words=domain_words)

    gp_text = "\n".join(
        f"{i+1}) pattern={gp.get('pattern','')} / 예문 ko={gp.get('example_ko','')}"
        for i, gp in enumerate(gps)
    )
    batch_prompt = f"""대상 학습자 언어: {lang_name(lang)}
도메인 컨텍스트: {domain_context(course)}
본 유닛 주제: "{topic}"

아래 한국어 문법 패턴 각각에 대해 "빈칸 채우기" 퀴즈를 1문제씩 만들어줘.

{gp_text}

{rules}

# 각 문제 형식
- sentence: 패턴이 적용된 한국어 문장에서 패턴 한 곳을 ____ 로 비움
- answer: 정답 한국어 패턴 조각
- options: 한국어 4개 (정답 1 + 유사 문법 오답 3)

# 정답 위치 분산
- 각 문제의 options 배열에서 정답 위치를 ①②③④ 에 고르게 분산
- 모든 문제의 정답을 ① 첫 번째에 두지 말 것
- 같은 번호로 정답이 2번 이상 연속되지 않게

오직 JSON 배열만 출력 ({len(gps)}개 객체, 위 패턴 순서대로):
[{{"sentence":"...","answer":"...","options":["...","...","...","..."]}}]
"""
    batch_result = claude_json(client, batch_prompt, SYSTEM_BASE, max_tokens=1500)
    quiz_list = batch_result if isinstance(batch_result, list) else []

    out = []
    for i, gp in enumerate(gps):
        examples = [gp.get("example_ko", "")]
        ex_lang = gp.get(f"example_{lang}")
        if ex_lang:
            examples.append(ex_lang)

        # batch 결과 우선 사용 — 형식 검증 실패 시 개별 재시도
        quiz = quiz_list[i] if i < len(quiz_list) else None
        if not _is_valid_quiz(quiz):
            quiz = _gen_single_pattern_quiz(
                client, gp, lang, course, topic, domain_words, max_retries=2
            )
        if not quiz:
            quiz = {
                "sentence": gp.get("example_ko", "____"),
                "answer": "",
                "options": ["보기1", "보기2", "보기3", "보기4"],
            }
        out.append({
            "pattern": gp.get("pattern", ""),
            "meaning": gp.get(lang, ""),
            "examples": examples,
            "blank_quiz": quiz,
        })
    return out


def gen_mini_test(client, content: dict, lang: str, course: str = "") -> list[dict]:
    topic = content.get("topic_titles", {}).get("ko") or content.get("topic", "")
    is_eps = course == "eps"
    listening_guide = (
        "감독관-근로자 실무 대화 상황. 핵심 지시어 파악 문제."
        ' 예: "감독이 무엇을 하라고 했습니까?"'
        if is_eps
        else "주제 관련 일상 대화 상황. 핵심 정보 파악 문제."
    )
    reading_guide = (
        "작업 지시서 / 안전 표지판 / 사내 안내문 형식."
        ' 예: "작업 지시서: 라인 A에서 부품을 조립하시오."'
        if is_eps
        else "한국에서 흔히 보는 안내문 / 표지판 / 메뉴 / 영수증 형식."
    )
    situation_guide = (
        "현장 상황 판단 문제." ' 예: "이 근로자는 지금 무엇을 하고 있습니까?"'
        if is_eps
        else "한 문장으로 묘사된 일상 상황 판단 문제."
    )

    prompt = f"""대상 학습자 언어: {lang_name(lang)}
도메인 컨텍스트: {domain_context(course)}
한국어 학습 주제: "{topic}"
대화:
{dialogue_summary(content, 8)}

미니 테스트 3문제를 만들어줘. type 은 listening / reading / situation 각 1개씩.

# 유형별 작성 가이드
- listening: {listening_guide}
- reading: {reading_guide}
- situation: {situation_guide}

# 공통 필드 형식
- 모든 한국어 텍스트(script/text/sentence/question/options) 는 한국어로 작성
- options 4개: 정답 1 + 같은 도메인의 그럴듯한 오답 3
- answer: 정답 인덱스 0~3
- explanation: 해설

# explanation 규칙 (매우 중요!)
- 반드시 한국어로만 작성 — {lang_name(lang)} 등 외국어 단어/문자 절대 포함 금지
- 형식: "OO은/는 ~을 의미합니다. ~할 때 사용합니다." 같은 학습 친화적 문체
- 길이: 1~2 문장

# 정답 위치 분산
- 3문제의 answer 를 0/1/2/3 에 고르게 분산 (예: 2, 0, 3 / 1, 3, 0 등)
- 모든 문제의 answer 를 0 (① 첫 번째) 에 두지 말 것
- 같은 번호 2번 이상 연속 금지

오직 JSON 배열만 출력 (3개 객체, listening/reading/situation 순서):
[
  {{"type":"listening","script":"...","question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}},
  {{"type":"reading","text":"...","question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}},
  {{"type":"situation","sentence":"...","question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}}
]
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=2000)
    if isinstance(result, list) and result:
        result = _diversify_consecutive_answers(result)
        return result[:3]
    # 폴백: 단순 구조
    return [
        {
            "type": "listening",
            "script": "(콘텐츠 준비 중)",
            "question": "무엇에 관한 대화인가요?",
            "options": [topic, "다른 주제", "또 다른 주제", "기타"],
            "answer": 0,
            "explanation": "",
        }
    ]


def gen_ai_extension(client, content: dict, lang: str) -> list[str]:
    topic = content.get("topic_titles", {}).get("ko") or content.get("topic", "")
    prompt = f"""대상 학습자 언어: {lang_name(lang)}.
주제 "{topic}" 와 관련해 학습자가 AI 와 자유롭게 확장 학습할 수 있는 짧은 한국어 프롬프트 3개를 만들어줘.
- 각 프롬프트는 한국어로 작성
- 학습자가 그대로 AI 에게 입력해 추가 학습할 만한 내용
- 예: "○○ 표현을 더 공손하게 말하는 방법 알려줘"

오직 JSON 배열만 출력 (한국어 문자열 3개):
["...", "...", "..."]
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=400)
    if isinstance(result, list) and all(isinstance(x, str) for x in result):
        return result[:3]
    return [
        f"\"{topic}\" 상황에서 자주 쓰는 표현 3가지를 더 알려줘",
        f"\"{topic}\" 와 관련된 어휘를 카테고리별로 정리해줘",
        f"\"{topic}\" 상황을 응용한 짧은 대화 예시를 만들어줘",
    ]


# ────────────────────────── 자동 검수 + 재생성 ──────────────────────────


_AUDIT_RULES = """\
# 검수 기준
1) 단위명 오류 — 빈칸이 단위명일 때 카테고리 오류
   · 음료/커피/차/술 → 잔  (개/번/장 X)
   · 음식/물건/상품 → 개  (잔 X)
   · 종이/서류/티켓 → 장
   · 번호/순서/노선 → 번
   · 정답·오답이 서로 다른 카테고리 단위명을 섞으면 오류

2) 반의어 대비 구조 오류 — "A vs ____" 같은 대비 구조에서
   · 정답은 반드시 명확한 반의어 (따뜻하게 ↔ 차갑게 O)
   · 유사어/동의어/정도 차이/부사형은 정답 불가 (시원하게/뜨겁게/미지근하게 X)

3) 문법 호응 오류 — 빈칸 뒤 어미와 정답 형태가 안 맞음
   · "____합니다" 뒤에는 명사형 (동사 기본형 X)
   · "____요?" 같은 종결형 어미와 결합이 부자연스러움

4) 의미 부적절 — 정답이 문장 맥락/상식과 안 맞음

5) 오답 우월 — 오답 선택지가 정답보다 더 자연스러움

6) 문장 자연스러움 오류 — 빈칸 문항(step2_blanks / patterns_blank_quiz)에서
   · 주어와 서술어 / 명사와 형용사 등의 의미 호응이 어긋남
     (잘못된 예: "사이즈는 따뜻하게 ____?" — 사이즈와 따뜻하게는 어울리지 않음)
   · 서로 다른 맥락의 단어가 한 문장에 섞임
     (잘못된 예: 카페 유닛 문항에 지하철 어휘가 등장)
   · 한국어 화자에게 자연스럽지 않은 문장 구조

7) 정답 유일성 오류 — 빈칸 문항에서 정답이 1개로 결정되지 않음
   · 다른 선택지도 문맥상 정답이 될 수 있으면 오류
     (잘못된 예: "다른 ____ 있어요?" / options=[색깔, 사이즈, 디자인, 색상] → 다수 정답 가능)
   · 수정 방향: 문장을 더 구체적으로 만들어 정답이 유일하도록 한정
     (좋은 예: "흰색 말고 다른 ____ 있어요?" → 색깔만 정답)

8) 문맥 억지스러움 오류 — patterns_blank_quiz / step2_blanks 의 한 문장 안에서
   · 앞 절과 빈칸 답이 논리적으로 연결되지 않으면 오류
     (잘못된 예: "파란색이 마음에 드는데 ____ 티셔츠는 없어요?" / 정답 "흰색"
      → 파란색 선호 표명 후 흰색 요청은 문맥 불일치)
   · 인과/대조/순접 등 연결어미가 의미와 안 맞으면 오류

# 출력 형식
오류가 있는 항목만 errors 배열에 나열. 오류 없으면 빈 배열.
field 는 "step2_blanks" / "words_quiz" / "mini_test" / "patterns_blank_quiz" 중 하나.
suggested_correct 는 권장 정답 텍스트(가능하면), 모르면 빈 문자열.

오직 JSON 한 객체만 출력:
{"errors": [
  {"field": "step2_blanks", "index": 2, "reason": "반의어 오류 — 정답이 유사어",
   "suggested_correct": "차갑게"}
]}
"""


def _audit_items(client, lang: str, course: str, topic: str, items: dict) -> list[dict]:
    """문항 묶음을 Claude 로 검수. errors 배열 반환 (없으면 빈 배열)."""
    items_json = json.dumps(items, ensure_ascii=False, indent=2)
    prompt = f"""대상 학습자 언어: {lang_name(lang)}
도메인: {domain_context(course)}
주제: "{topic}"

다음 한국어 학습 문항들을 교육공학 기준으로 검수해 오류만 보고해줘.

{_AUDIT_RULES}

# 검수 대상
{items_json}
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=2500)
    if isinstance(result, dict) and isinstance(result.get("errors"), list):
        return [e for e in result["errors"] if isinstance(e, dict)]
    return []


def _is_valid_blank_index(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and isinstance(obj.get("sentence"), str)
        and isinstance(obj.get("options"), list)
        and len(obj.get("options", [])) >= 2
        and isinstance(obj.get("answer"), int)
        and 0 <= obj["answer"] < len(obj["options"])
    )


def _is_valid_words_quiz_item(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and isinstance(obj.get("question"), str)
        and isinstance(obj.get("options"), list)
        and len(obj.get("options", [])) == 4
        and isinstance(obj.get("answer"), int)
        and 0 <= obj["answer"] < 4
    )


def _is_valid_mini_test_item(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and isinstance(obj.get("question"), str)
        and isinstance(obj.get("options"), list)
        and len(obj.get("options", [])) == 4
        and isinstance(obj.get("answer"), int)
        and 0 <= obj["answer"] < 4
        and isinstance(obj.get("explanation"), str)
    )


def _regen_step2_blank(
    client, lang: str, course: str, expressions: list[dict], idx: int,
    prev_item: dict, reason: str, max_retries: int = 2,
) -> dict | None:
    """단일 step2_blank 1문제 재생성. 이전 결과 + 오류 원인을 컨텍스트로 전달."""
    if idx < 0 or idx >= len(expressions):
        return None
    e = expressions[idx]
    expr_line = f'"{e.get("ko","")}" / 상황: {e.get("situation","")}'
    prev = json.dumps(prev_item, ensure_ascii=False)
    prompt = f"""대상 학습자 언어: {lang_name(lang)}
도메인 컨텍스트: {domain_context(course)}

다음 핵심 표현 1개로 "빈칸 채우기" 1문제를 다시 만들어줘.
핵심 표현: {expr_line}

이전 시도(검수에서 오류 판정): {prev}
오류 원인: {reason}

오류 원인을 회피한 새 문항을 출력. 단위명/반의어 대비/문법 호응 규칙 준수.

# 형식
- sentence: 한국어 문장에 ____ 빈칸 1곳
- options: 한국어 3개 (정답 1 + 같은 카테고리 오답 2)
- answer: 정답 인덱스 0~2
- hint: {lang_name(lang)} 로 의미만 1~3 단어

오직 JSON 한 객체만 출력:
{{"sentence":"...","options":["...","...","..."],"answer":1,"hint":"..."}}
"""
    for _ in range(max_retries + 1):
        result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=500)
        if _is_valid_blank_index(result) and len(result.get("options", [])) == 3:
            return result
    return None


def _regen_words_quiz_item(
    client, lang: str, course: str, vocab: list[dict], prev_item: dict,
    reason: str, max_retries: int = 2,
) -> dict | None:
    vocab_text = "\n".join(
        f'- ko="{v.get("ko","")}" / {lang}="{v.get(lang,"")}"' for v in vocab[:8]
    )
    prev = json.dumps(prev_item, ensure_ascii=False)
    prompt = f"""대상 학습자 언어: {lang_name(lang)}
도메인 컨텍스트: {domain_context(course)}

아래 어휘로 어휘 퀴즈 1문제를 다시 만들어줘.
이전 시도(검수에서 오류 판정): {prev}
오류 원인: {reason}

# 형식 (둘 중 자연스러운 쪽)
- type="fill": 빈칸 채우기. question 에 ____ 포함, options 4개 (정답 1 + 같은 도메인 오답 3)
- type="meaning": "~을 무엇이라고 합니까?" 정의형, options 4개

# 절대 금지
- 메타 질문 ("어떤 단어를 쓰나요?")
- 기본형 동사 옵션 (-다)
- 빈칸 어미와 안 맞는 정답

# 공통
- answer: 정답 인덱스 0~3 (0 고정 금지)
- hint: {lang_name(lang)} 로 정답 의미 1~3 단어

어휘:
{vocab_text}

오직 JSON 한 객체만 출력:
{{"type":"fill","question":"...","options":["...","...","...","..."],"answer":2,"hint":"..."}}
"""
    for _ in range(max_retries + 1):
        result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=600)
        if _is_valid_words_quiz_item(result):
            return result
    return None


def _regen_mini_test_item(
    client, lang: str, course: str, content: dict, prev_item: dict,
    reason: str, max_retries: int = 2,
) -> dict | None:
    qtype = prev_item.get("type", "listening")
    topic = content.get("topic_titles", {}).get("ko") or content.get("topic", "")
    prev = json.dumps(prev_item, ensure_ascii=False)
    is_eps = course == "eps"
    type_specific = {
        "listening": (
            "감독관-근로자 실무 대화" if is_eps else "주제 관련 일상 대화"
        ),
        "reading": (
            "작업 지시서 / 안전 표지판 / 사내 안내문"
            if is_eps
            else "안내문 / 표지판 / 메뉴 / 영수증"
        ),
        "situation": (
            "현장 상황 판단" if is_eps else "한 문장 일상 상황 판단"
        ),
    }.get(qtype, "")
    prompt = f"""대상 학습자 언어: {lang_name(lang)}
도메인 컨텍스트: {domain_context(course)}
주제: "{topic}"
유형: {qtype} ({type_specific})

미니 테스트 1문제 ({qtype}) 를 다시 만들어줘.
이전 시도(검수에서 오류 판정): {prev}
오류 원인: {reason}

# 형식
- type 은 "{qtype}" 으로 고정
- listening 은 script, reading 은 text, situation 은 sentence 한국어 필드 포함
- question, options(한국어 4개), answer(0~3), explanation(한국어 전용 — 외국어 단어 절대 금지)

대화/지문 컨텍스트:
{dialogue_summary(content, 8)}

오직 JSON 한 객체만 출력 (type 은 "{qtype}"):
{{"type":"{qtype}","script":"...","question":"...","options":["...","...","...","..."],"answer":2,"explanation":"..."}}
※ reading 일 때는 script 대신 text, situation 일 때는 sentence 필드 사용.
"""
    for _ in range(max_retries + 1):
        result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=900)
        # type 별 필드 키 정규화 검증
        if not _is_valid_mini_test_item(result):
            continue
        if qtype == "listening" and "script" not in result:
            continue
        if qtype == "reading" and "text" not in result:
            continue
        if qtype == "situation" and "sentence" not in result:
            continue
        result["type"] = qtype
        return result
    return None


def audit_and_repair(
    client,
    lang: str,
    course: str,
    content: dict,
    step2_blanks: list[dict],
    words_quiz: list[dict],
    mini_test: list[dict],
    patterns: list[dict],
    max_audit_rounds: int = 2,
) -> tuple[list[dict], list[dict], list[dict], list[dict], dict]:
    """검수 + 재생성 사이클. 갱신된 4개 리스트 + 보고서 반환.

    반환 dict 형식: {"total": N, "passed": P, "regenerated": R, "still_bad": F, "details": [...]}
    """
    topic = content.get("topic_titles", {}).get("ko") or content.get("topic", "")
    expressions = content.get("key_expressions", []) or []
    vocab = content.get("vocabulary", []) or []
    total = len(step2_blanks) + len(words_quiz) + len(mini_test) + len(patterns)

    print(f"  🔍 검수 시작 (총 {total}문항)")

    regenerated_count = 0
    still_bad: list[dict] = []
    details: list[str] = []

    for round_no in range(1, max_audit_rounds + 1):
        # patterns 의 blank_quiz 만 검수 input 으로 추출
        patterns_view = []
        for p in patterns:
            bq = p.get("blank_quiz", {}) or {}
            patterns_view.append({
                "pattern": p.get("pattern", ""),
                "sentence": bq.get("sentence", ""),
                "answer": bq.get("answer", ""),
                "options": bq.get("options", []),
            })
        items = {
            "step2_blanks": step2_blanks,
            "words_quiz": words_quiz,
            "mini_test": mini_test,
            "patterns_blank_quiz": patterns_view,
        }
        errors = _audit_items(client, lang, course, topic, items)
        if not errors:
            if round_no == 1:
                print(f"  🔍 검수 결과: 오류 0건 ✓")
            else:
                print(f"  🔍 재검수 ({round_no}차): 오류 0건 ✓")
            break

        round_label = f"{round_no}차"
        print(f"  🔍 검수 ({round_label}): 오류 {len(errors)}건")
        for e in errors:
            field = e.get("field", "")
            idx = e.get("index", -1)
            reason = e.get("reason", "")
            print(f"     · [{field} #{idx}] {reason}")

        # 오류 항목 재생성
        still_bad = []
        for e in errors:
            field = e.get("field", "")
            idx = e.get("index", -1)
            reason = e.get("reason", "")
            if not isinstance(idx, int):
                still_bad.append(e)
                continue

            if field == "step2_blanks" and 0 <= idx < len(step2_blanks):
                new_item = _regen_step2_blank(
                    client, lang, course, expressions, idx, step2_blanks[idx], reason
                )
                if new_item:
                    step2_blanks[idx] = new_item
                    regenerated_count += 1
                    details.append(f"step2_blanks #{idx} 재생성 ({round_label})")
                    print(f"     ↻ step2_blanks #{idx} 재생성")
                else:
                    still_bad.append(e)

            elif field == "words_quiz" and 0 <= idx < len(words_quiz):
                new_item = _regen_words_quiz_item(
                    client, lang, course, vocab, words_quiz[idx], reason
                )
                if new_item:
                    words_quiz[idx] = new_item
                    regenerated_count += 1
                    details.append(f"words_quiz #{idx} 재생성 ({round_label})")
                    print(f"     ↻ words_quiz #{idx} 재생성")
                else:
                    still_bad.append(e)

            elif field == "mini_test" and 0 <= idx < len(mini_test):
                new_item = _regen_mini_test_item(
                    client, lang, course, content, mini_test[idx], reason
                )
                if new_item:
                    mini_test[idx] = new_item
                    regenerated_count += 1
                    details.append(f"mini_test #{idx} 재생성 ({round_label})")
                    print(f"     ↻ mini_test #{idx} 재생성")
                else:
                    still_bad.append(e)

            elif field == "patterns_blank_quiz" and 0 <= idx < len(patterns):
                gp_for_regen = {
                    "pattern": patterns[idx].get("pattern", ""),
                    "example_ko": (patterns[idx].get("examples") or [""])[0],
                }
                new_quiz = _gen_single_pattern_quiz(
                    client, gp_for_regen, lang, course, topic,
                    _domain_words_for_unit(content),
                )
                if new_quiz:
                    patterns[idx]["blank_quiz"] = new_quiz
                    regenerated_count += 1
                    details.append(f"patterns_blank_quiz #{idx} 재생성 ({round_label})")
                    print(f"     ↻ patterns_blank_quiz #{idx} 재생성")
                else:
                    still_bad.append(e)
            else:
                still_bad.append(e)

        # 재생성 실패한 항목이 0이면 다음 라운드에서 재검수
        # 모두 재생성 실패면 더 이상 수정 불가 → 라운드 종료
        if not still_bad:
            continue
        # still_bad 만 남았다면 더 이상 못 고치므로 break
        if regenerated_count == 0:
            break

    passed = total - len(still_bad)
    if still_bad:
        for e in still_bad:
            print(
                f"  ⚠️  WARNING [{e.get('field','?')} #{e.get('index','?')}] "
                f"재생성 실패: {e.get('reason','')}"
            )

    print(
        f"  ✅ 검수 완료: 통과 {passed} / 재생성 {regenerated_count} / "
        f"실패 {len(still_bad)}"
    )

    return step2_blanks, words_quiz, mini_test, patterns, {
        "total": total,
        "passed": passed,
        "regenerated": regenerated_count,
        "still_bad": len(still_bad),
        "details": details,
    }


# ────────────────────────── 빌드 ──────────────────────────


def build_platform_json(
    content: dict,
    course: str,
    unit_id: str,
    unit_num: int,
    lang: str,
    client,
) -> dict:
    # 콘텐츠팀 JSON 의 lang 번역 필드가 비어있으면 ko → lang 일괄 번역으로 보강
    fill_missing_translations(content, lang, course, client)

    bunny_guids = content.get("bunny_guids", {}).get(lang, {}) or {}
    topic_ko = content.get("topic_titles", {}).get("ko") or content.get("topic", "")
    topic_translation = content.get("topic_titles", {}).get(lang, "")

    # exam_type / level 분리: "TOPIK1" → ("TOPIK1", 1) / "EPS-TOPIK" → ("EPS-TOPIK", 1)
    raw_level = str(content.get("level", "")).upper()
    if "TOPIK1" in raw_level:
        exam_type, level_num = "TOPIK1", 1
    elif "TOPIK2" in raw_level:
        exam_type, level_num = "TOPIK2", 2
    elif "EPS" in raw_level:
        exam_type, level_num = "EPS-TOPIK", 1
    else:
        exam_type, level_num = raw_level or "TOPIK1", 1

    print(f"  → step1_quiz 생성 중...")
    step1_quiz = gen_step1_quiz(client, content, lang)
    print(f"  → step2_blanks 생성 중...")
    step2_blanks = gen_step2_blanks(client, content, lang, course=course)
    step3_sentences = build_step3_sentences(content, lang)
    step4_words = build_step4_words(content, lang)
    print(f"  → step5_review context 번역 중...")
    step5_review = gen_step5_review(client, content, lang)
    print(f"  → words_quiz 생성 중...")
    words_quiz = gen_words_quiz(
        client,
        content,
        lang,
        course=course,
        session_step1=step1_quiz,
        session_step2=step2_blanks,
    )
    print(f"  → patterns + blank_quiz 생성 중...")
    patterns = gen_patterns_with_quiz(client, content, lang, course=course)
    print(f"  → mini_test 생성 중...")
    mini_test = gen_mini_test(client, content, lang, course=course)
    print(f"  → ai_extension 생성 중...")
    ai_extension = gen_ai_extension(client, content, lang)

    # 모든 문항 생성 후 자동 검수 + 재생성 (최대 2 라운드)
    step2_blanks, words_quiz, mini_test, patterns, _audit_report = audit_and_repair(
        client, lang, course, content,
        step2_blanks, words_quiz, mini_test, patterns,
    )

    return {
        "unit_id": unit_id,
        "language": lang,
        "exam_type": exam_type,
        "topic": topic_ko,
        "topic_translation": topic_translation,
        "level": level_num,
        "duration_min": DEFAULT_DURATION_MIN,
        "bunny_library_id": BUNNY_LIBRARY_ID,
        "bunny_video_ids": {
            "step1": bunny_guids.get("step1", ""),
            "step2": bunny_guids.get("step2", ""),
            "step3": bunny_guids.get("step3", ""),
        },
        "is_free": unit_id in FREE_UNIT_IDS,
        "key_expressions": [
            {"ko": e.get("ko", ""), "translation": e.get(lang, "")}
            for e in content.get("key_expressions", [])
        ],
        "session": {
            "step1_quiz": step1_quiz,
            "step2_blanks": step2_blanks,
            "step3_sentences": step3_sentences,
            "step4_words": step4_words,
            "step5_review": step5_review,
        },
        "words": build_words(content, lang),
        "words_quiz": words_quiz,
        "patterns": patterns,
        "mini_test": mini_test,
        "ai_extension": ai_extension,
    }


# ────────────────────────── 진입점 ──────────────────────────


def convert(input_path: Path, requested_langs: list[str]) -> list[Path]:
    content = json.loads(input_path.read_text(encoding="utf-8"))
    unit_code = content.get("unit", "")
    course, unit_id, unit_num = parse_unit_code(unit_code)

    slug = SLUG_MAP.get(unit_code) or slugify_fallback(
        content.get("topic_titles", {}).get("en", "")
    )

    available_langs = content.get("languages", [])
    target_langs = [l for l in requested_langs if l in available_langs] or list(available_langs)

    print(f"\n📦 입력: {input_path.relative_to(PROJECT_ROOT)}")
    print(f"   unit={unit_code} → unit_id={unit_id} / slug={slug}")
    print(f"   가용 언어: {available_langs} / 변환 대상: {target_langs}")

    if not target_langs:
        print("⚠️  변환할 언어가 없습니다.")
        return []

    out_dir = output_dir_for_course(course)
    client = make_client()

    written = []
    for lang in target_langs:
        print(f"\n🌐 [{lang}] 변환 시작 ({lang_name(lang)})")
        result = build_platform_json(content, course, unit_id, unit_num, lang, client)
        out_path = out_dir / f"u{unit_num:02d}_{slug}_{lang}.json"
        out_path.write_text(
            json.dumps(result, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        rel = out_path.relative_to(PROJECT_ROOT)
        print(f"✓ 저장: {rel}")
        written.append(out_path)

    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="콘텐츠팀 JSON → 플랫폼 JSON 변환")
    parser.add_argument(
        "--input",
        required=True,
        help="콘텐츠팀 JSON 경로 (예: data/content_team/topik1/u102_지하철_타기.json)",
    )
    parser.add_argument(
        "--languages",
        default="vi,en,zh",
        help="콤마 구분 변환 언어 (기본: vi,en,zh). 콘텐츠 JSON 의 languages 와 교집합만 변환.",
    )
    args = parser.parse_args()

    load_dotenv(PROJECT_ROOT / ".env.local")

    input_path = Path(args.input)
    if not input_path.is_absolute():
        input_path = (PROJECT_ROOT / input_path).resolve()
    if not input_path.exists():
        print(f"❌ 입력 파일을 찾을 수 없습니다: {input_path}", file=sys.stderr)
        return 1

    langs = [l.strip() for l in args.languages.split(",") if l.strip()]

    try:
        written = convert(input_path, langs)
    except Exception as e:  # noqa: BLE001 — 변환 실패는 사용자에게 보고
        print(f"\n❌ 변환 실패: {e}", file=sys.stderr)
        return 1

    print(f"\n✅ 완료: {len(written)}개 파일 생성")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
