import Link from "next/link";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import InviteForm from "./_invite-form";

export const dynamic = "force-dynamic";

type InvitationLookup = {
  email: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  academy_name: string | null;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service role 환경변수가 설정되지 않았습니다.");
  }
  return createAdminSupabase(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function lookup(token: string): Promise<InvitationLookup | null> {
  if (!token || token.length < 16) return null;
  const db = adminClient();
  const { data: inv } = await db
    .from("invitations")
    .select("email, status, expires_at, academy_id")
    .eq("token", token)
    .maybeSingle();
  if (!inv) return null;

  const expired =
    new Date(inv.expires_at as string).getTime() < Date.now();
  const status =
    inv.status === "pending" && expired
      ? "expired"
      : (inv.status as InvitationLookup["status"]);

  const { data: academy } = await db
    .from("academies")
    .select("name")
    .eq("id", inv.academy_id)
    .maybeSingle();

  return {
    email: inv.email as string,
    status,
    expires_at: inv.expires_at as string,
    academy_name: academy?.name ?? null,
  };
}

function MessageCard(props: {
  title: string;
  body: string;
  tone: "amber" | "red" | "emerald";
  cta?: { href: string; label: string };
}) {
  const palette = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[props.tone];
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10">
      <div className={`w-full max-w-sm rounded-2xl border p-6 ${palette}`}>
        <h1 className="text-lg font-semibold">{props.title}</h1>
        <p className="mt-2 text-sm opacity-90">{props.body}</p>
        {props.cta && (
          <Link
            href={props.cta.href}
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white"
          >
            {props.cta.label}
          </Link>
        )}
      </div>
    </main>
  );
}

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <MessageCard
        tone="red"
        title="잘못된 초대 링크"
        body="초대 토큰이 없습니다. 이메일에서 다시 링크를 확인해 주세요."
      />
    );
  }

  const inv = await lookup(token);
  if (!inv) {
    return (
      <MessageCard
        tone="red"
        title="초대를 찾을 수 없어요"
        body="링크가 유효하지 않거나 삭제되었습니다. 담당 선생님에게 재발송을 요청해 주세요."
      />
    );
  }
  if (inv.status === "accepted") {
    return (
      <MessageCard
        tone="emerald"
        title="이미 수락된 초대예요"
        body="기존 계정으로 로그인하면 바로 학습을 이어갈 수 있어요."
        cta={{ href: "/auth", label: "로그인 하러 가기" }}
      />
    );
  }
  if (inv.status === "expired" || inv.status === "revoked") {
    return (
      <MessageCard
        tone="amber"
        title={
          inv.status === "expired" ? "초대가 만료되었어요" : "취소된 초대예요"
        }
        body="담당 선생님에게 초대 재발송을 요청해 주세요."
      />
    );
  }

  // pending + 이미 로그인된 사용자인 경우: 이메일 불일치 처리
  const supabase = await createServerSupabase();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const alreadyLoggedInWithDifferentEmail =
    currentUser && currentUser.email?.toLowerCase() !== inv.email.toLowerCase();

  if (alreadyLoggedInWithDifferentEmail) {
    return (
      <MessageCard
        tone="amber"
        title="다른 계정으로 로그인되어 있어요"
        body={`초대받은 이메일은 ${inv.email} 입니다. 현재 로그인된 계정(${currentUser.email})과 달라요. 로그아웃 후 다시 접속해 주세요.`}
        cta={{ href: "/my", label: "마이페이지로" }}
      />
    );
  }

  return (
    <main className="min-h-dvh bg-white px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          PLUEPE
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          학습 초대를 받았어요
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {inv.academy_name ?? "학원"}에서 보낸 초대입니다.
        </p>

        <dl className="mt-6 space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">이메일</dt>
            <dd className="font-medium text-gray-900">{inv.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">만료일</dt>
            <dd className="font-medium text-gray-900">
              {formatDate(inv.expires_at)}
            </dd>
          </div>
        </dl>

        <InviteForm
          token={token}
          email={inv.email}
          alreadyLoggedIn={Boolean(currentUser)}
        />

        <p className="mt-6 text-center text-xs text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth" className="font-medium text-blue-600">
            로그인 후 이 링크를 다시 열어 주세요
          </Link>
        </p>
      </div>
    </main>
  );
}
