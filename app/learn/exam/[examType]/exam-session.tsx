"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SECTION_LABEL,
  categoryLabel,
  type ExamInfo,
  type ExamType,
} from "../_exam-config";

type Section = "listening" | "reading";

type Option = { num: number; text: string };

type Question = {
  id: string;
  exam_type: string;
  section: Section;
  question_number: number;
  question_text: string;
  passage: string | null;
  audio_url: string | null;
  image_url: string | null;
  options: Option[];
  category: string | null;
  difficulty: number | null;
  is_free: boolean;
};

type Phase = "intro" | "exam" | "submitting";

type Props = {
  examType: ExamType;
  config: ExamInfo;
  isSubscribed: boolean;
  visibleCount: number;
  sectionCounts: Record<Section, number>;
  lockedPaidCount: number;
};

function formatMMSS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function ExamSession({
  examType,
  config,
  isSubscribed,
  visibleCount,
  sectionCounts,
  lockedPaidCount,
}: Props) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("intro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentSec, setCurrentSec] = useState<Section>("reading");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { listeningQs, readingQs, sectionsWithQuestions } = useMemo(() => {
    const listening = questions.filter((q) => q.section === "listening");
    const reading = questions.filter((q) => q.section === "reading");
    const secs: Section[] = [];
    if (listening.length > 0) secs.push("listening");
    if (reading.length > 0) secs.push("reading");
    return {
      listeningQs: listening,
      readingQs: reading,
      sectionsWithQuestions: secs,
    };
  }, [questions]);

  const currentSectionQs =
    currentSec === "listening" ? listeningQs : readingQs;
  const currentQ = currentSectionQs[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const listeningAnswered = listeningQs.filter((q) => q.id in answers).length;
  const readingAnswered = readingQs.filter((q) => q.id in answers).length;

  const isLastSection =
    sectionsWithQuestions.length > 0 &&
    currentSec === sectionsWithQuestions[sectionsWithQuestions.length - 1];
  const isLastInSection = currentIdx === currentSectionQs.length - 1;
  const isLastQuestion = isLastSection && isLastInSection;
  const isFirstSection =
    sectionsWithQuestions.length > 0 && currentSec === sectionsWithQuestions[0];
  const isFirstQuestion = isFirstSection && currentIdx === 0;

  const submitRef = useRef<(auto?: boolean) => void>(() => {});

  async function startExam() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/exam/questions?examType=${examType}`, {
        cache: "no-store",
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data.error || "문제를 불러오지 못했습니다.");
      }
      const qs = (data.questions ?? []) as Question[];
      if (qs.length === 0) {
        throw new Error("풀 수 있는 문제가 없습니다.");
      }
      setQuestions(qs);
      const firstSec: Section = qs.some((q) => q.section === "listening")
        ? "listening"
        : "reading";
      setCurrentSec(firstSec);
      setCurrentIdx(0);
      setAnswers({});
      setTimeLeft(config.timeLimitMinutes * 60);
      setStartTime(Date.now());
      setPhase("exam");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  async function submit(auto = false) {
    if (phase === "submitting") return;
    setShowSubmitModal(false);
    setPhase("submitting");
    setError(null);
    const timeTakenSeconds = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;
    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, answers, timeTakenSeconds }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data.error || "제출에 실패했습니다.");
      }
      router.replace(`/learn/exam/result/${data.resultId}`);
    } catch (e) {
      setError(
        (auto ? "자동 제출 실패: " : "") +
          (e instanceof Error ? e.message : "알 수 없는 오류"),
      );
      setPhase("exam");
    }
  }

  submitRef.current = submit;

  useEffect(() => {
    if (phase !== "exam") return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          submitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  function pick(questionId: string, num: number) {
    setAnswers((a) => ({ ...a, [questionId]: num }));
  }

  function goPrev() {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      return;
    }
    const curIdxInSecs = sectionsWithQuestions.indexOf(currentSec);
    if (curIdxInSecs > 0) {
      const prevSec = sectionsWithQuestions[curIdxInSecs - 1];
      setCurrentSec(prevSec);
      const prevLen =
        prevSec === "listening" ? listeningQs.length : readingQs.length;
      setCurrentIdx(Math.max(0, prevLen - 1));
    }
  }

  function goNext() {
    if (currentIdx < currentSectionQs.length - 1) {
      setCurrentIdx(currentIdx + 1);
      return;
    }
    const curIdxInSecs = sectionsWithQuestions.indexOf(currentSec);
    if (curIdxInSecs < sectionsWithQuestions.length - 1) {
      setCurrentSec(sectionsWithQuestions[curIdxInSecs + 1]);
      setCurrentIdx(0);
    }
  }

  function switchSection(sec: Section) {
    if (!sectionsWithQuestions.includes(sec)) return;
    setCurrentSec(sec);
    setCurrentIdx(0);
  }

  function jumpTo(idx: number) {
    setCurrentIdx(idx);
  }

  if (phase === "intro") {
    return (
      <main className="px-5 pt-6 pb-24">
        <Link
          href="/learn/exam"
          className="inline-flex items-center text-sm font-medium text-gray-500 active:text-gray-700"
        >
          ← 시험 목록
        </Link>
        <header className="mt-4">
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{config.description}</p>
        </header>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-xs font-semibold text-gray-500">시험 정보</div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">난이도</dt>
              <dd className="font-medium text-gray-900">{config.difficulty}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">제한 시간</dt>
              <dd className="font-medium text-gray-900">
                {config.timeLimitMinutes}분
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">합격 기준</dt>
              <dd className="font-medium text-gray-900">
                {config.passingScore}점 이상
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">총 문항</dt>
              <dd className="font-medium text-gray-900">{visibleCount}문항</dd>
            </div>
            {sectionCounts.listening > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">듣기</dt>
                <dd className="font-medium text-gray-900">
                  {sectionCounts.listening}문항
                </dd>
              </div>
            )}
            {sectionCounts.reading > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">읽기</dt>
                <dd className="font-medium text-gray-900">
                  {sectionCounts.reading}문항
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">주의사항</div>
          <ul className="mt-2 space-y-1 text-xs text-amber-800">
            <li>· 제한 시간이 끝나면 답안이 자동 제출됩니다.</li>
            <li>· 브라우저 뒤로가기 시 답안이 저장되지 않습니다.</li>
            <li>· 시험 중 새로고침을 하지 마세요.</li>
          </ul>
        </section>

        {!isSubscribed && lockedPaidCount > 0 && (
          <section className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm font-semibold text-blue-900">
              샘플 {visibleCount}문항만 제공됩니다
            </div>
            <p className="mt-1 text-xs text-blue-800">
              구독하면 유료 {lockedPaidCount}문항을 포함한 전체 시험을 응시할 수 있어요.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white"
            >
              7일 무료로 시작하기
            </Link>
          </section>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={startExam}
          disabled={loading || visibleCount === 0}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "문제를 불러오는 중…" : "시험 시작하기"}
        </button>
      </main>
    );
  }

  if (phase === "submitting") {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-gray-700">채점 중…</p>
          {error && (
            <p className="mt-3 text-xs text-red-600">{error}</p>
          )}
        </div>
      </main>
    );
  }

  const timeCritical = timeLeft < 300;

  if (!currentQ) {
    return (
      <main className="px-5 pt-6">
        <p className="text-sm text-red-600">
          문제가 비어 있습니다. 시험 목록으로 돌아가세요.
        </p>
        <Link
          href="/learn/exam"
          className="mt-4 inline-block text-sm font-medium text-blue-600"
        >
          ← 시험 목록
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gray-50 pb-40">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href="/learn/exam"
          className="text-xs font-medium text-gray-500"
          aria-label="시험 나가기"
        >
          나가기
        </Link>
        <div className="text-xs font-semibold text-gray-700">
          {currentIdx + 1} / {currentSectionQs.length}
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-bold tabular-nums ${
            timeCritical ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-700"
          }`}
          aria-live="polite"
        >
          {formatMMSS(timeLeft)}
        </div>
      </header>

      {sectionsWithQuestions.length > 1 && (
        <div className="flex gap-1 border-b border-gray-200 bg-white px-4">
          {sectionsWithQuestions.map((sec) => {
            const total = sec === "listening" ? listeningQs.length : readingQs.length;
            const answered = sec === "listening" ? listeningAnswered : readingAnswered;
            const active = sec === currentSec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => switchSection(sec)}
                className={`flex-1 border-b-2 py-2.5 text-xs font-semibold ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                {SECTION_LABEL[sec]} {answered}/{total}
              </button>
            );
          })}
        </div>
      )}

      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{
            width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
          }}
        />
      </div>

      <section className="px-5 pt-5">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-blue-600 px-2 py-0.5 font-semibold text-white">
            {currentQ.question_number}번
          </span>
          {currentQ.category && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
              {categoryLabel(currentQ.category)}
            </span>
          )}
          {typeof currentQ.difficulty === "number" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-500">
              난이도 {currentQ.difficulty}
            </span>
          )}
        </div>

        {currentQ.passage && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900 whitespace-pre-line">
            {currentQ.passage}
          </div>
        )}

        {currentQ.audio_url && (
          <div className="mt-4">
            <audio controls className="w-full" src={currentQ.audio_url}>
              이 브라우저는 오디오를 지원하지 않습니다.
            </audio>
          </div>
        )}

        {currentQ.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentQ.image_url}
            alt=""
            className="mt-4 w-full rounded-xl border border-gray-200"
          />
        )}

        <div className="mt-4 text-base font-medium leading-relaxed text-gray-900 whitespace-pre-line">
          {currentQ.question_text}
        </div>

        <ul className="mt-5 space-y-2">
          {currentQ.options.map((opt) => {
            const selected = answers[currentQ.id] === opt.num;
            return (
              <li key={opt.num}>
                <button
                  type="button"
                  onClick={() => pick(currentQ.id, opt.num)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 bg-white active:bg-gray-50"
                  }`}
                  aria-pressed={selected}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      selected
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {opt.num}
                  </span>
                  <span className="text-sm text-gray-900">{opt.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <nav
        className="fixed bottom-0 inset-x-0 z-20 border-t border-gray-200 bg-white"
        aria-label="문제 네비게이션"
      >
        <div className="mx-auto max-w-xl px-4 pt-3 pb-3">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {currentSectionQs.map((q, idx) => {
              const answered = q.id in answers;
              const active = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => jumpTo(idx)}
                  className={`h-7 w-7 rounded-md text-[11px] font-semibold ${
                    active
                      ? "bg-emerald-600 text-white"
                      : answered
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                  }`}
                  aria-current={active ? "true" : undefined}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirstQuestion}
              className="h-11 flex-1 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 active:bg-gray-50 disabled:opacity-40"
            >
              이전
            </button>
            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white active:bg-blue-700"
              >
                제출하기
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="h-11 flex-1 rounded-xl bg-gray-900 text-sm font-semibold text-white active:bg-black"
              >
                다음
              </button>
            )}
          </div>
        </div>
      </nav>

      {showSubmitModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-confirm-title"
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h2
              id="submit-confirm-title"
              className="text-base font-bold text-gray-900"
            >
              제출할까요?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              답변한 문제 {answeredCount}/{questions.length}. 제출 후에는 수정할 수 없습니다.
            </p>
            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="h-11 flex-1 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => submit(false)}
                className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white"
              >
                제출하기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
