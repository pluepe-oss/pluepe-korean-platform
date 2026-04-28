"""변환된 유닛 JSON 파일들에 폴백 placeholder 잔존 여부 검사."""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

PLACEHOLDER_MARKERS = ("보기1", "보기2", "보기3", "보기4", "(콘텐츠 준비 중)")


def check(path: Path) -> list[str]:
    flags: list[str] = []
    d = json.loads(path.read_text(encoding="utf-8"))

    # patterns 의 blank_quiz options
    for i, p in enumerate(d.get("patterns", []) or []):
        opts = (p.get("blank_quiz", {}) or {}).get("options", []) or []
        for o in opts:
            if any(m in str(o) for m in PLACEHOLDER_MARKERS):
                flags.append(f"patterns[{i}].blank_quiz.options 에 폴백: {opts}")
                break
        if not (p.get("blank_quiz", {}) or {}).get("answer"):
            flags.append(f"patterns[{i}].blank_quiz.answer 비어있음")

    # words_quiz
    for i, w in enumerate(d.get("words_quiz", []) or []):
        opts = w.get("options", []) or []
        for o in opts:
            if any(m in str(o) for m in PLACEHOLDER_MARKERS):
                flags.append(f"words_quiz[{i}].options 에 폴백: {opts}")
                break

    # mini_test
    for i, m in enumerate(d.get("mini_test", []) or []):
        if "(콘텐츠 준비 중)" in str(m.get("script", "")):
            flags.append(f"mini_test[{i}].script 폴백 placeholder")

    # step2_blanks
    for i, s in enumerate((d.get("session", {}) or {}).get("step2_blanks", []) or []):
        opts = s.get("options", []) or []
        for o in opts:
            if any(m in str(o) for m in PLACEHOLDER_MARKERS):
                flags.append(f"session.step2_blanks[{i}].options 폴백: {opts}")
                break

    return flags


def main() -> int:
    targets = sys.argv[1:]
    if not targets:
        print("사용법: python _check_fallbacks.py <file1> [file2 ...]")
        return 1

    overall_ok = True
    for t in targets:
        p = Path(t)
        if not p.exists():
            print(f"❌ 파일 없음: {p}")
            overall_ok = False
            continue
        flags = check(p)
        if flags:
            overall_ok = False
            print(f"⚠️  {p.name}")
            for f in flags:
                print(f"     · {f}")
        else:
            print(f"✓ {p.name} (폴백 없음)")
    return 0 if overall_ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
