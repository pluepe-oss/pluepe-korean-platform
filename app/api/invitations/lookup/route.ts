import { NextResponse } from "next/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token || token.length < 16) {
    return NextResponse.json(
      { error: "초대 토큰이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const db = adminClient();
  const { data: inv, error } = await db
    .from("invitations")
    .select("email, status, expires_at, academy_id")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!inv) {
    return NextResponse.json(
      { error: "초대를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const expired =
    new Date(inv.expires_at as string).getTime() < Date.now();
  const status =
    inv.status === "pending" && expired ? "expired" : (inv.status as string);

  const { data: academy } = await db
    .from("academies")
    .select("name")
    .eq("id", inv.academy_id)
    .maybeSingle();

  return NextResponse.json({
    email: inv.email,
    status,
    expires_at: inv.expires_at,
    academy_name: academy?.name ?? null,
  });
}
