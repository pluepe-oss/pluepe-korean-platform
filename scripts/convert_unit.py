"""콘텐츠팀 JSON → 플랫폼 JSON 변환 스크립트.

실행:
    python scripts/convert_unit.py --input data/content_team/topik1/u102_지하철_타기.json
    python scripts/convert_unit.py --input ... --languages vi
    python scripts/convert_unit.py --input ... --languages vi,en,zh

ID 변환: u101 → topik1_u01 / u201 → topik2_u01 / u301 → eps_u01
출력 경로: data/topik1/, data/topik2/, data/eps_topik/
파일명: u{번호2자리}_{영문슬러그}_{언어}.json

부족한 필드(퀴즈, 미니테스트 등)는 Claude API(claude-sonnet-4-20250514) 로 자동 생성.
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
MODEL = "claude-sonnet-4-20250514"
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


def translate_batch(client, texts: list[str], lang: str) -> list[str]:
    """ko → lang 일괄 번역. 한 번의 API 호출로 처리. 실패 시 원문 폴백.

    학습 콘텐츠 번역 보강용. 입력 순서와 출력 순서가 1:1 일치해야 한다.
    응답이 길이/타입 검증 실패하면 원문을 그대로 반환해 안전 폴백.
    """
    if not texts:
        return []
    numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(texts))
    prompt = f"""아래 한국어 문장/단어/표현들을 {lang_name(lang)} 로 자연스럽게 번역해줘.
- 학습용 콘텐츠이므로 정확하고 자연스럽게 번역
- 단어 1개만 있는 경우는 사전적 의미 위주로
- 문법 설명문은 동등한 의미의 짧은 표현으로

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


def fill_missing_translations(content: dict, lang: str, client) -> None:
    """key_expressions / vocabulary / grammar_points 의 빈 lang 필드를 일괄 번역하여 채움.

    원본 content 를 in-place 로 갱신한다. 한 번의 API 호출로 처리해 비용 최소화.
    grammar_points[lang] 은 explanation 우선, 없으면 pattern 텍스트를 번역.
    grammar_points[example_{lang}] 은 example_ko 를 번역.
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
    translations = translate_batch(client, texts, lang)
    for (obj, key, ko_src), tr in zip(slots, translations):
        # tr 가 빈 문자열이면 원문(ko_src) 으로 폴백
        obj[key] = tr if tr else ko_src


def dialogue_summary(content: dict, max_lines: int = 8) -> str:
    lines = content.get("dialogue", [])[:max_lines]
    return "\n".join(f"{l.get('role', '')}: {l.get('ko', '')}".strip(": ") for l in lines)


def lang_name(lang: str) -> str:
    return LANGUAGE_NAMES.get(lang, lang)


SYSTEM_BASE = (
    "You are a Korean language curriculum designer. "
    "Output ONLY valid JSON. No commentary, no markdown fences, no preamble."
)


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

오직 다음 JSON 한 객체만 출력:
{{"question": "...", "options": ["...", "...", "..."], "answer": 0}}
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=300)
    if isinstance(result, dict) and "options" in result and "answer" in result:
        return result
    return {
        "question": "이 상황은 어디인가요?",
        "options": [topic or "장소", "다른 곳", "또 다른 곳"],
        "answer": 0,
    }


def gen_step2_blanks(client, content: dict, lang: str) -> list[dict]:
    expressions = content.get("key_expressions", [])[:3]
    expr_text = "\n".join(
        f'- "{e.get("ko", "")}" / {lang}="{e.get(lang, "")}" / 상황: {e.get("situation", "")}'
        for e in expressions
    )
    prompt = f"""대상 학습자 언어: {lang_name(lang)}.
아래 핵심 표현 3개를 사용해 "빈칸 채우기" 퀴즈 3문제를 만들어줘.
- 각 문제는 한국어 문장에서 핵심 단어 한 개를 ____ 로 비운다
- options 는 한국어 단어 3개 (정답 1개 + 그럴듯한 오답 2개)
- hint 는 {lang_name(lang)} 로 정답을 짧게 암시
- answer 는 정답 인덱스 (0~2)

핵심 표현:
{expr_text}

오직 JSON 배열만 출력 (3개 객체):
[{{"sentence": "...", "hint": "...", "options": ["...","...","..."], "answer": 0}}]
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=900)
    if isinstance(result, list) and result:
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


def gen_words_quiz(client, content: dict, lang: str) -> list[dict]:
    vocab = content.get("vocabulary", [])
    vocab_text = "\n".join(
        f'- ko="{v.get("ko", "")}" / {lang}="{v.get(lang, "")}"' for v in vocab[:8]
    )
    prompt = f"""대상 학습자 언어: {lang_name(lang)}.
아래 어휘로 어휘 퀴즈 3문제를 만들어줘.
- type 은 "situation" 2개 + "fill" 1개
- situation: "어떤 상황에서 이 단어를 쓰나요?" 형태 (한국어 question, 한국어 options 4개)
- fill: 빈칸 채우기 (한국어 question + ____ 포함, 한국어 options 4개)
- options 4개 (정답 1 + 오답 3)
- answer 는 정답 인덱스 (0~3)
- hint 는 {lang_name(lang)} 로 정답 암시

어휘:
{vocab_text}

오직 JSON 배열만 출력 (3개 객체):
[{{"type":"situation","question":"...","options":["...","...","...","..."],"answer":0,"hint":"..."}}]
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=900)
    if isinstance(result, list) and result:
        return result[:3]
    return [
        {
            "type": "situation",
            "question": "이 어휘는 어떤 상황에서 쓰나요?",
            "options": ["상황 A", "상황 B", "상황 C", "상황 D"],
            "answer": 0,
            "hint": "",
        }
    ]


def gen_patterns_with_quiz(client, content: dict, lang: str) -> list[dict]:
    """grammar_points → patterns. blank_quiz 는 API 호출."""
    gps = content.get("grammar_points", [])
    if not gps:
        return []

    gp_text = "\n".join(
        f"{i+1}) pattern={gp.get('pattern','')} / 예문 ko={gp.get('example_ko','')}"
        for i, gp in enumerate(gps)
    )
    prompt = f"""대상 학습자 언어: {lang_name(lang)}.
아래 한국어 문법 패턴 각각에 대해 "빈칸 채우기" 퀴즈를 1문제씩 만들어줘.

{gp_text}

각 문제:
- sentence: 패턴이 들어간 한국어 문장 (핵심 단어 한 곳을 ____ 로 비움)
- answer: 정답 한국어 단어
- options: 한국어 단어 4개 (정답 1 + 오답 3)

오직 JSON 배열만 출력 ({len(gps)}개 객체, 위 패턴 순서대로):
[{{"sentence":"...","answer":"...","options":["...","...","...","..."]}}]
"""
    quiz_list = claude_json(client, prompt, SYSTEM_BASE, max_tokens=1200)
    if not isinstance(quiz_list, list):
        quiz_list = []

    out = []
    for i, gp in enumerate(gps):
        examples = [gp.get("example_ko", "")]
        ex_lang = gp.get(f"example_{lang}")
        if ex_lang:
            examples.append(ex_lang)

        quiz = quiz_list[i] if i < len(quiz_list) and isinstance(quiz_list[i], dict) else None
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


def gen_mini_test(client, content: dict, lang: str) -> list[dict]:
    topic = content.get("topic_titles", {}).get("ko") or content.get("topic", "")
    prompt = f"""대상 학습자 언어: {lang_name(lang)}.
한국어 학습 주제: "{topic}".
대화:
{dialogue_summary(content, 8)}

미니 테스트 3문제를 만들어줘. type 은 listening / reading / situation 각 1개씩.

- listening: script(한국어 짧은 대화 1~2줄), question(한국어), options(한국어 4개), answer, explanation(한국어)
- reading: text(한국어 안내문/표지판), question(한국어), options(한국어 4개), answer, explanation(한국어)
- situation: sentence(한국어 한 문장), question(한국어), options(한국어 4개), answer, explanation(한국어)

오직 JSON 배열만 출력 (3개 객체, 위 순서):
[
  {{"type":"listening","script":"...","question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}},
  {{"type":"reading","text":"...","question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}},
  {{"type":"situation","sentence":"...","question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}}
]
"""
    result = claude_json(client, prompt, SYSTEM_BASE, max_tokens=1500)
    if isinstance(result, list) and result:
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
    fill_missing_translations(content, lang, client)

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
    step2_blanks = gen_step2_blanks(client, content, lang)
    step3_sentences = build_step3_sentences(content, lang)
    step4_words = build_step4_words(content, lang)
    print(f"  → step5_review context 번역 중...")
    step5_review = gen_step5_review(client, content, lang)
    print(f"  → words_quiz 생성 중...")
    words_quiz = gen_words_quiz(client, content, lang)
    print(f"  → patterns + blank_quiz 생성 중...")
    patterns = gen_patterns_with_quiz(client, content, lang)
    print(f"  → mini_test 생성 중...")
    mini_test = gen_mini_test(client, content, lang)
    print(f"  → ai_extension 생성 중...")
    ai_extension = gen_ai_extension(client, content, lang)

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
