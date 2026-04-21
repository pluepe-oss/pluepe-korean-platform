"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const INITIAL_COMPLETED: CompletedMap = {
  session: false,
  words: false,
  patterns: false,
  test: false,
  ai: false,
};

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

export default function UnitClient({ unit }: { unit: UnitData }) {
  const router = useRouter();
  const [current, setCurrent] = useState<SectionKey>(
    DEV_MODE ? "ai" : "session",
  );
  const [completed, setCompleted] = useState<CompletedMap>(
    DEV_MODE
      ? { session: true, words: true, patterns: true, test: true, ai: true }
      : INITIAL_COMPLETED,
  );
  const [allDone, setAllDone] = useState(DEV_MODE);

  // session 섹션 내부 STEP 상태 (UnitClient로 lift — 하단 [다음] 버튼이 STEP 이동도 담당)
  const [sessionStep, setSessionStep] = useState<StepKey>(1);
  const [sessionStepsDone, setSessionStepsDone] = useState<SessionStepsDone>(
    DEV_MODE
      ? { 1: true, 2: true, 3: true, 4: true, 5: true }
      : INITIAL_STEPS_DONE,
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

  const markSessionStepDone = useCallback((n: StepKey) => {
    setSessionStepsDone((prev) => (prev[n] ? prev : { ...prev, [n]: true }));
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
    // AI 섹션(마지막): 유닛 완료 → 마이페이지로 이동
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
    // AI 섹션(마지막): 다음 섹션이 아니라 유닛 완료 버튼으로 동작 — ai 완료만 확인
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
          <Link href="/learn" className={styles.railBrand}>
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
            <div className={styles.subtitle}>{unit.topic_vi}</div>

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
                onStepDone={markSessionStepDone}
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
              <AISection unit={unit} onComplete={() => markDone("ai")} />
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
                {current === "ai" ? "유닛 완료 🎉" : "다음 →"}
              </button>
            </div>
          </div>
        </div>

        {allDone && (
          <div className={styles.completeCard}>
            <div className={styles.completeIcon}>✓</div>
            <div className={styles.completeTitle}>
              {unit.topic} 완료 🎉
            </div>
            <div className={styles.completeBtnRow}>
              <button
                type="button"
                className={styles.completeNextOutlineBtn}
                onClick={() => {
                  router.push(`/unit/${unit.unit_number + 1}`);
                }}
              >
                다음 유닛 →
              </button>
              <button
                type="button"
                className={styles.completeNextBtn}
                onClick={() => {
                  router.push("/my");
                }}
              >
                ✓ 유닛 완료
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
