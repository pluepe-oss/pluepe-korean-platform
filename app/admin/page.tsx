import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900 tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-gray-500">{unit}</span>
        )}
      </div>
      {hint && <div className="mt-1 text-[11px] text-gray-500">{hint}</div>}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("users")
    .select("academy_id, role")
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
            관리자 계정의 <code className="font-mono">academy_id</code>가 연결되어
            있어야 학생·진도·좌석 데이터를 조회할 수 있어요. Master에게 학원
            매핑을 요청하세요.
          </p>
        </div>
      </main>
    );
  }

  const { data: academy } = await supabase
    .from("academies")
    .select("name, country_code, contact_email, created_at")
    .eq("id", academyId)
    .maybeSingle();

  const { data: students } = await supabase
    .from("users")
    .select("id")
    .eq("academy_id", academyId)
    .eq("role", "student");

  const studentCount = students?.length ?? 0;
  const studentIds = (students ?? []).map((s) => s.id as string);

  const { data: progressRows } =
    studentIds.length > 0
      ? await supabase
          .from("progress")
          .select("user_id, percent, updated_at, completed_at")
          .in("user_id", studentIds)
      : { data: [] as Array<{ user_id: string; percent: number | null; updated_at: string | null; completed_at: string | null }> };

  const progressList = progressRows ?? [];
  const avgProgress =
    progressList.length > 0
      ? Math.round(
          progressList.reduce((sum, p) => sum + (p.percent ?? 0), 0) /
            progressList.length,
        )
      : 0;

  const weekAgoMs = Date.now() - 7 * 86400000;
  const activeIds = new Set<string>();
  for (const p of progressList) {
    if (p.updated_at && new Date(p.updated_at).getTime() >= weekAgoMs) {
      activeIds.add(p.user_id);
    }
  }
  const activeStudents = activeIds.size;

  const { data: seats } = await supabase
    .from("seats")
    .select("total, used")
    .eq("academy_id", academyId)
    .maybeSingle();
  const seatsTotal = seats?.total ?? 0;
  const seatsUsed = seats?.used ?? studentCount;
  const seatsRemaining = Math.max(0, seatsTotal - seatsUsed);
  const seatsPercent =
    seatsTotal > 0 ? Math.min(100, (seatsUsed / seatsTotal) * 100) : 0;
  const seatsCritical = seatsTotal > 0 && seatsUsed / seatsTotal >= 0.9;

  return (
    <main className="p-6 pb-20 md:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          {academy?.name ?? "학원"} 운영 개요
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="전체 학생" value={studentCount} unit="명" />
        <StatCard
          label="좌석 사용"
          value={seatsTotal > 0 ? `${seatsUsed}/${seatsTotal}` : `${seatsUsed}`}
          hint={
            seatsTotal > 0
              ? `잔여 ${seatsRemaining}명`
              : "좌석 미설정 (Master에게 요청)"
          }
        />
        <StatCard label="평균 진도율" value={`${avgProgress}%`} />
        <StatCard
          label="최근 7일 활동"
          value={activeStudents}
          unit="명"
          hint={studentCount > 0 ? `전체의 ${Math.round((activeStudents / studentCount) * 100)}%` : undefined}
        />
      </section>

      {seatsTotal > 0 && (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
              좌석 사용 현황
            </div>
            <div className="text-xs text-gray-500 tabular-nums">
              {seatsUsed}/{seatsTotal}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${
                seatsCritical ? "bg-red-500" : "bg-blue-600"
              }`}
              style={{ width: `${seatsPercent}%` }}
            />
          </div>
          {seatsCritical && (
            <p className="mt-2 text-[11px] font-medium text-red-600">
              좌석이 거의 찼습니다. 추가 구매를 고려하세요.
            </p>
          )}
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-base font-semibold text-gray-900">학원 정보</h2>
        <dl className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
          <InfoRow label="학원명" value={academy?.name ?? "—"} />
          <InfoRow label="국가" value={academy?.country_code ?? "—"} />
          <InfoRow label="연락처" value={academy?.contact_email ?? "—"} />
          <InfoRow label="등록일" value={formatDate(academy?.created_at ?? null)} />
        </dl>
      </section>

      <section className="mt-6 flex gap-2">
        <Link
          href="/admin/students"
          className="inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white active:bg-blue-700"
        >
          학생 관리로 이동
        </Link>
      </section>
    </main>
  );
}
