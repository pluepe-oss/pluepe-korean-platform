import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InviteButton from "./_invite-button";

type ProgressRow = {
  user_id: string;
  percent: number | null;
  updated_at: string | null;
  completed_at: string | null;
};

type StudentRow = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  country_code: string | null;
  preferred_language: string | null;
};

type InvitationRow = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
};

type Stats = {
  courseCount: number;
  completedCount: number;
  avgPercent: number;
  lastActive: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const day = Math.floor(diffMs / 86400000);
  if (day <= 0) return "오늘";
  if (day === 1) return "어제";
  if (day < 7) return `${day}일 전`;
  if (day < 30) return `${Math.floor(day / 7)}주 전`;
  return formatDate(iso);
}

export default async function AdminStudentsPage() {
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

  const academyId = profile?.academy_id as string | null;

  if (!academyId) {
    return (
      <main className="p-6 md:p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-bold text-amber-900">
            학원이 지정되지 않았어요
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            Master에게 academy 매핑을 요청하세요.
          </p>
        </div>
      </main>
    );
  }

  const [{ data: studentsData }, { data: seatsData }, { data: invitationsData }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, email, name, created_at, country_code, preferred_language")
        .eq("academy_id", academyId)
        .eq("role", "student")
        .order("created_at", { ascending: false }),
      supabase
        .from("seats")
        .select("total, used")
        .eq("academy_id", academyId)
        .maybeSingle(),
      supabase
        .from("invitations")
        .select("id, email, status, expires_at, created_at")
        .eq("academy_id", academyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  const students = (studentsData ?? []) as StudentRow[];
  const studentIds = students.map((s) => s.id);
  const seats = seatsData as { total: number; used: number } | null;
  const invitations = (invitationsData ?? []) as InvitationRow[];
  const now = Date.now();
  const pendingInvites = invitations.filter(
    (i) => new Date(i.expires_at).getTime() >= now,
  );
  const seatsRemaining = Math.max(
    0,
    (seats?.total ?? 0) - (seats?.used ?? 0) - pendingInvites.length,
  );
  const seatsExhausted = seatsRemaining <= 0;

  const { data: progressData } =
    studentIds.length > 0
      ? await supabase
          .from("progress")
          .select("user_id, percent, updated_at, completed_at")
          .in("user_id", studentIds)
      : { data: [] as ProgressRow[] };

  const progressRows = (progressData ?? []) as ProgressRow[];

  const statsByUser = new Map<string, Stats>();
  for (const p of progressRows) {
    const existing = statsByUser.get(p.user_id) ?? {
      courseCount: 0,
      completedCount: 0,
      avgPercent: 0,
      lastActive: null,
    };
    const nextCount = existing.courseCount + 1;
    const nextAvg = Math.round(
      (existing.avgPercent * existing.courseCount + (p.percent ?? 0)) /
        nextCount,
    );
    const newer =
      p.updated_at &&
      (!existing.lastActive ||
        new Date(p.updated_at) > new Date(existing.lastActive));
    statsByUser.set(p.user_id, {
      courseCount: nextCount,
      completedCount: existing.completedCount + (p.completed_at ? 1 : 0),
      avgPercent: nextAvg,
      lastActive: newer ? p.updated_at : existing.lastActive,
    });
  }

  return (
    <main className="p-6 pb-20 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학생 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 {students.length}명의 학생 · 잔여 좌석 {seatsRemaining}
            {seats ? ` / ${seats.total}` : ""}
            {pendingInvites.length > 0
              ? ` · 대기 중 초대 ${pendingInvites.length}건`
              : ""}
          </p>
        </div>
        {seatsExhausted ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex h-11 cursor-not-allowed items-center rounded-lg bg-gray-200 px-4 text-sm font-semibold text-gray-500"
            title="좌석이 모두 사용 중입니다"
          >
            좌석 없음
          </button>
        ) : (
          <InviteButton />
        )}
      </header>

      {pendingInvites.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">대기 중 초대</h2>
          <ul className="mt-2 space-y-2">
            {pendingInvites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-amber-900">
                    {inv.email}
                  </div>
                  <div className="mt-0.5 text-[11px] text-amber-800">
                    만료 {formatDate(inv.expires_at)}
                  </div>
                </div>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                  수락 대기
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {students.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <div className="text-sm font-semibold text-gray-900">
            아직 등록된 학생이 없어요
          </div>
          <p className="mt-1 text-xs text-gray-500">
            학생이 가입하고 학원에 연결되면 이 목록에 표시됩니다.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-sm font-medium text-blue-600"
          >
            대시보드로
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-6 hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">학생</th>
                  <th className="px-4 py-3 text-left">가입일</th>
                  <th className="px-4 py-3 text-left">평균 진도</th>
                  <th className="px-4 py-3 text-left">완료</th>
                  <th className="px-4 py-3 text-left">최근 학습</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {students.map((s) => {
                  const stats = statsByUser.get(s.id);
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {s.name ?? s.email}
                        </div>
                        {s.name && (
                          <div className="text-[11px] text-gray-500">
                            {s.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${stats?.avgPercent ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 tabular-nums">
                            {stats?.avgPercent ?? 0}%
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          {stats?.courseCount ?? 0}개 강의
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">
                        {stats?.completedCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {relativeTime(stats?.lastActive ?? null)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <ul className="mt-6 space-y-2 md:hidden">
            {students.map((s) => {
              const stats = statsByUser.get(s.id);
              return (
                <li
                  key={s.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {s.name ?? s.email}
                      </div>
                      {s.name && (
                        <div className="truncate text-[11px] text-gray-500">
                          {s.email}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {relativeTime(stats?.lastActive ?? null)}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${stats?.avgPercent ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 tabular-nums">
                      {stats?.avgPercent ?? 0}%
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">
                      강의 {stats?.courseCount ?? 0}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      완료 {stats?.completedCount ?? 0}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">
                      가입 {formatDate(s.created_at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
