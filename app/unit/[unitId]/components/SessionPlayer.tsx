"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import styles from "../unit.module.css";
import type { SessionStepsDone, StepKey, UnitData } from "../types";
import { useQuizStates, optionClass, QuizFooter } from "./quiz-state";

/* ------------------------------------------------------------------ */
/* Player.js SDK 타입 (CDN 로드이므로 런타임에 window.playerjs 로 접근)   */
/* ------------------------------------------------------------------ */

type PlayerJsPlayer = {
  on: (
    event: string,
    callback: (data?: { seconds?: number; duration?: number }) => void,
  ) => void;
  off: (event: string) => void;
};

type PlayerJsGlobal = {
  Player: new (el: HTMLIFrameElement) => PlayerJsPlayer;
};

const PLAYERJS_SRC =
  "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";

/* ------------------------------------------------------------------ */
/* STEP 메타                                                            */
/* ------------------------------------------------------------------ */

const STEP_META: Record<StepKey, { icon: string; label: string }> = {
  1: { icon: "👁", label: "보기" },
  2: { icon: "✏", label: "빈칸" },
  3: { icon: "🔊", label: "말하기" },
  4: { icon: "📖", label: "단어" },
  5: { icon: "✓", label: "복습" },
};

const STEP_NUMS = ["①", "②", "③", "④", "⑤"] as const;

/* ------------------------------------------------------------------ */
/* SessionPlayer                                                        */
/* ------------------------------------------------------------------ */

export default function SessionPlayer({
  unit,
  currentStep: step,
  onStepChange,
  doneSteps,
  quizDoneSteps,
  onVideoWatched,
  onVideoReset,
  onQuizDone,
  devMode,
}: {
  unit: UnitData;
  currentStep: StepKey;
  onStepChange: (n: StepKey) => void;
  doneSteps: SessionStepsDone;
  quizDoneSteps: SessionStepsDone;
  onVideoWatched: (n: StepKey) => void;
  onVideoReset: (n: StepKey) => void;
  onQuizDone: (n: StepKey) => void;
  devMode: boolean;
}) {
  const showVideo = step === 1 || step === 2 || step === 3;
  const currentVideoId =
    unit.session.step_videos?.[String(step)] ?? unit.bunny_video_id;
  const bunnyEmbed = `https://iframe.mediadelivery.net/embed/${unit.bunny_library_id}/${currentVideoId}?autoplay=false&preload=false&t=0&loop=false`;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playerSdkReady, setPlayerSdkReady] = useState(false);

  // Player.js SDK 로드 완료 + 영상 STEP 일 때만 이벤트 구독
  // · ready → ended / timeupdate / seeked 리스너 등록
  // · ended 또는 timeupdate 95% → 영상 시청 완료 알림
  // · seeked → 미완료 STEP 의 영상 시청 상태 초기화 (DEV_MODE 에서는 무시)
  useEffect(() => {
    if (!playerSdkReady || !showVideo) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const pj = (window as unknown as { playerjs?: PlayerJsGlobal }).playerjs;
    if (!pj) return;

    const player = new pj.Player(iframe);

    player.on("ready", () => {
      console.log("[Bunny] Player.js ready — STEP:", step);

      player.on("ended", () => {
        console.log("[Bunny] ended — STEP:", step);
        if ((step === 1 || step === 2 || step === 3) && !doneSteps[step]) {
          onVideoWatched(step);
        }
      });

      player.on("timeupdate", (data) => {
        const seconds =
          typeof data?.seconds === "number" ? data.seconds : NaN;
        const duration =
          typeof data?.duration === "number" ? data.duration : NaN;
        if (!Number.isFinite(duration) || duration <= 0) return;
        if (step !== 1 && step !== 2 && step !== 3) return;
        if (doneSteps[step]) return;
        if (seconds >= duration * 0.95) {
          console.log("[Bunny] 영상 완료 (timeupdate 기반) STEP:", step);
          onVideoWatched(step);
        }
      });

      player.on("seeked", () => {
        if (devMode) return;
        if (step !== 1 && step !== 2 && step !== 3) return;
        if (doneSteps[step]) return;
        console.log("[Bunny] seek 감지 — 영상 완료 초기화 STEP:", step);
        onVideoReset(step);
      });
    });

    return () => {
      try {
        player.off("ready");
        player.off("ended");
        player.off("timeupdate");
        player.off("seeked");
      } catch {
        /* ignore */
      }
    };
  }, [
    playerSdkReady,
    showVideo,
    step,
    doneSteps,
    onVideoWatched,
    onVideoReset,
    devMode,
  ]);

  return (
    <>
      <Script
        src={PLAYERJS_SRC}
        strategy="afterInteractive"
        onReady={() => setPlayerSdkReady(true)}
      />

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
            ref={iframeRef}
            src={bunnyEmbed}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        </div>
      )}

      {step === 1 && (
        <Step1Quiz
          quiz={unit.session.step1_quiz}
          done={quizDoneSteps[1]}
          onDone={() => onQuizDone(1)}
        />
      )}
      {step === 2 && (
        <Step2Blanks
          blanks={unit.session.step2_blanks}
          done={quizDoneSteps[2]}
          onDone={() => onQuizDone(2)}
        />
      )}
      {step === 3 && (
        <Step3Speaking
          sentences={unit.session.step3_sentences}
          done={quizDoneSteps[3]}
          onDone={() => onQuizDone(3)}
        />
      )}
      {step === 4 && (
        <Step4Words
          words={unit.session.step4_words}
          wordsQuiz={unit.words_quiz}
          done={quizDoneSteps[4]}
          onDone={() => onQuizDone(4)}
        />
      )}
      {step === 5 && (
        <Step5Review
          review={unit.session.step5_review}
          done={quizDoneSteps[5]}
          onDone={() => onQuizDone(5)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* STEP 1 — 이해 퀴즈 1문제                                               */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* STEP 2 — 빈칸 3문제                                                   */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* STEP 3 — 따라 말하기                                                  */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* STEP 4 — 단어 카드 + 한국어 기반 퀴즈 3문제 (flip은 완료 조건 아님)      */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* STEP 5 — 상황 기반 복습 3문제 (한국어만)                               */
/* ------------------------------------------------------------------ */

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
