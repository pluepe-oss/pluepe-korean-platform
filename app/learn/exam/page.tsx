import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ExamType = "topik1" | "topik2" | "eps-topik";

type ExamInfo = {
  type: ExamType;
  title: string;
  description: string;
  difficulty: string;
  timeLimitMinutes: number;
};

const EXAMS: ExamInfo[] = [
  {
    type: "topik1",
    title: "TOPIK 1",
    description: "한국어능력시험 초급 (1·2급) 모의고사",
    difficulty: "초급 A1-A2",
    timeLimitMinutes: 40,
  },
  {
    type: "topik2",
    title: "TOPIK 2",
    description: "한국어능력시험 중고급 (3~6급) 모의고사",
    difficulty: "중고급 B1-C2",
    timeLimitMinutes: 110,
  },
  {
    type: "eps-topik",
    title: "EPS-TOPIK",
    description: "고용허가제 한국어능력시험 근로자용",
    difficulty: "근로자 전용",
    timeLimitMinutes: 50,
  },
];

const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  topik1: "TOPIK 1",
  topik2: "TOPIK 2",
  "eps-topik": "EPS-TOPIK",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ExamHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("users")
    .select("academy_id")
    .eq("id", user.id)
    .maybeSingle();

  let subQuery = supabase
    .from("subscriptions")
    .select("id")
    .in("status", ["active", "trialing"])
    .limit(1);
  subQuery = profile?.academy_id
    ? subQuery.or(`user_id.eq.${user.id},academy_id.eq.${profile.academy_id}`)
    : subQuery.eq("user_id", user.id);
  const { data: subs } = await subQuery;
  const isSubscribed = (subs?.length ?? 0) > 0;

  const countsByExam: Record<ExamType, { total: number; free: number }> = {
    topik1: { total: 0, free: 0 },
    topik2: { total: 0, free: 0 },
    "eps-topik": { total: 0, free: 0 },
  };

  const { data: questionRows } = await supabase
    .from("questions")
    .select("exam_type, is_free")
    .eq("is_published", true);

  for (const q of questionRows ?? []) {
    const type = q.exam_type as ExamType;
    if (!countsByExam[type]) continue;
    countsByExam[type].total++;
    if (q.is_free) countsByExam[type].free++;
  }

  const { data: recentResults } = await supabase
    .from("exam_results")
    .select("id, exam_type, score, correct_count, total_questions, created_at, taken_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(3);

  return (
    <main className="px-5 pt-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold">시험보기</h1>
        <p className="mt-1 text-sm text-gray-500">
          IBT 기반 모의고사로 실력을 점검하세요.
        </p>
      </header>

      {!isSubscribed && (
        <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">
            샘플 문항만 풀 수 있어요
          </div>
          <p className="mt-1 text-xs text-amber-800">
            전체 문항과 상세 오답 노트는 구독 시 이용할 수 있습니다.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex h-10 items-center rounded-lg bg-amber-600 px-4 text-xs font-semibold text-white"
          >
            7일 무료로 시작하기
          </Link>
        </section>
      )}

      <section className="mt-6 space-y-3">
        {EXAMS.map((exam) => {
          const counts = countsByExam[exam.type];
          const visibleCount = isSubscribed ? counts.total : counts.free;
          const disabled = visibleCount === 0;
          return (
            <Link
              key={exam.type}
              href={disabled ? "#" : `/learn/exam/${exam.type}`}
              aria-disabled={disabled}
              className={`block rounded-2xl border border-gray-200 bg-white p-5 ${
                disabled ? "pointer-events-none opacity-60" : "active:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold text-gray-900">
                    {exam.title}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {exam.description}
                  </p>
                </div>
                {!isSubscribed && (
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    샘플
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                  {exam.difficulty}
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                  {visibleCount}문항
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                  제한시간 {exam.timeLimitMinutes}분
                </span>
                {!isSubscribed && counts.total > counts.free && (
                  <span className="text-gray-400">
                    · 유료 {counts.total - counts.free}문항 잠김
                  </span>
                )}
              </div>
              {disabled && (
                <p className="mt-2 text-[11px] text-gray-400">
                  아직 공개된 문항이 없습니다.
                </p>
              )}
            </Link>
          );
        })}
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">최근 시험 기록</h2>
        {recentResults && recentResults.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {recentResults.map((r) => {
              const type = (r.exam_type as ExamType) ?? "topik1";
              const correct = r.correct_count ?? 0;
              const total = r.total_questions ?? 0;
              const when = r.created_at ?? r.taken_at;
              return (
                <li key={r.id}>
                  <Link
                    href={`/learn/exam/result/${r.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        {EXAM_TYPE_LABEL[type] ?? type}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {when ? formatDate(when) : "—"}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        {r.score}
                      </span>
                      <span className="text-xs text-gray-500">
                        점 · {correct}/{total} 정답
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <div className="text-sm font-medium text-gray-900">
              아직 응시한 시험이 없어요
            </div>
            <p className="mt-1 text-xs text-gray-500">
              위 카드에서 시험을 골라 시작해보세요.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
