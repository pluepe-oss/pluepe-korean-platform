import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  EXAM_TYPE_LABEL,
  SECTION_LABEL,
  categoryLabel,
  type ExamType,
} from "../../_exam-config";

type Bucket = { correct: number; total: number };

type AnswerDetail = {
  questionId: string;
  picked: number | null;
  correct: number;
  isCorrect: boolean;
  category: string | null;
  section: string | null;
};

type AnswersJson = {
  detail?: AnswerDetail[];
  sectionBreakdown?: Record<string, Bucket>;
};

type ExamResultRow = {
  id: string;
  user_id: string;
  exam_type: string | null;
  score: number;
  total_questions: number | null;
  correct_count: number | null;
  time_taken_seconds: number | null;
  category_breakdown: Record<string, Bucket> | null;
  answers: AnswersJson | null;
  created_at: string | null;
  taken_at: string | null;
};

type QuestionRow = {
  id: string;
  question_number: number;
  section: string;
  category: string | null;
  question_text: string;
  passage: string | null;
  options: { num: number; text: string }[];
  correct_answer: number;
  explanation: string | null;
};

const PASSING_SCORE = 60;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(sec: number | null): string {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}초`;
  return `${m}분 ${s}초`;
}

function bucketPercent(b: Bucket | undefined): number {
  if (!b || b.total === 0) return 0;
  return Math.round((b.correct / b.total) * 100);
}

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: result } = await supabase
    .from("exam_results")
    .select(
      "id, user_id, exam_type, score, total_questions, correct_count, time_taken_seconds, category_breakdown, answers, created_at, taken_at",
    )
    .eq("id", resultId)
    .maybeSingle();

  if (!result || result.user_id !== user.id) notFound();
  const row = result as ExamResultRow;

  const examType = (row.exam_type as ExamType) ?? "topik1";
  const examLabel = EXAM_TYPE_LABEL[examType] ?? examType;
  const detail = row.answers?.detail ?? [];
  const sectionBreakdown = row.answers?.sectionBreakdown ?? {};
  const categoryBreakdown = row.category_breakdown ?? {};

  const wrongDetail = detail.filter((d) => !d.isCorrect);
  const wrongIds = wrongDetail.map((d) => d.questionId);

  let wrongQuestions: QuestionRow[] = [];
  if (wrongIds.length > 0) {
    const { data: qs } = await supabase
      .from("questions")
      .select(
        "id, question_number, section, category, question_text, passage, options, correct_answer, explanation",
      )
      .in("id", wrongIds);
    wrongQuestions = (qs ?? []) as QuestionRow[];
  }
  const qMap = new Map(wrongQuestions.map((q) => [q.id, q]));

  const categoryEntries = Object.entries(categoryBreakdown)
    .map(([key, b]) => ({ key, ...b, percent: bucketPercent(b) }))
    .sort((a, b) => a.percent - b.percent);

  const sectionEntries = (["listening", "reading"] as const)
    .filter((sec) => sectionBreakdown[sec] && sectionBreakdown[sec].total > 0)
    .map((sec) => ({
      key: sec,
      ...sectionBreakdown[sec],
      percent: bucketPercent(sectionBreakdown[sec]),
    }));

  const passed = row.score >= PASSING_SCORE;
  const correctCount =
    row.correct_count ?? detail.filter((d) => d.isCorrect).length;
  const totalQuestions = row.total_questions ?? detail.length;

  return (
    <main className="px-5 pt-6 pb-24">
      <Link
        href="/learn/exam"
        className="inline-flex items-center text-sm font-medium text-gray-500 active:text-gray-700"
      >
        ← 시험 목록
      </Link>

      <header className="mt-4">
        <div className="text-xs font-semibold text-gray-500">{examLabel} 결과</div>
        <p className="mt-0.5 text-xs text-gray-500">
          {formatDate(row.created_at ?? row.taken_at)}
        </p>
      </header>

      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <div
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            passed
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {passed ? "합격" : "불합격"}
        </div>
        <div className="mt-3 text-5xl font-extrabold tabular-nums text-gray-900">
          {row.score}
          <span className="ml-1 text-lg font-bold text-gray-400">점</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 py-3">
            <div className="text-[11px] text-gray-500">정답</div>
            <div className="mt-0.5 font-semibold text-gray-900">
              {correctCount}/{totalQuestions}
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 py-3">
            <div className="text-[11px] text-gray-500">소요 시간</div>
            <div className="mt-0.5 font-semibold text-gray-900">
              {formatDuration(row.time_taken_seconds)}
            </div>
          </div>
        </div>
      </section>

      {sectionEntries.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">섹션별 정답률</h2>
          <ul className="mt-3 space-y-3">
            {sectionEntries.map((s) => (
              <li
                key={s.key}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium text-gray-900">
                    {SECTION_LABEL[s.key]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {s.correct}/{s.total} · {s.percent}%
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {categoryEntries.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">
            카테고리별 취약점 분석
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            낮은 정답률부터 정렬된 약점 영역입니다.
          </p>
          <ul className="mt-3 space-y-2">
            {categoryEntries.map((c) => (
              <li
                key={c.key}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium text-gray-900">
                    {categoryLabel(c.key)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {c.correct}/{c.total} · {c.percent}%
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      c.percent >= 70
                        ? "bg-emerald-500"
                        : c.percent >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${c.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">오답 노트</h2>
        {wrongDetail.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <div className="text-sm font-semibold text-emerald-800">
              모두 맞혔어요! 👏
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              틀린 문제가 없어 오답 노트가 비어 있습니다.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-4">
            {wrongDetail.map((d, i) => {
              const q = qMap.get(d.questionId);
              if (!q) {
                return (
                  <li
                    key={d.questionId + i}
                    className="rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500"
                  >
                    문제 정보를 불러올 수 없습니다.
                  </li>
                );
              }
              return (
                <li
                  key={q.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">
                      {q.question_number}번 오답
                    </span>
                    {q.section && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                        {SECTION_LABEL[q.section as "listening" | "reading"] ?? q.section}
                      </span>
                    )}
                    {q.category && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                        {categoryLabel(q.category)}
                      </span>
                    )}
                  </div>
                  {q.passage && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900 whitespace-pre-line">
                      {q.passage}
                    </div>
                  )}
                  <div className="mt-3 text-sm font-medium text-gray-900 whitespace-pre-line">
                    {q.question_text}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {q.options.map((opt) => {
                      const isCorrect = opt.num === q.correct_answer;
                      const isPicked = d.picked === opt.num;
                      return (
                        <li
                          key={opt.num}
                          className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                            isCorrect
                              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                              : isPicked
                                ? "border-red-400 bg-red-50 text-red-900"
                                : "border-gray-200 bg-white text-gray-700"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : isPicked
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {opt.num}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                          {isCorrect && (
                            <span className="text-[11px] font-semibold text-emerald-700">
                              정답
                            </span>
                          )}
                          {isPicked && !isCorrect && (
                            <span className="text-[11px] font-semibold text-red-700">
                              내 답
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {q.explanation && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
                      <span className="font-semibold text-gray-900">해설 </span>
                      {q.explanation}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-8 flex gap-2">
        <Link
          href={`/learn/exam/${examType}`}
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white active:bg-blue-700"
        >
          다시 풀기
        </Link>
        <Link
          href="/learn/exam"
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 active:bg-gray-50"
        >
          시험 목록
        </Link>
      </div>
    </main>
  );
}
