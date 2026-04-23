"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../unit.module.css";
import type { UnitData } from "../types";
import { optionClass, QuizFooter, useQuizStates } from "./quiz-state";
import { getRandomItems } from "./utils";

const EXTRA_QUIZ_COUNT = 3;

// 실전 퀴즈(patterns_quiz) 유형 라벨 — JSON의 `type` 필드 기준으로 표시.
const EXTRA_TYPE_LABEL: Record<"blank" | "transform" | "situation", string> = {
  blank: "✏️ 빈칸",
  transform: "🔄 변형",
  situation: "💡 상황",
};

/** 영어 POS 라벨을 한국어로 치환 (NOUN → [명사] 등). 한국어 학습 UI에서 영어 노출 방지. */
function localizePattern(s: string): string {
  return s
    .replace(/NOUN/g, "[명사]")
    .replace(/VERB/g, "[동사]")
    .replace(/ADJ/g, "[형용사]");
}

export default function PatternsSection({
  unit,
  onComplete,
}: {
  unit: UnitData;
  onComplete: (score: number, total: number) => void;
}) {
  // patterns_quiz 가 있으면 기존 패턴 섹션 뒤에 랜덤 3개 추가 출제
  const extraQuiz = useMemo(() => {
    if (!unit.patterns_quiz?.length) return [];
    return getRandomItems(unit.patterns_quiz, EXTRA_QUIZ_COUNT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patternsLen = unit.patterns.length;
  const totalCount = patternsLen + extraQuiz.length;

  const { states, pick, check, retry, allCorrect, correctCount } =
    useQuizStates(totalCount);
  const [notified, setNotified] = useState(false);
  // 실전 퀴즈 힌트(베트남어 등)는 문제 풀이 중 숨김. [확인] 클릭 후 노출, 재시도 시 초기화.
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
      onComplete(correctCount, totalCount);
      setNotified(true);
    }
  }, [allCorrect, correctCount, notified, onComplete, totalCount]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {unit.patterns.map((p, pIdx) => {
        const quiz = p.blank_quiz;
        // 공통 포맷: answer 는 문자열(정답 옵션 값). options 에서 index 로 변환해 useQuizStates 에 맞춘다.
        const answerIdx = quiz.options.indexOf(quiz.answer);
        const s = states[pIdx];
        return (
          <div key={pIdx} className={styles.interaction}>
            <div className={styles.kicker} style={{ marginBottom: 10 }}>
              {EXTRA_TYPE_LABEL.blank}
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
              {localizePattern(p.pattern)}
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
              <div className={styles.questionText}>빈칸을 채워 보세요</div>
              <div className={styles.sentenceText}>{quiz.sentence}</div>
              <div className={styles.optionsGrid}>
                {quiz.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${optionClass(i, s, answerIdx)} ${
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
                onCheck={() => check(pIdx, answerIdx)}
                onRetry={() => retry(pIdx)}
              />
            </div>
          </div>
        );
      })}

      {extraQuiz.length > 0 && (
        <>
          <div
            className={styles.kicker}
            style={{
              textAlign: "center",
              marginTop: 8,
              color: "#ff7d5a",
              letterSpacing: 2,
            }}
          >
            실전 퀴즈
          </div>
          {extraQuiz.map((q, eIdx) => {
            const qIdx = patternsLen + eIdx;
            const s = states[qIdx];
            const answerIdx =
              q.type === "blank" ? q.options.indexOf(q.answer) : q.answer;

            let headerNode: React.ReactNode = null;
            if (q.type === "blank") {
              headerNode = (
                <>
                  <div className={styles.questionText}>빈칸을 채워 보세요</div>
                  <div className={styles.sentenceText}>{q.sentence}</div>
                </>
              );
            } else if (q.type === "transform") {
              headerNode = (
                <>
                  <div
                    className={styles.sentenceText}
                    style={{
                      marginBottom: 8,
                      background: "#122c4f",
                      color: "#fff",
                      borderColor: "#122c4f",
                    }}
                  >
                    {localizePattern(q.base_pattern)}
                  </div>
                  <div className={styles.questionText}>{q.question}</div>
                </>
              );
            } else {
              // situation
              headerNode = (
                <>
                  <div
                    style={{
                      padding: "12px 14px",
                      background: "#fff9ed",
                      border: "1px solid #fde68a",
                      borderRadius: 12,
                      marginBottom: 10,
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#92400e",
                      textAlign: "center",
                    }}
                  >
                    💡 {q.context}
                  </div>
                  <div className={styles.questionText}>
                    알맞은 표현을 고르세요
                  </div>
                </>
              );
            }

            // hint / hint_translation 둘 중 존재하는 것을 순서대로 사용.
            const hintText = q.hint ?? q.hint_translation;
            return (
              <div key={`extra-${eIdx}`} className={styles.interaction}>
                <div className={styles.kicker} style={{ marginBottom: 10 }}>
                  {EXTRA_TYPE_LABEL[q.type]}
                </div>
                {headerNode}
                <div className={styles.options}>
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      className={optionClass(i, s, answerIdx)}
                      disabled={s.status !== "idle"}
                      onClick={() => pick(qIdx, i)}
                    >
                      {`${["①", "②", "③", "④"][i]} ${opt}`}
                    </button>
                  ))}
                </div>
                <QuizFooter
                  state={s}
                  onCheck={() => handleCheck(qIdx, answerIdx)}
                  onRetry={() => handleRetry(qIdx)}
                />
                {hintText && showHint[qIdx] && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      color: "#64748b",
                      marginTop: 10,
                    }}
                  >
                    💬 {hintText}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
