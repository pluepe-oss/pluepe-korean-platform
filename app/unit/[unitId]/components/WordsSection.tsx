"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../unit.module.css";
import type { UnitData } from "../types";
import { optionClass, QuizFooter, useQuizStates } from "./quiz-state";
import { getRandomItems } from "./utils";

// 단어 퀴즈 유형 라벨 — JSON의 `type` 필드 기준으로 표시.
const WORDS_TYPE_LABEL: Record<"situation" | "meaning" | "fill", string> = {
  situation: "💡 상황",
  meaning: "📖 뜻",
  fill: "🗣️ 표현",
};

export default function WordsSection({
  unit,
  onComplete,
}: {
  unit: UnitData;
  onComplete: (score: number, total: number) => void;
}) {
  const [flipped, setFlipped] = useState<boolean[]>(() =>
    unit.words.map(() => false),
  );

  // 단어 퀴즈 전체 풀에서 랜덤 5개 출제
  const quiz = useMemo(() => {
    return getRandomItems(unit.words_quiz, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { states, pick, check, retry, allCorrect, correctCount } =
    useQuizStates(quiz.length);

  const [notified, setNotified] = useState(false);
  // 힌트(베트남어 등)는 문제 풀이 중 숨기고, [확인] 클릭 후에만 노출.
  // 재시도 시 다시 숨김.
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});

  const handleCheck = (qIdx: number, answer: number) => {
    check(qIdx, answer);
    setShowHint((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleRetry = (qIdx: number) => {
    retry(qIdx);
    setShowHint((prev) => ({ ...prev, [qIdx]: false }));
  };

  useEffect(() => {
    if (!notified && allCorrect) {
      onComplete(correctCount, quiz.length);
      setNotified(true);
    }
  }, [allCorrect, correctCount, notified, onComplete, quiz.length]);

  const toggleFlip = (i: number) => {
    setFlipped((prev) => {
      const copy = [...prev];
      copy[i] = !copy[i];
      return copy;
    });
  };

  return (
    <>
      <div className={styles.wordGrid}>
        {unit.words.map((w, i) => (
          <div
            key={i}
            className={`${styles.wordCard} ${
              flipped[i] ? styles.wordCardFlipped : ""
            }`}
            onClick={() => toggleFlip(i)}
          >
            <div className={styles.wordInner}>
              <div className={`${styles.wordFace} ${styles.wordFront}`}>
                <div className={styles.wKo}>{w.korean}</div>
                <div className={styles.wVi}>{w.translation}</div>
              </div>
              <div className={`${styles.wordFace} ${styles.wordBack}`}>
                <div className={styles.wLabel}>EXAMPLE</div>
                <div
                  className={styles.wExample}
                  style={{ fontSize: 15, lineHeight: 1.4 }}
                >
                  {w.example_ko}
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 6,
                      color: "#27d3c3",
                      fontStyle: "italic",
                    }}
                  >
                    {w.example}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {quiz.map((q, qIdx) => {
          const s = states[qIdx];
          // hint / hint_translation / hint_vi 셋 중 존재하는 것을 순서대로 사용.
          const hintText = q.hint ?? q.hint_translation ?? q.hint_vi;
          return (
            <div key={qIdx} className={styles.blankItem}>
              <div className={styles.hintText}>
                {WORDS_TYPE_LABEL[q.type]}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#122c4f",
                  margin: "4px 0 8px",
                  textAlign: "center",
                }}
              >
                {q.question}
              </div>
              <div className={styles.options}>
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={optionClass(i, s, q.answer)}
                    disabled={s.status !== "idle"}
                    onClick={() => pick(qIdx, i)}
                  >
                    {`${["①", "②", "③", "④"][i]} ${opt}`}
                  </button>
                ))}
              </div>
              <QuizFooter
                state={s}
                onCheck={() => handleCheck(qIdx, q.answer)}
                onRetry={() => handleRetry(qIdx)}
              />
              {hintText && showHint[qIdx] && (
                <div
                  className={styles.hintText}
                  style={{ marginTop: 10 }}
                >
                  💬 {hintText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
