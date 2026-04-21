"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../unit.module.css";
import type { SessionStepsDone, StepKey, UnitData } from "../types";
import { useQuizStates, optionClass, QuizFooter } from "./quiz-state";

const STEP_META: Record<StepKey, { icon: string; label: string }> = {
  1: { icon: "👁", label: "보기" },
  2: { icon: "✏", label: "빈칸" },
  3: { icon: "🔊", label: "말하기" },
  4: { icon: "📖", label: "단어" },
  5: { icon: "✓", label: "복습" },
};

const STEP_NUMS = ["①", "②", "③", "④", "⑤"] as const;

export default function SessionPlayer({
  unit,
  currentStep,
  onStepChange,
  doneSteps,
  onStepDone,
}: {
  unit: UnitData;
  currentStep: StepKey;
  onStepChange: (n: StepKey) => void;
  doneSteps: SessionStepsDone;
  onStepDone: (n: StepKey) => void;
}) {
  const step = currentStep;
  // STEP별 video_id가 있으면 사용, 없으면 unit 기본 bunny_video_id로 fallback
  const currentVideoId =
    unit.session.step_videos?.[String(step)] ?? unit.bunny_video_id;
  const bunnyEmbed = `https://iframe.mediadelivery.net/embed/${unit.bunny_library_id}/${currentVideoId}?autoplay=false&preload=false&t=0&loop=false`;
  const markStepDone = (n: StepKey) => onStepDone(n);
  const showVideo = step === 1 || step === 2 || step === 3;

  // Bunny iframe 영상 종료 이벤트 — 다음 STEP 자동 이동 방지 (멈춤 상태 유지)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === "finish") {
        console.log("영상 종료 — 대기 중");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <>
      <div className={styles.stepTabs}>
        {([1, 2, 3, 4, 5] as StepKey[]).map((n, i) => {
          const meta = STEP_META[n];
          const isDone = doneSteps[n];
          const isCurrent = step === n;
          const cls = [
            styles.stepTab,
            isCurrent ? styles.stepTabCurrent : "",
            !isCurrent && isDone ? styles.stepTabDone : "",
          ]
            .filter(Boolean)
            .join(" ");
          const prefix = isDone ? `✓${STEP_NUMS[i]}` : STEP_NUMS[i];
          return (
            <button
              key={n}
              type="button"
              className={cls}
              onClick={() => onStepChange(n)}
              disabled={!isDone && !isCurrent}
            >
              <span className={styles.stepTabIcon}>{prefix}</span>
              {meta.label}
            </button>
          );
        })}
      </div>

      {showVideo && (
        <div
          className={styles.videoBox}
          style={{ maxWidth: 800, maxHeight: 450, margin: "0 auto 14px" }}
        >
          <iframe
            src={bunnyEmbed}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        </div>
      )}

      {step === 1 && (
        <Step1Quiz
          quiz={unit.session.step1_quiz}
          done={doneSteps[1]}
          onDone={() => markStepDone(1)}
        />
      )}
      {step === 2 && (
        <Step2Blanks
          blanks={unit.session.step2_blanks}
          done={doneSteps[2]}
          onDone={() => markStepDone(2)}
        />
      )}
      {step === 3 && (
        <Step3Speaking
          sentences={unit.session.step3_sentences}
          done={doneSteps[3]}
          onDone={() => markStepDone(3)}
        />
      )}
      {step === 4 && (
        <Step4Words
          words={unit.session.step4_words}
          wordsQuiz={unit.words_quiz}
          done={doneSteps[4]}
          onDone={() => markStepDone(4)}
        />
      )}
      {step === 5 && (
        <Step5Review
          review={unit.session.step5_review}
          done={doneSteps[5]}
          onDone={() => markStepDone(5)}
        />
      )}
    </>
  );
}

/* STEP 1 — 이해 퀴즈 1문제 */
function Step1Quiz({
  quiz,
  done,
  onDone,
}: {
  quiz: UnitData["session"]["step1_quiz"];
  done: boolean;
  onDone: () => void;
}) {
  const { states, pick, check, retry, allCorrect } = useQuizStates(1);
  const s = states[0];

  useEffect(() => {
    if (!done && allCorrect) onDone();
  }, [allCorrect, done, onDone]);

  return (
    <div className={styles.interaction}>
      <div className={styles.questionText}>{quiz.question}</div>
      {quiz.hint_vi && <div className={styles.hintText}>{quiz.hint_vi}</div>}
      <div className={styles.options}>
        {quiz.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={optionClass(i, s, quiz.answer)}
            disabled={s.status !== "idle"}
            onClick={() => pick(0, i)}
          >
            {`${["①", "②", "③", "④"][i]} ${opt}`}
          </button>
        ))}
      </div>
      <QuizFooter
        state={s}
        onCheck={() => check(0, quiz.answer)}
        onRetry={() => retry(0)}
      />
    </div>
  );
}

/* STEP 2 — 빈칸 3문제 */
function Step2Blanks({
  blanks,
  done,
  onDone,
}: {
  blanks: UnitData["session"]["step2_blanks"];
  done: boolean;
  onDone: () => void;
}) {
  const { states, pick, check, retry, allCorrect } = useQuizStates(
    blanks.length,
  );

  useEffect(() => {
    if (!done && allCorrect) onDone();
  }, [allCorrect, done, onDone]);

  return (
    <div className={styles.blanksList}>
      {blanks.map((bl, idx) => {
        const s = states[idx];
        return (
          <div key={idx} className={styles.blankItem}>
            {bl.hint_vi && <div className={styles.hintText}>{bl.hint_vi}</div>}
            <div className={styles.sentenceText}>{bl.sentence}</div>
            <div className={styles.options}>
              {bl.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className={optionClass(i, s, bl.answer)}
                  disabled={s.status !== "idle"}
                  onClick={() => pick(idx, i)}
                >
                  {`${["①", "②", "③", "④"][i]} ${opt}`}
                </button>
              ))}
            </div>
            <QuizFooter
              state={s}
              onCheck={() => check(idx, bl.answer)}
              onRetry={() => retry(idx)}
            />
          </div>
        );
      })}
    </div>
  );
}

/* STEP 3 — 따라 말하기 */
function Step3Speaking({
  sentences,
  done,
  onDone,
}: {
  sentences: UnitData["session"]["step3_sentences"];
  done: boolean;
  onDone: () => void;
}) {
  const [spoken, setSpoken] = useState<boolean[]>(() =>
    sentences.map(() => false),
  );

  useEffect(() => {
    if (!done && spoken.every(Boolean)) onDone();
  }, [spoken, done, onDone]);

  const toggle = (i: number) => {
    setSpoken((prev) => {
      if (prev[i]) return prev;
      const copy = [...prev];
      copy[i] = true;
      return copy;
    });
  };

  const allSpoken = spoken.every(Boolean);

  return (
    <div className={styles.interaction}>
      <div className={styles.speakList}>
        {sentences.map((s, i) => {
          const cls = [styles.speakBtn, spoken[i] ? styles.speakBtnDone : ""]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => toggle(i)}
            >
              <div>
                <div className={styles.speakKorean}>{s.ko}</div>
                <div className={styles.speakViet}>{s.vi}</div>
              </div>
              <div className={styles.speakCheck}>✓</div>
            </button>
          );
        })}
      </div>
      {allSpoken && <div className={styles.speakComplete}>✓</div>}
    </div>
  );
}

/* STEP 4 — 단어 카드 + 한국어 기반 퀴즈 3문제 (flip은 완료 조건 아님) */
function Step4Words({
  words,
  wordsQuiz,
  done,
  onDone,
}: {
  words: UnitData["session"]["step4_words"];
  wordsQuiz: UnitData["words_quiz"];
  done: boolean;
  onDone: () => void;
}) {
  const [flipped, setFlipped] = useState<boolean[]>(() =>
    words.map(() => false),
  );

  // 단어 퀴즈 세트에서 랜덤 3개
  const quiz = useMemo(() => {
    const shuffled = [...wordsQuiz].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { states, pick, check, retry, allCorrect } = useQuizStates(quiz.length);

  useEffect(() => {
    if (!done && allCorrect) onDone();
  }, [allCorrect, done, onDone]);

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
        {words.map((w, i) => (
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
                <div className={styles.wExample}>{w.example}</div>
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

/* STEP 5 — 상황 기반 복습 3문제 (한국어만) */
function Step5Review({
  review,
  done,
  onDone,
}: {
  review: UnitData["session"]["step5_review"];
  done: boolean;
  onDone: () => void;
}) {
  const { states, pick, check, retry, allCorrect } = useQuizStates(
    review.length,
  );

  useEffect(() => {
    if (!done && allCorrect) onDone();
  }, [allCorrect, done, onDone]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {review.map((card, idx) => {
        const s = states[idx];
        return (
          <div key={idx} className={styles.interaction}>
            <div className={styles.kicker} style={{ marginBottom: 10 }}>
              복습 {idx + 1}
            </div>
            <div className={styles.situationCard}>💡 {card.situation}</div>
            <div className={styles.questionText}>
              알맞은 표현을 고르세요.
            </div>
            <div className={styles.options}>
              {card.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className={optionClass(i, s, card.answer)}
                  disabled={s.status !== "idle"}
                  onClick={() => pick(idx, i)}
                >
                  {`${["①", "②", "③", "④"][i]} ${opt}`}
                </button>
              ))}
            </div>
            <QuizFooter
              state={s}
              onCheck={() => check(idx, card.answer)}
              onRetry={() => retry(idx)}
            />
          </div>
        );
      })}
    </div>
  );
}
