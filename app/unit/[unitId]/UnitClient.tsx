"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./unit.module.css";
import {
  SECTION_LABEL,
  SECTION_ORDER,
  type SectionKey,
  type SessionStepsDone,
  type StepKey,
  type UnitData,
} from "./types";
import SessionPlayer from "./components/SessionPlayer";
import WordsSection from "./components/WordsSection";
import PatternsSection from "./components/PatternsSection";
import TestSection from "./components/TestSection";
import AISection from "./components/AISection";

/**
 * ⚠ 개발용 플래그 — 배포 전 반드시 `false`로 변경.
 * true일 때: 5섹션 모두 완료 + AI 탭으로 시작 + 모든 탭 자유 이동 + 완료 배너 즉시 표시.
 */
const DEV_MODE = false;

type CompletedMap = Record<SectionKey, boolean>;

/** 사이드 레일 각 메뉴의 서브 텍스트 */
const SECTION_SUB: Record<SectionKey, string> = {
  session: "오늘의 훈련",
  words: "어휘 복습",
  patterns: "핵심 문장",
  test: "실력 점검",
  ai: "자유 연습",
};

const INITIAL_STEPS_DONE: SessionStepsDone = {
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
};

async function postProgress(
  unitId: string,
  section: SectionKey,
  extra?: { score?: number; total?: number },
) {
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitId,
        section,
        score: extra?.score,
        total: extra?.total,
      }),
    });
  } catch {
    // 로그인 없이 로컬에서도 체험 가능하도록 에러는 무시
  }
}

// URL ?section=... 값이 유효한 SectionKey 인지 확인하는 타입 가드
function isSectionKey(v: string | null): v is SectionKey {
  return !!v && (SECTION_ORDER as string[]).includes(v);
}

export default function UnitClient({
  unit,
  initialCompleted = {},
  planTier = null,
  accountKind = "b2c_active",
}: {
  unit: UnitData;
  /** 서버에서 user_progress 로 조회한 섹션별 완료 상태 */
  initialCompleted?: Record<string, boolean>;
  /** 구독 등급 — Basic/Premium 콘텐츠 분기 (AISection 등에서 활용) */
  planTier?: "basic" | "premium" | null;
  /** 학습 완료 화면 분기 (trial 한계, 마지막 주제 등) */
  accountKind?: "b2b" | "b2c_active" | "trialing" | "expired" | "none";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 서버에서 온 initialCompleted 를 SectionKey 별 boolean 맵으로 정규화
  const restoredCompleted = useMemo<CompletedMap>(() => {
    if (DEV_MODE) {
      return { session: true, words: true, patterns: true, test: true, ai: true };
    }
    return {
      session: Boolean(initialCompleted.session),
      words: Boolean(initialCompleted.words),
      patterns: Boolean(initialCompleted.patterns),
      test: Boolean(initialCompleted.test),
      ai: Boolean(initialCompleted.ai),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 초기 탭 결정: DEV_MODE > URL ?section=... (잠금 해제된 경우만) > session
  const initialSection = useMemo<SectionKey>(() => {
    if (DEV_MODE) return "ai";
    const requested = searchParams.get("section");
    if (!isSectionKey(requested)) return "session";
    const idx = SECTION_ORDER.indexOf(requested);
    if (idx === 0) return requested;
    // 이전 섹션이 복원된 완료 상태여야 잠금 해제
    const prev = SECTION_ORDER[idx - 1];
    if (restoredCompleted[prev]) return requested;
    return "session";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [current, setCurrent] = useState<SectionKey>(initialSection);
  const [completed, setCompleted] = useState<CompletedMap>(restoredCompleted);
  const [allDone, setAllDone] = useState(() =>
    SECTION_ORDER.every((k) => restoredCompleted[k]),
  );

  // session 섹션 내부 STEP 상태 (UnitClient로 lift — 하단 [다음] 버튼이 STEP 이동도 담당)
  const [sessionStep, setSessionStep] = useState<StepKey>(1);
  // STEP 완료 조건 정책: STEP 1~3 은 영상 AND 퀴즈 둘 다, STEP 4~5 는 퀴즈만.
  // session 섹션이 이미 완료 상태로 복원됐으면 STEP 1~5 모두 true 로 시작.
  const initialStepsDone: SessionStepsDone = restoredCompleted.session
    ? { 1: true, 2: true, 3: true, 4: true, 5: true }
    : INITIAL_STEPS_DONE;
  const [videoWatched, setVideoWatched] =
    useState<SessionStepsDone>(initialStepsDone);
  const [quizDone, setQuizDone] = useState<SessionStepsDone>(initialStepsDone);
  const sessionStepsDone = useMemo<SessionStepsDone>(
    () => ({
      1: videoWatched[1] && quizDone[1],
      2: videoWatched[2] && quizDone[2],
      3: videoWatched[3] && quizDone[3],
      4: quizDone[4],
      5: quizDone[5],
    }),
    [videoWatched, quizDone],
  );

  const markDone = useCallback(
    (section: SectionKey, extra?: { score?: number; total?: number }) => {
      setCompleted((prev) => {
        if (prev[section]) return prev;
        const next = { ...prev, [section]: true };
        if (SECTION_ORDER.every((k) => next[k])) setAllDone(true);
        return next;
      });
      void postProgress(unit.unit_id, section, extra);
    },
    [unit.unit_id],
  );

  const markVideoWatched = useCallback((n: StepKey) => {
    setVideoWatched((prev) => (prev[n] ? prev : { ...prev, [n]: true }));
  }, []);
  const markVideoReset = useCallback((n: StepKey) => {
    setVideoWatched((prev) => (prev[n] ? { ...prev, [n]: false } : prev));
  }, []);
  const markQuizDone = useCallback((n: StepKey) => {
    setQuizDone((prev) => (prev[n] ? prev : { ...prev, [n]: true }));
  }, []);

  // grid 2열 레이아웃에서 smooth scroll이 re-render에 의해 cancel되는 이슈를
  // 즉시 이동(instant) + DOM scrollTop 직접 할당으로 우회
  const mainColRef = useRef<HTMLDivElement>(null);

  const scrollTop = useCallback(() => {
    if (typeof window === "undefined") return;
    // 즉시 이동 (가장 강력한 fallback)
    try {
      window.scrollTo(0, 0);
    } catch {
      /* ignore */
    }
    try {
      document.documentElement.scrollTop = 0;
    } catch {
      /* ignore */
    }
    try {
      document.body.scrollTop = 0;
    } catch {
      /* ignore */
    }
    // ref 방식도 한 번 시도 (기타 scroll root 환경 대비)
    try {
      mainColRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    } catch {
      /* ignore */
    }
  }, []);

  const handleSetCurrent = (key: SectionKey) => {
    scrollTop();
    setCurrent(key);
  };

  const handleSetSessionStep = useCallback(
    (n: StepKey) => {
      scrollTop();
      setSessionStep(n);
    },
    [scrollTop],
  );

  // state 변경 후 re-render 직후에도 한 번 더 보정 — 일부 환경에서
  // 이벤트 핸들러 안의 scrollTo가 re-render로 무효화되는 현상 방어
  useEffect(() => {
    scrollTop();
  }, [current, sessionStep, scrollTop]);

  // 5개 STEP 모두 완료 시 session 섹션 완료로 표시
  useEffect(() => {
    const allStepsDone = ([1, 2, 3, 4, 5] as StepKey[]).every(
      (n) => sessionStepsDone[n],
    );
    if (allStepsDone && !completed.session) {
      markDone("session");
    }
  }, [sessionStepsDone, completed.session, markDone]);

  const progressPercent = useMemo(() => {
    const done = SECTION_ORDER.filter((k) => completed[k]).length;
    return Math.round((done / SECTION_ORDER.length) * 100);
  }, [completed]);

  // 섹션 탭 잠금: 이전 섹션 완료 전까지 잠금
  const isLocked = useCallback(
    (key: SectionKey): boolean => {
      const idx = SECTION_ORDER.indexOf(key);
      if (idx === 0) return false;
      return !completed[SECTION_ORDER[idx - 1]];
    },
    [completed],
  );

  const currentIdx = SECTION_ORDER.indexOf(current);

  const goNext = () => {
    // session 섹션: STEP 1~4는 STEP 이동, STEP 5 이후엔 다음 섹션
    if (current === "session" && sessionStep < 5) {
      scrollTop();
      setSessionStep((prev) => (prev + 1) as StepKey);
      return;
    }
    // AI 섹션(마지막): 주제 완료 → 마이페이지로 이동
    if (current === "ai") {
      if (completed.ai) {
        router.push("/my");
      }
      return;
    }
    // 그 외 섹션(또는 session STEP 5): 다음 섹션으로
    if (
      currentIdx < SECTION_ORDER.length - 1 &&
      completed[current] &&
      !isLocked(SECTION_ORDER[currentIdx + 1])
    ) {
      scrollTop();
      setCurrent(SECTION_ORDER[currentIdx + 1]);
    }
  };

  // 하단 [다음] 활성 조건
  const canGoNext = useMemo(() => {
    if (DEV_MODE) return true;
    if (current === "session") {
      if (sessionStep < 5) return sessionStepsDone[sessionStep];
      return (
        sessionStepsDone[5] &&
        currentIdx < SECTION_ORDER.length - 1 &&
        !isLocked(SECTION_ORDER[currentIdx + 1])
      );
    }
    // AI 섹션(마지막): 다음 섹션이 아니라 주제 완료 버튼으로 동작 — ai 완료만 확인
    if (current === "ai") {
      return completed.ai;
    }
    return (
      completed[current] &&
      currentIdx < SECTION_ORDER.length - 1 &&
      !isLocked(SECTION_ORDER[currentIdx + 1])
    );
  }, [
    current,
    sessionStep,
    sessionStepsDone,
    completed,
    currentIdx,
    isLocked,
  ]);

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        {/* 좌측 사이드 레일 */}
        <aside className={styles.rail}>
          <Link href="/my" className={styles.railBrand}>
            pluepe
          </Link>
          <div className={styles.railBrandSub}>
            TOPIK {unit.level} · {unit.topic}
          </div>
          <div className={styles.railLabel}>학습 메뉴</div>
          <nav className={styles.railNav}>
            {SECTION_ORDER.map((key, idx) => {
              const isCurrent = key === current;
              const isDone = completed[key];
              const locked = isLocked(key);
              const cls = [
                styles.railItem,
                isCurrent ? styles.railItemCurrent : "",
                !isCurrent && isDone ? styles.railItemDone : "",
                !isCurrent && !isDone && locked ? styles.railItemLocked : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={key}
                  type="button"
                  className={cls}
                  disabled={locked}
                  aria-disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    handleSetCurrent(key);
                  }}
                >
                  <div className={styles.railNum}>
                    {!isCurrent && isDone ? "✓" : idx + 1}
                  </div>
                  <div>
                    <div className={styles.railText}>
                      {SECTION_LABEL[key].ko}
                    </div>
                    <div className={styles.railTextSub}>
                      {SECTION_SUB[key]}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* 메인 영역 */}
        <div className={styles.mainCol} ref={mainColRef}>
        {/* 모바일(720px 이하) 전용 현재 섹션 바 + 이전/다음 이동 */}
        <div className={styles.mobileSectionBar}>
          <button
            type="button"
            className={styles.mobileNavBtn}
            onClick={() => {
              if (currentIdx > 0) {
                const prev = SECTION_ORDER[currentIdx - 1];
                if (!isLocked(prev)) handleSetCurrent(prev);
              }
            }}
            disabled={
              currentIdx === 0 ||
              isLocked(SECTION_ORDER[currentIdx - 1])
            }
            aria-label="이전 섹션"
          >
            ‹
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className={styles.mobileNum}>{currentIdx + 1}</span>
            {SECTION_LABEL[current].ko} · {SECTION_SUB[current]}
          </div>

          <button
            type="button"
            className={styles.mobileNavBtn}
            onClick={() => {
              if (currentIdx < SECTION_ORDER.length - 1) {
                const next = SECTION_ORDER[currentIdx + 1];
                if (!isLocked(next)) handleSetCurrent(next);
              }
            }}
            disabled={
              currentIdx === SECTION_ORDER.length - 1 ||
              isLocked(SECTION_ORDER[currentIdx + 1])
            }
            aria-label="다음 섹션"
          >
            ›
          </button>
        </div>
        <div className={styles.player}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{unit.topic}</h1>
              <div className={styles.currentMiniCard}>
                <span className={styles.miniNum}>
                  {SECTION_ORDER.indexOf(current) + 1}
                </span>
                <span className={styles.miniText}>
                  {SECTION_LABEL[current].ko}
                  <small>{SECTION_SUB[current]}</small>
                </span>
              </div>
            </div>
            <div className={styles.subtitle}>{unit.topic_translation}</div>

            <div className={styles.progressRow}>
              <div className={styles.progressText}>
                {progressPercent}% ·{" "}
                {SECTION_ORDER.filter((k) => completed[k]).length} /{" "}
                {SECTION_ORDER.length}
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className={styles.stage}>
            {/* ai 섹션만 stageTitle 유지, 나머지는 모두 제거 */}
            {current === "ai" && (
              <h2 className={styles.stageTitle} style={{ marginBottom: 10 }}>
                AI와 상황 확장
              </h2>
            )}

            {current === "session" && (
              <SessionPlayer
                unit={unit}
                currentStep={sessionStep}
                onStepChange={handleSetSessionStep}
                doneSteps={sessionStepsDone}
                quizDoneSteps={quizDone}
                onVideoWatched={markVideoWatched}
                onVideoReset={markVideoReset}
                onQuizDone={markQuizDone}
                devMode={DEV_MODE}
              />
            )}
            {current === "words" && (
              <WordsSection
                unit={unit}
                onComplete={(score, total) =>
                  markDone("words", { score, total })
                }
              />
            )}
            {current === "patterns" && (
              <PatternsSection
                unit={unit}
                onComplete={(score, total) =>
                  markDone("patterns", { score, total })
                }
              />
            )}
            {current === "test" && (
              <TestSection
                unit={unit}
                onComplete={(score, total) =>
                  markDone("test", { score, total })
                }
              />
            )}
            {current === "ai" && (
              <AISection
                unit={unit}
                onComplete={() => markDone("ai")}
                planTier={planTier}
                accountKind={accountKind}
              />
            )}
          </div>

          <div className={styles.footerNav}>
            <div style={{ flex: 1 }} />
            <div className={styles.footerBtns}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnNext}`}
                onClick={goNext}
                disabled={!canGoNext}
              >
                {current === "ai" ? "주제 완료 🎉" : "다음 →"}
              </button>
            </div>
          </div>
        </div>

        {allDone && (() => {
          // 작업 7: 학습 완료 화면 — 다음 행동 분기
          // TOPIK 1 = 15 주제이지만 13~15 는 "준비 중" 영구 잠금 → 학습 가능 마지막은 12
          const TOPIK1_AVAILABLE_MAX = 12;
          const TRIAL_MAX = 2;
          const currentNum = unit.unit_number;
          const trialLimitReached =
            accountKind === "trialing" && currentNum >= TRIAL_MAX;
          const isLastUnit = currentNum >= TOPIK1_AVAILABLE_MAX;

          const primary = trialLimitReached
            ? { label: "구독하고 계속하기 →", href: "/pricing" }
            : isLastUnit
              ? { label: "마이페이지로 →", href: "/my" }
              : {
                  label: `주제 ${currentNum + 1} 시작 →`,
                  href: `/unit/${currentNum + 1}`,
                };

          return (
            <div
              style={{
                background: "#ffffff",
                borderRadius: 22,
                padding: "32px 24px",
                boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
                marginTop: 24,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>🎉</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 4,
                }}
              >
                학습 완료!
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  marginBottom: 8,
                }}
              >
                주제 {currentNum}. {unit.topic}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  marginBottom: 24,
                }}
              >
                5단계 모두 완료했어요
              </div>

              {/* Primary orange CTA — 화면 유일 orange */}
              <button
                type="button"
                onClick={() => router.push(primary.href)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ff7d5a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 32px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 16,
                  fontFamily: "inherit",
                }}
              >
                {primary.label}
              </button>

              {/* Secondary 2개 버튼 */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCurrent("session");
                    setAllDone(false);
                  }}
                  style={{
                    background: "#ffffff",
                    color: "#122c4f",
                    border: "1.5px solid #122c4f",
                    borderRadius: 12,
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  한번 더 복습
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/my")}
                  style={{
                    background: "#ffffff",
                    color: "#122c4f",
                    border: "1.5px solid #122c4f",
                    borderRadius: 12,
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  마이페이지로
                </button>
              </div>
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
