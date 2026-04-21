import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SECTIONS = ["session", "words", "patterns", "test", "ai"] as const;
type Section = (typeof VALID_SECTIONS)[number];

type Body = {
  unitId?: string;
  section?: string;
  score?: number;
  total?: number;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const unitId = (body.unitId ?? "").trim();
  const section = body.section as Section | undefined;

  if (!unitId || !section || !VALID_SECTIONS.includes(section)) {
    return NextResponse.json(
      { error: "unitId와 section이 필요합니다." },
      { status: 400 },
    );
  }

  const score =
    typeof body.score === "number" && Number.isFinite(body.score)
      ? Math.max(0, Math.floor(body.score))
      : null;
  const total =
    typeof body.total === "number" && Number.isFinite(body.total)
      ? Math.max(0, Math.floor(body.total))
      : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 비로그인 사용자도 유닛 체험 가능 — 저장은 건너뛰고 성공 응답
    return NextResponse.json({ success: true, skipped: "unauthenticated" });
  }

  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      unit_id: unitId,
      section,
      completed: true,
      score,
      total,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,unit_id,section" },
  );

  if (error) {
    return NextResponse.json(
      { error: "진도 저장 실패", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
