"use client";

import { useEffect, useState } from "react";
import styles from "../unit.module.css";
import type { UnitData } from "../types";
import { optionClass, QuizFooter, useQuizStates } from "./quiz-state";

const TYPE_LABEL: Record<string, string> = {
  listening: "듣기",
  reading: "읽기",
  situation: "상황 이해",
};

export default function TestSection({
  unit,
  onComplete,
}: {
  unit: UnitData;
  onComplete: (score: number, total: number) => void;
}) {
  const { states, pick, check, retry, allCorrect, correctCount } =
    useQuizStates(unit.mini_test.length);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (!notified && allCorrect) {
      onComplete(correctCount, unit.mini_test.length);
      setNotified(true);
    }
  }, [
    allCorrect,
    correctCount,
    notified,
    onComplete,
    unit.mini_test.length,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {unit.mini_test.map((q, qIdx) => {
        const s = states[qIdx];
        let promptNode: React.ReactNode = null;

        if (q.type === "listening") {
          const script = q.script;
          const handleSpeak = () => {
            if (typeof window === "undefined") return;
            const synth = window.speechSynthesis;
            if (!synth) return;
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(script);
            utterance.lang = "ko-KR";
            utterance.rate = 0.9;
            synth.speak(utterance);
          };
          promptNode = (
            <div
              style={{
                padding: "12px 14px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                marginBottom: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={handleSpeak}
                style={{
                  alignSelf: "flex-start",
                  background: "#122c4f",
                  color: "#fff",
                  border: 0,
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🔊 듣기
              </button>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "#0f172a",
                }}
              >
                {script}
              </div>
            </div>
          );
        } else if (q.type === "reading") {
          promptNode = (
            <div
              style={{
                padding: "18px 16px",
                background: "#fff9ed",
                border: "1px solid #fde68a",
                borderRadius: 12,
                marginBottom: 12,
                textAlign: "center",
                fontSize: 22,
                fontWeight: 800,
                color: "#92400e",
              }}
            >
              {q.text}
            </div>
          );
        } else {
          promptNode = <div className={styles.sentenceText}>{q.sentence}</div>;
        }

        return (
          <div key={qIdx} className={styles.interaction}>
            <div className={styles.kicker} style={{ marginBottom: 10 }}>
              {TYPE_LABEL[q.type] ?? q.type}
            </div>
            {promptNode}
            <div className={styles.questionText}>{q.question}</div>
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
            {s.status !== "idle" && (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: "#475569",
                }}
              >
                💡 {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {allCorrect && (
        <div
          style={{
            padding: "18px 20px",
            background: "#122c4f",
            color: "#fff",
            borderRadius: 14,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "#27d3c3", fontWeight: 700 }}>
            결과
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            {correctCount} / {unit.mini_test.length}
          </div>
        </div>
      )}
    </div>
  );
}
