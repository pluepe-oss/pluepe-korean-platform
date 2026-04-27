"""변환된 유닛 JSON의 샘플 추출 + explanation 한국어-only 검증."""
from __future__ import annotations

import io
import json
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def show_quiz(label: str, q: dict) -> None:
    print(f"-- {label}")
    print("type:", q.get("type"))
    print("Q   :", q.get("question"))
    ans = q.get("answer")
    for j, o in enumerate(q.get("options", []) or []):
        marker = "*" if j == ans else " "
        print(f"  {marker}{j + 1}) {o}")
    if q.get("hint"):
        print("hint:", q.get("hint"))


def main(path: str) -> int:
    d = json.load(open(path, encoding="utf-8"))

    print("=== 1) words_quiz (3개) ===")
    for i, q in enumerate(d.get("words_quiz", []) or []):
        show_quiz(f"[{i}]", q)
        print()

    print("=== 2) patterns 전체 (예문 도메인 매칭 검증) ===")
    patterns = d.get("patterns", []) or []
    topic = d.get("topic") or ""
    print(f"본 유닛 주제: {topic}")
    for i, p in enumerate(patterns):
        bq = p.get("blank_quiz", {}) or {}
        print(f"-- patterns[{i}] pattern={p.get('pattern')}")
        print(f"   sentence: {bq.get('sentence')}")
        print(f"   answer  : {bq.get('answer')}")
        print(f"   options : {bq.get('options')}")
        # 폴백 흔적 (placeholder) 검출
        opts = bq.get("options", []) or []
        if any(o.startswith("보기") for o in opts):
            print(f"   ⚠️ 폴백 placeholder 감지")
    print()

    print("=== 3) mini_test[0] ===")
    mts = d.get("mini_test", []) or []
    if mts:
        mt0 = mts[0]
        for k, v in mt0.items():
            print(f"{k}: {v}")
    print()

    print("=== 4) mini_test[0].explanation — 한국어 전용 검증 ===")
    if mts:
        expl = mts[0].get("explanation", "") or ""
        print("explanation:", expl)
        # 한국어/숫자/공백/구두점 외 문자 검출 (베트남어 자모, 태국어, 인니어 라틴, 한자 등)
        suspect = re.findall(r"[A-Za-zÀ-ɏ฀-๿一-鿿]+", expl)
        # 흔한 약어 화이트리스트 (브랜드/시험명)
        WHITELIST = {"TOPIK", "EPS", "AI"}
        flagged = [t for t in suspect if t.upper() not in WHITELIST]
        print("비한국어 단어:", flagged if flagged else "없음 (한국어만 ✓)")
    print()

    print("=== 5) 정답 위치 분포 ===")
    distribution: dict[str, list[int]] = {}
    if d.get("session", {}).get("step1_quiz"):
        s1 = d["session"]["step1_quiz"]
        if isinstance(s1, dict) and isinstance(s1.get("answer"), int):
            distribution["step1_quiz"] = [s1["answer"]]
    s2 = d.get("session", {}).get("step2_blanks", []) or []
    distribution["step2_blanks"] = [
        q.get("answer") for q in s2 if isinstance(q, dict) and isinstance(q.get("answer"), int)
    ]
    distribution["words_quiz"] = [
        q.get("answer") for q in (d.get("words_quiz") or [])
        if isinstance(q, dict) and isinstance(q.get("answer"), int)
    ]
    distribution["mini_test"] = [
        q.get("answer") for q in (d.get("mini_test") or [])
        if isinstance(q, dict) and isinstance(q.get("answer"), int)
    ]
    # patterns blank_quiz: answer 는 텍스트, options 안에서의 인덱스를 계산
    pat_idx: list[int] = []
    for p in d.get("patterns", []) or []:
        bq = p.get("blank_quiz", {}) or {}
        ans, opts = bq.get("answer"), bq.get("options", []) or []
        if isinstance(ans, str) and ans in opts:
            pat_idx.append(opts.index(ans))
    distribution["patterns.blank_quiz"] = pat_idx

    # 모든 인덱스 합산 → 분포 출력 + 연속 동일 번호 검출
    total: list[int] = []
    for label, arr in distribution.items():
        arr_clean = [a for a in arr if a is not None]
        total.extend(arr_clean)
        # 연속 동일 검출
        consec = []
        for i in range(1, len(arr_clean)):
            if arr_clean[i] == arr_clean[i - 1]:
                consec.append(i)
        warn = " ⚠️ 연속 동일" if consec else ""
        print(f"{label}: {arr_clean}{warn}")
    if total:
        from collections import Counter
        c = Counter(total)
        print(f"전체 분포: {dict(sorted(c.items()))} (총 {len(total)}문항)")
        # 한 번호로 절반 이상 집중 시 경고
        max_count = max(c.values())
        if max_count >= len(total) * 0.6:
            print(f"⚠️  특정 번호({c.most_common(1)[0][0]})에 {max_count}/{len(total)}개 집중")
    print()

    print("=== 6) 세션 ↔ 단어 퀴즈 중복 검출 (phrase 5자 이상 연속 일치) ===")
    # 단어 1~2자 토큰 매칭은 false positive 가 많아, 5자 이상 연속 phrase 일치만 의도 중복으로 판정.
    session_texts: list[str] = []
    if d.get("session", {}).get("step1_quiz", {}).get("question"):
        session_texts.append(d["session"]["step1_quiz"]["question"])
    for q in d.get("session", {}).get("step2_blanks", []) or []:
        if q.get("sentence"):
            session_texts.append(q["sentence"])

    def find_phrase_overlap(target: str, sources: list[str], min_len: int = 5) -> list[str]:
        # target 안에 sources 중 하나의 min_len 이상 substring 이 들어있으면 매칭.
        # 빈칸 ____ 은 비교에서 제외 (각 텍스트의 '____' 를 단일 공백으로 치환)
        target_clean = re.sub(r"_{2,}", " ", target)
        hits: list[str] = []
        for src in sources:
            src_clean = re.sub(r"_{2,}", " ", src)
            for i in range(len(src_clean) - min_len + 1):
                phrase = src_clean[i : i + min_len]
                # 한글 비율이 너무 낮으면 noise (조사·구두점만 일치 등)
                if sum(1 for ch in phrase if "가" <= ch <= "힣") < 3:
                    continue
                if phrase in target_clean and phrase not in hits:
                    hits.append(phrase)
        return hits

    overlaps: list[tuple[int, str, list[str]]] = []
    for i, wq in enumerate(d.get("words_quiz", []) or []):
        wq_text = (wq.get("question") or "") + " " + " ".join(wq.get("options") or [])
        hits = find_phrase_overlap(wq_text, session_texts, min_len=5)
        if hits:
            overlaps.append((i, wq.get("question", ""), hits))
    if overlaps:
        for i, q, hits in overlaps:
            print(f"⚠️  words_quiz[{i}] 와 세션 공통 phrase: {hits}")
            print(f"     question: {q}")
    else:
        print("중복 의심 0건 ✓")

    return 0


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "data/eps_topik/u01_work_instruction_vi.json"
    raise SystemExit(main(target))
