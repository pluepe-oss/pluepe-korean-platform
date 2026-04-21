"use client";

import { useEffect, useState } from "react";
import styles from "../unit.module.css";
import type { UnitData } from "../types";
import { optionClass, QuizFooter, useQuizStates } from "./quiz-state";

export default function PatternsSection({
  unit,
  onComplete,
}: {
  unit: UnitData;
  onComplete: (score: number, total: number) => void;
}) {
  const { states, pick, check, retry, allCorrect, correctCount } =
    useQuizStates(unit.patterns.length);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (!notified && allCorrect) {
      onComplete(correctCount, unit.patterns.length);
      setNotified(true);
    }
  }, [
    allCorrect,
    correctCount,
    notified,
    onComplete,
    unit.patterns.length,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {unit.patterns.map((p, pIdx) => {
        const quiz = p.blank_quiz;
        const s = states[pIdx];
        return (
          <div key={pIdx} className={styles.interaction}>
            <div className={styles.kicker} style={{ marginBottom: 10 }}>
              표현 {pIdx + 1}
            </div>
            <div
              className={styles.sentenceText}
              style={{
                marginBottom: 8,
                background: "#122c4f",
                color: "#fff",
                borderColor: "#122c4f",
              }}
            >
              {p.pattern}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                margin: "14px 0 16px",
              }}
            >
              {p.examples.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    fontSize: 15,
                    color: "#0f172a",
                    fontWeight: 600,
                  }}
                >
                  {ex}
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: "1px dashed #e2e8f0",
                paddingTop: 14,
              }}
            >
              {p.situation && (
                <div className={styles.situationCard}>💡 {p.situation}</div>
              )}
              <div className={styles.questionText}>빈칸을 채워 보세요</div>
              <div className={styles.sentenceText}>{quiz.sentence}</div>
              <div className={styles.optionsGrid}>
                {quiz.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${optionClass(i, s, quiz.answer)} ${
                      styles.optionCenter
                    }`}
                    disabled={s.status !== "idle"}
                    onClick={() => pick(pIdx, i)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <QuizFooter
                state={s}
                onCheck={() => check(pIdx, quiz.answer)}
                onRetry={() => retry(pIdx)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
