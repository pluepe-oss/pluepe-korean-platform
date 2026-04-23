"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../unit.module.css";
import type { UnitData } from "../types";
import { optionClass, QuizFooter, useQuizStates } from "./quiz-state";
import { getRandomItems } from "./utils";

const TYPE_LABEL_BY_KIND: Record<"listening" | "reading" | "situation", string> =
  {
    listening: "듣기",
    reading: "읽기",
    situation: "상황 이해",
  };

// 통합 풀의 공통 형태 (mini_test / listening / reading / situation 모두 수용)
type NormalizedItem = {
  kind: "listening" | "reading" | "situation";
  script?: string;
  audio_tts?: string;
  text?: string;
  sentence?: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
};

const TEST_COUNT = 5;

function kindOf(type: string): "listening" | "reading" | "situation" {
  if (type === "listening" || type.startsWith("listening_")) return "listening";
  if (type === "reading" || type.startsWith("reading_")) return "reading";
  return "situation";
}

export default function TestSection({
  unit,
  onComplete,
}: {
  unit: UnitData;
  onComplete: (score: number, total: number) => void;
}) {
  // mini_test + listening + reading 전체 풀에서 랜덤 N개.
  // listening/reading 필드가 없으면 mini_test 만 풀로 사용 (u02 등 호환).
  const quiz = useMemo<NormalizedItem[]>(() => {
    const pool: NormalizedItem[] = [
      ...unit.mini_test.map<NormalizedItem>((q) => ({
        kind: kindOf(q.type),
        script: "script" in q ? q.script : undefined,
        text: "text" in q ? q.text : undefined,
        sentence: "sentence" in q ? q.sentence : undefined,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      })),
      ...(unit.listening ?? []).map<NormalizedItem>((q) => ({
        kind: "listening",
        script: q.script,
        audio_tts: q.audio_tts,
        question: q.question,
        options: q.options,
        answer: q.answer,
      })),
      ...(unit.reading ?? []).map<NormalizedItem>((q) => ({
        kind: "reading",
        text: q.text,
        question: q.question,
        options: q.options,
        answer: q.answer,
      })),
    ];
    return getRandomItems(pool, TEST_COUNT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { states, pick, check, retry, allCorrect, correctCount } =
    useQuizStates(quiz.length);
  const [notified, setNotified] = useState(false);
  // 듣기 문항 스크립트 공개 여부. 문항별 독립 관리.
  // 확인 버튼을 눌러야 true 가 되고, 재시도(다음 문제로 넘어감) 시 false 로 초기화된다.
  const [showScript, setShowScript] = useState<Record<number, boolean>>({});

  const handleCheck = (qIdx: number, answer: number) => {
    check(qIdx, answer);
    setShowScript((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleRetry = (qIdx: number) => {
    retry(qIdx);
    setShowScript((prev) => ({ ...prev, [qIdx]: false }));
  };

  useEffect(() => {
    if (!notified && allCorrect) {
      onComplete(correctCount, quiz.length);
      setNotified(true);
    }
  }, [allCorrect, correctCount, notified, onComplete, quiz.length]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {quiz.map((q, qIdx) => {
        const s = states[qIdx];
        let promptNode: React.ReactNode = null;

        if (q.kind === "listening") {
          // 문제 풀이 중에는 스크립트 숨김 → [확인] 클릭 후 노출.
          // audio_tts 우선, 없으면 script 를 브라우저 TTS 로 재생.
          const ttsText = q.audio_tts ?? q.script ?? "";
          const handleSpeak = () => {
            if (typeof window === "undefined") return;
            const synth = window.speechSynthesis;
            if (!synth) return;
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(ttsText);
            utterance.lang = "ko-KR";
            utterance.rate = 0.9;
            synth.speak(utterance);
          };
          const revealed = !!showScript[qIdx] && !!q.script;
          promptNode = (
            <div
              style={{
                padding: "16px 14px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                marginBottom: 12,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "stretch",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={handleSpeak}
                  style={{
                    background: "#122c4f",
                    color: "#fff",
                    border: 0,
                    borderRadius: 999,
                    padding: "10px 22px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🔊 듣기
                </button>
              </div>
              {revealed && (
                <div
                  style={{
                    padding: "10px 12px",
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: 10,
                    whiteSpace: "pre-wrap",
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "#0f172a",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      marginBottom: 4,
                    }}
                  >
                    스크립트
                  </div>
                  {q.script}
                </div>
              )}
            </div>
          );
        } else if (q.kind === "reading") {
          promptNode = (
            <div
              style={{
                padding: "18px 16px",
                background: "#fff9ed",
                border: "1px solid #fde68a",
                borderRadius: 12,
                marginBottom: 12,
                textAlign: "center",
                whiteSpace: "pre-wrap",
                fontSize: 22,
                fontWeight: 800,
                color: "#92400e",
              }}
            >
              {q.text}
            </div>
          );
        } else {
          promptNode = (
            <div className={styles.sentenceText}>{q.sentence}</div>
          );
        }

        return (
          <div key={qIdx} className={styles.interaction}>
            <div className={styles.kicker} style={{ marginBottom: 10 }}>
              {TYPE_LABEL_BY_KIND[q.kind]}
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
              onCheck={() => handleCheck(qIdx, q.answer)}
              onRetry={() => handleRetry(qIdx)}
            />
            {s.status !== "idle" && q.explanation && (
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
            {correctCount} / {quiz.length}
          </div>
        </div>
      )}
    </div>
  );
}
