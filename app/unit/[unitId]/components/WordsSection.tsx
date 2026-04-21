"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../unit.module.css";
import type { UnitData } from "../types";
import { optionClass, QuizFooter, useQuizStates } from "./quiz-state";

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

  // 8개 단어 퀴즈 중 랜덤 3개
  const quiz = useMemo(() => {
    const shuffled = [...unit.words_quiz].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { states, pick, check, retry, allCorrect, correctCount } =
    useQuizStates(quiz.length);

  const [notified, setNotified] = useState(false);
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
                <div className={styles.wVi}>{w.vietnamese}</div>
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
                    {w.example_vi}
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
          return (
            <div key={qIdx} className={styles.blankItem}>
              <div className={styles.hintText}>문제 {qIdx + 1}</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#122c4f",
                  margin: "4px 0 12px",
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
                onCheck={() => check(qIdx, q.answer)}
                onRetry={() => retry(qIdx)}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
