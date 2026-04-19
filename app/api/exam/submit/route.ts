import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXAM_TYPES = ["topik1", "topik2", "eps-topik"] as const;
type ExamType = (typeof EXAM_TYPES)[number];

type Body = {
  examType?: string;
  answers?: Record<string, number>;
  timeTakenSeconds?: number;
};

type Bucket = { correct: number; total: number };

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Body;
    const examType = body.examType as ExamType | undefined;
    const answers = body.answers ?? {};
    const timeTakenSeconds = Math.max(
      0,
      Math.floor(body.timeTakenSeconds ?? 0),
    );

    if (!examType || !EXAM_TYPES.includes(examType)) {
      return NextResponse.json(
        { error: "유효한 examType이 필요합니다." },
        { status: 400 },
      );
    }

    const questionIds = Object.keys(answers);
    if (questionIds.length === 0) {
      return NextResponse.json(
        { error: "답안이 비어 있습니다." },
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

    const { data: questions, error: qErr } = await supabase
      .from("questions")
      .select("id, correct_answer, category, section, exam_type")
      .in("id", questionIds)
      .eq("exam_type", examType);

    if (qErr) {
      console.error("[exam submit] 문제 조회 실패", qErr);
      return NextResponse.json(
        { error: "채점에 실패했습니다." },
        { status: 500 },
      );
    }
    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "채점할 문제를 찾지 못했습니다." },
        { status: 400 },
      );
    }

    const detail: Array<{
      questionId: string;
      picked: number | null;
      correct: number;
      isCorrect: boolean;
      category: string | null;
      section: string | null;
    }> = [];
    const categoryBreakdown: Record<string, Bucket> = {};
    const sectionBreakdown: Record<string, Bucket> = {};
    let correctCount = 0;

    for (const q of questions) {
      const picked = answers[q.id];
      const pickedNum = typeof picked === "number" ? picked : null;
      const isCorrect = pickedNum === q.correct_answer;
      if (isCorrect) correctCount++;

      const cat = q.category ?? "etc";
      const sec = q.section ?? "etc";
      categoryBreakdown[cat] ??= { correct: 0, total: 0 };
      sectionBreakdown[sec] ??= { correct: 0, total: 0 };
      categoryBreakdown[cat].total++;
      sectionBreakdown[sec].total++;
      if (isCorrect) {
        categoryBreakdown[cat].correct++;
        sectionBreakdown[sec].correct++;
      }

      detail.push({
        questionId: q.id,
        picked: pickedNum,
        correct: q.correct_answer,
        isCorrect,
        category: q.category ?? null,
        section: q.section ?? null,
      });
    }

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    const { data: inserted, error: insErr } = await supabase
      .from("exam_results")
      .insert({
        user_id: user.id,
        exam_type: examType,
        score,
        total_questions: totalQuestions,
        correct_count: correctCount,
        time_taken_seconds: timeTakenSeconds,
        answers: { detail, sectionBreakdown },
        category_breakdown: categoryBreakdown,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      console.error("[exam submit] 결과 저장 실패", insErr);
      return NextResponse.json(
        { error: "결과를 저장하지 못했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      resultId: inserted.id,
      score,
      correctCount,
      totalQuestions,
      categoryBreakdown,
      sectionBreakdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[exam submit] 처리 실패", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
