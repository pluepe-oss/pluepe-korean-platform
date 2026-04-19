import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalButton from "./portal-button";
import SignOutButton from "./signout-button";

type Subscription = {
  id: string;
  plan_type: "b2c_monthly" | "b2c_yearly" | "b2b_monthly";
  status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
  trial_ends_at: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

type ProgressRow = {
  id: string;
  percent: number;
  completed_at: string | null;
  updated_at: string;
  courses: {
    id: string;
    title: string;
    type: string;
    level: number | null;
  } | null;
};

type ExamRow = {
  id: string;
  exam_type: "topik1" | "topik2" | "eps-topik";
  score: number;
  total_questions: number | null;
  correct_count: number | null;
  time_taken_seconds: number | null;
  created_at: string | null;
  taken_at: string;
};

const PLAN_LABEL: Record<Subscription["plan_type"], string> = {
  b2c_monthly: "개인 · 월간",
  b2c_yearly: "개인 · 연간",
  b2b_monthly: "학원 · 좌석제",
};

const STATUS_LABEL: Record<Subscription["status"], string> = {
  trialing: "체험 중",
  active: "활성",
  past_due: "결제 지연",
  canceled: "해지됨",
  incomplete: "미완료",
};

const EXAM_TYPE_LABEL: Record<ExamRow["exam_type"], string> = {
  topik1: "TOPIK 1",
  topik2: "TOPIK 2",
  "eps-topik": "EPS-TOPIK",
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, academy_id")
    .eq("id", user.id)
    .maybeSingle();

  let subQuery = supabase
    .from("subscriptions")
    .select("id, plan_type, status, trial_ends_at, current_period_end, stripe_customer_id")
    .in("status", ["trialing", "active", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1);
  subQuery = profile?.academy_id
    ? subQuery.or(`user_id.eq.${user.id},academy_id.eq.${profile.academy_id}`)
    : subQuery.eq("user_id", user.id);
  const { data: subs } = await subQuery;
  const sub = (subs?.[0] ?? null) as Subscription | null;

  const { data: progressData } = await supabase
    .from("progress")
    .select(
      "id, percent, completed_at, updated_at, courses(id, title, type, level)",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);
  const progressList = (progressData ?? []) as unknown as ProgressRow[];

  const { data: examData } = await supabase
    .from("exam_results")
    .select(
      "id, exam_type, score, total_questions, correct_count, time_taken_seconds, created_at, taken_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(5);
  const examList = (examData ?? []) as ExamRow[];

  const trialRemaining =
    sub?.status === "trialing" ? daysUntil(sub.trial_ends_at) : null;

  return (
    <main className="px-5 pt-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="mt-1 text-sm text-gray-500">
          {profile?.name ?? profile?.email ?? user.email}
        </p>
      </header>

      <section className="mt-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          {sub ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-gray-500">현재 플랜</div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    sub.status === "trialing"
                      ? "bg-emerald-50 text-emerald-700"
                      : sub.status === "active"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {STATUS_LABEL[sub.status]}
                </span>
              </div>
              <div className="mt-1 text-lg font-bold text-gray-900">
                {PLAN_LABEL[sub.plan_type]}
              </div>

              {trialRemaining !== null && (
                <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
                  🎁 무료 체험 {trialRemaining > 0 ? `D-${trialRemaining}` : "오늘 종료"}
                </div>
              )}

              <dl className="mt-4 space-y-1.5 text-sm">
                {sub.trial_ends_at && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">체험 종료일</dt>
                    <dd className="font-medium text-gray-900">
                      {formatDate(sub.trial_ends_at)}
                    </dd>
                  </div>
                )}
                {sub.current_period_end && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">다음 결제일</dt>
                    <dd className="font-medium text-gray-900">
                      {formatDate(sub.current_period_end)}
                    </dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <>
              <div className="text-xs font-medium text-gray-500">구독 상태</div>
              <div className="mt-1 text-lg font-bold text-gray-900">
                아직 구독하지 않았어요
              </div>
              <p className="mt-2 text-sm text-gray-600">
                7일 무료 체험으로 전체 강의를 열어드려요.
              </p>
              <Link
                href="/pricing"
                className="mt-4 inline-flex h-11 items-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white"
              >
                요금제 보기
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">내 학습 진도</h2>
        {progressList.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <div className="text-sm font-medium text-gray-900">
              아직 시작한 강의가 없어요
            </div>
            <p className="mt-1 text-xs text-gray-500">강의부터 골라볼까요?</p>
            <Link
              href="/learn"
              className="mt-3 inline-block text-sm font-medium text-blue-600"
            >
              강의 둘러보기 →
            </Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {progressList.map((p) => {
              const percent = Math.min(100, Math.max(0, p.percent ?? 0));
              const isCompleted = Boolean(p.completed_at);
              const course = p.courses;
              if (!course) return null;
              return (
                <li key={p.id}>
                  <Link
                    href={`/learn/${course.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-gray-900">
                          {course.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          {course.type.toUpperCase()}
                          {typeof course.level === "number" && ` · Lv.${course.level}`}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {isCompleted ? "완료" : `${percent}%`}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${
                          isCompleted ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">최근 시험 기록</h2>
        {examList.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <div className="text-sm font-medium text-gray-900">
              아직 응시한 시험이 없어요
            </div>
            <p className="mt-1 text-xs text-gray-500">
              모의고사로 실력을 점검해보세요.
            </p>
            <Link
              href="/learn/exam"
              className="mt-3 inline-block text-sm font-medium text-blue-600"
            >
              시험보기 →
            </Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {examList.map((e) => {
              const total = e.total_questions ?? 0;
              const correct = e.correct_count ?? 0;
              const when = e.created_at ?? e.taken_at;
              return (
                <li key={e.id}>
                  <Link
                    href={`/learn/exam/result/${e.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        {EXAM_TYPE_LABEL[e.exam_type]}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {formatDate(when)}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        {e.score}
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
        )}
      </section>

      {sub?.stripe_customer_id ? (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-900">구독 관리</h2>
          <p className="mt-1 text-xs text-gray-500">
            Stripe 보안 페이지로 이동합니다.
          </p>
          <div className="mt-3">
            <PortalButton />
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <Link
            href="/pricing"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white active:bg-emerald-700"
          >
            7일 무료로 시작하기
          </Link>
          <p className="mt-2 text-center text-[11px] text-gray-500">
            체험 종료 전 언제든 해지 가능 · 해지 시 요금 없음
          </p>
        </section>
      )}

      <section className="mt-10">
        <SignOutButton />
      </section>
    </main>
  );
}
