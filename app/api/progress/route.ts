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
  try {
    const body = (await request.json().catch(() => ({}))) as Body;
    const unitId = (body.unitId ?? "").trim();
    const section = body.section as Section | undefined;

    if (!unitId || !section || !VALID_SECTIONS.includes(section)) {
      return NextResponse.json(
        { success: false, error: "unitId와 section이 필요합니다." },
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
      // 비로그인 사용자도 유닛 체험 가능 — 저장은 건너뛰고 success:false 로 skip 신호만 반환
      return NextResponse.json({ success: false, skipped: "unauthenticated" });
    }

    // KST(UTC+9) 기준 오늘/어제 날짜 — user_progress.activity_date(date) 와 매칭.
    // UTC 환경에서도 "ko-KR 하루"의 경계를 정확히 맞추기 위해 +9h 오프셋을 건 뒤 ISO date 부분만 자른다.
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const today = kst.toISOString().slice(0, 10);
    const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    // 1) 오늘 / 어제 activity_date 존재 여부 — upsert 이전에 조회해야
    //    "이번 섹션 완료가 오늘 첫 activity 인지"를 판정할 수 있다.
    const [todayRes, yesterdayRes] = await Promise.all([
      supabase
        .from("user_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("activity_date", today)
        .limit(1),
      supabase
        .from("user_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("activity_date", yesterday)
        .limit(1),
    ]);
    const alreadyActiveToday = (todayRes.data?.length ?? 0) > 0;
    const hadYesterday = (yesterdayRes.data?.length ?? 0) > 0;

    // 2) user_progress upsert — activity_date 도 함께 기록
    const { error } = await supabase.from("user_progress").upsert(
      {
        user_id: user.id,
        unit_id: unitId,
        section,
        completed: true,
        score,
        total,
        completed_at: new Date().toISOString(),
        activity_date: today,
      },
      { onConflict: "user_id,unit_id,section" },
    );

    if (error) {
      console.error("[progress] upsert failed", {
        unit_id: unitId,
        section,
        user_id: user.id,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { success: false, error: "진도 저장 실패", detail: error.message },
        { status: 500 },
      );
    }

    // 3) streak 계산 — 오늘 첫 activity 일 때만 users.streak 업데이트
    //    · 어제 기록 있음 → 기존 streak + 1
    //    · 어제 기록 없음 → streak = 1 (연속 끊김 리셋)
    //    · 오늘 이미 기록 있음(중복 완료) → 건드리지 않음
    if (!alreadyActiveToday) {
      const { data: userRow } = await supabase
        .from("users")
        .select("streak")
        .eq("id", user.id)
        .maybeSingle();
      const currentStreak = userRow?.streak ?? 0;
      const newStreak = hadYesterday ? currentStreak + 1 : 1;
      const { error: streakErr } = await supabase
        .from("users")
        .update({ streak: newStreak })
        .eq("id", user.id);
      if (streakErr) {
        // streak 반영 실패해도 섹션 저장 자체는 성공이므로 응답은 그대로 유지하고 로그만 남긴다.
        console.error("[progress] streak update failed", {
          user_id: user.id,
          code: streakErr.code,
          message: streakErr.message,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[progress] unexpected exception", err);
    return NextResponse.json(
      {
        success: false,
        error: "진도 저장 실패 (예외)",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
