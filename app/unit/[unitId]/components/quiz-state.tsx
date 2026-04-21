"use client";

import { useState } from "react";
import styles from "../unit.module.css";

export type QStatus = "idle" | "wrong" | "correct";
export type QState = { picked: number | null; status: QStatus };

const initial: QState = { picked: null, status: "idle" };

export function useQuizStates(count: number) {
  const [states, setStates] = useState<QState[]>(() =>
    Array.from({ length: count }, () => ({ ...initial })),
  );

  const pick = (idx: number, optIdx: number) => {
    setStates((prev) => {
      if (prev[idx].status !== "idle") return prev;
      const copy = [...prev];
      copy[idx] = { picked: optIdx, status: "idle" };
      return copy;
    });
  };

  const check = (idx: number, answer: number) => {
    setStates((prev) => {
      const s = prev[idx];
      if (s.picked === null || s.status !== "idle") return prev;
      const copy = [...prev];
      copy[idx] = {
        picked: s.picked,
        status: s.picked === answer ? "correct" : "wrong",
      };
      return copy;
    });
  };

  const retry = (idx: number) => {
    setStates((prev) => {
      const copy = [...prev];
      copy[idx] = { picked: null, status: "idle" };
      return copy;
    });
  };

  const allCorrect = states.length > 0 && states.every((s) => s.status === "correct");
  const correctCount = states.filter((s) => s.status === "correct").length;

  return { states, pick, check, retry, allCorrect, correctCount };
}

/** 옵션 버튼 CSS 클래스 계산 (상태 기반) */
export function optionClass(
  i: number,
  state: QState,
  answer: number,
): string {
  const cls = [styles.option];
  if (state.status === "idle") {
    if (state.picked === i) cls.push(styles.optionPicked);
  } else if (state.status === "wrong") {
    if (i === answer) cls.push(styles.optionCorrect);
    else if (i === state.picked) cls.push(styles.optionWrong);
  } else if (state.status === "correct") {
    if (i === answer) cls.push(styles.optionCorrect);
  }
  return cls.join(" ");
}

/** 각 문제의 하단 [확인] / [다시 시도] / (정답 피드백) */
export function QuizFooter({
  state,
  onCheck,
  onRetry,
}: {
  state: QState;
  onCheck: () => void;
  onRetry: () => void;
}) {
  if (state.status === "idle") {
    return (
      <button
        type="button"
        className={styles.submitBtn}
        disabled={state.picked === null}
        onClick={onCheck}
      >
        확인
      </button>
    );
  }
  if (state.status === "wrong") {
    return (
      <>
        <div className={`${styles.feedback} ${styles.feedbackNg}`}>✗</div>
        <button
          type="button"
          className={styles.retryBtn}
          onClick={onRetry}
        >
          🔄 다시 시도
        </button>
      </>
    );
  }
  return <div className={`${styles.feedback} ${styles.feedbackOk}`}>✓</div>;
}
