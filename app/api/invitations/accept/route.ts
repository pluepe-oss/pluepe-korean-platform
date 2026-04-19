import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, { status: number; message: string }> = {
  unauthenticated: { status: 401, message: "로그인이 필요합니다." },
  invitation_not_found: { status: 404, message: "초대를 찾을 수 없습니다." },
  invitation_already_accepted: {
    status: 409,
    message: "이미 수락된 초대입니다.",
  },
  invitation_already_expired: {
    status: 410,
    message: "초대가 만료되었습니다.",
  },
  invitation_already_revoked: {
    status: 410,
    message: "취소된 초대입니다.",
  },
  invitation_expired: { status: 410, message: "초대가 만료되었습니다." },
  user_not_found: { status: 404, message: "사용자 프로필을 찾을 수 없습니다." },
  email_mismatch: {
    status: 403,
    message: "초대받은 이메일과 가입 이메일이 다릅니다.",
  },
  seats_exhausted: {
    status: 409,
    message: "학원 좌석이 모두 소진되어 수락할 수 없습니다.",
  },
};

export async function POST(request: Request) {
  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 본문입니다." },
      { status: 400 },
    );
  }
  const token = typeof body.token === "string" ? body.token : "";
  if (!token || token.length < 16) {
    return NextResponse.json(
      { error: "초대 토큰이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  });
  if (error) {
    const code = error.message?.trim().split(/\s+/)[0] ?? "";
    const mapped = ERROR_MESSAGES[code];
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    return NextResponse.json(
      { error: error.message ?? "초대 수락에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, invitation: data });
}
