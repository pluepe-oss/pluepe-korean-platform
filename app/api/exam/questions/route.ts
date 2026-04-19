import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXAM_TYPES = ["topik1", "topik2", "eps-topik"] as const;
const SECTIONS = ["listening", "reading"] as const;
type ExamType = (typeof EXAM_TYPES)[number];
type Section = (typeof SECTIONS)[number];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const examType = url.searchParams.get("examType");
    const section = url.searchParams.get("section");

    if (!examType || !EXAM_TYPES.includes(examType as ExamType)) {
      return NextResponse.json(
        { error: "유효한 examType이 필요합니다." },
        { status: 400 },
      );
    }
    if (section && !SECTIONS.includes(section as Section)) {
      return NextResponse.json(
        { error: "유효한 section이 아닙니다." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

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

    let query = supabase
      .from("questions")
      .select(
        "id, exam_type, section, question_number, question_text, passage, audio_url, image_url, options, category, difficulty, is_free",
      )
      .eq("exam_type", examType)
      .eq("is_published", true)
      .order("section", { ascending: true })
      .order("question_number", { ascending: true });

    if (section) query = query.eq("section", section);
    if (!isSubscribed) query = query.eq("is_free", true);

    const { data: questions, error } = await query;
    if (error) {
      console.error("[exam questions] 조회 실패", error);
      return NextResponse.json(
        { error: "문제를 불러오지 못했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      questions: questions ?? [],
      isSubscribed,
      totalCount: questions?.length ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[exam questions] 처리 실패", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
