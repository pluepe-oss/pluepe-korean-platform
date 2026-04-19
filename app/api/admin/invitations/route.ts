import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend";
import { renderStudentInviteEmail } from "@/lib/email/templates/student-invite";
import { getAppUrl } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVITE_TTL_DAYS = 7;

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

function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function formatKoreanDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 본문입니다." },
      { status: 400 },
    );
  }
  const rawEmail = typeof body.email === "string" ? body.email : "";
  const email = normalizeEmail(rawEmail);
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "올바른 이메일을 입력해 주세요." },
      { status: 400 },
    );
  }

  // 1. 세션 + admin 권한 확인
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("users")
    .select("role, academy_id, name, email")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || (me.role !== "admin" && me.role !== "master")) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const academyId = me.academy_id as string | null;
  if (!academyId) {
    return NextResponse.json(
      { error: "학원이 지정되지 않았습니다. Master에게 문의해 주세요." },
      { status: 400 },
    );
  }

  const db = adminClient();

  // 2. 학원 좌석 + 학원명 조회
  const [{ data: seats }, { data: academy }] = await Promise.all([
    db
      .from("seats")
      .select("total, used")
      .eq("academy_id", academyId)
      .maybeSingle(),
    db
      .from("academies")
      .select("name")
      .eq("id", academyId)
      .maybeSingle(),
  ]);
  if (!seats || !academy) {
    return NextResponse.json(
      { error: "학원 좌석 정보를 찾을 수 없습니다." },
      { status: 400 },
    );
  }

  // 3. pending 초대 수 집계 — 좌석 예약 개념으로 함께 계산
  const { count: pendingCount } = await db
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("academy_id", academyId)
    .eq("status", "pending");

  const reserved = (seats.used ?? 0) + (pendingCount ?? 0);
  if (reserved >= (seats.total ?? 0)) {
    return NextResponse.json(
      {
        error: `좌석이 모두 사용 중입니다. (사용 ${seats.used}/${seats.total}, 대기 중 초대 ${pendingCount})`,
      },
      { status: 409 },
    );
  }

  // 4. 이미 학원 소속 학생인지 확인
  const { data: existingUser } = await db
    .from("users")
    .select("id, academy_id")
    .eq("email", email)
    .maybeSingle();
  if (existingUser?.academy_id === academyId) {
    return NextResponse.json(
      { error: "이미 같은 학원에 소속된 학생입니다." },
      { status: 409 },
    );
  }

  // 5. 토큰 생성 + insert
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 86400000,
  ).toISOString();

  const { data: inserted, error: insertError } = await db
    .from("invitations")
    .insert({
      academy_id: academyId,
      email,
      token,
      invited_by: user.id,
      expires_at: expiresAt,
    })
    .select("id, token, expires_at")
    .single();

  if (insertError || !inserted) {
    const msg = insertError?.message ?? "";
    if (msg.includes("uq_invitations_academy_email_pending")) {
      return NextResponse.json(
        { error: "이 이메일로 이미 대기 중인 초대가 있어요." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: insertError?.message ?? "초대 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  // 6. 메일 발송
  const inviteUrl = `${getAppUrl()}/auth/invite?token=${inserted.token}`;
  const { subject, html } = renderStudentInviteEmail({
    academyName: academy.name ?? "",
    inviterName: me.name ?? me.email ?? "",
    inviteUrl,
    expiresAt: formatKoreanDate(inserted.expires_at as string),
  });

  try {
    await sendEmail({ to: email, subject, html });
  } catch (e) {
    // 메일 발송 실패 시 초대를 revoked로 돌려 좌석 예약 해소
    await db
      .from("invitations")
      .update({ status: "revoked" })
      .eq("id", inserted.id);
    const message = e instanceof Error ? e.message : "메일 발송 실패";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    invitation: {
      id: inserted.id,
      email,
      expires_at: inserted.expires_at,
    },
  });
}
