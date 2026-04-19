import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExamSession from "./exam-session";
import { EXAM_CONFIG, EXAM_TYPES, type ExamType } from "../_exam-config";

function isExamType(value: string): value is ExamType {
  return (EXAM_TYPES as readonly string[]).includes(value);
}

export default async function ExamTypePage({
  params,
}: {
  params: Promise<{ examType: string }>;
}) {
  const { examType } = await params;
  if (!isExamType(examType)) notFound();

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

  const { data: questionRows } = await supabase
    .from("questions")
    .select("section, is_free")
    .eq("exam_type", examType)
    .eq("is_published", true);

  const sectionCounts: Record<"listening" | "reading", number> = {
    listening: 0,
    reading: 0,
  };
  let totalCount = 0;
  let freeCount = 0;
  for (const q of questionRows ?? []) {
    const sec = q.section as "listening" | "reading" | string;
    if (sec === "listening" || sec === "reading") {
      if (isSubscribed || q.is_free) sectionCounts[sec]++;
    }
    totalCount++;
    if (q.is_free) freeCount++;
  }
  const visibleCount = isSubscribed ? totalCount : freeCount;

  return (
    <ExamSession
      examType={examType}
      config={EXAM_CONFIG[examType]}
      isSubscribed={isSubscribed}
      visibleCount={visibleCount}
      sectionCounts={sectionCounts}
      lockedPaidCount={isSubscribed ? 0 : totalCount - freeCount}
    />
  );
}
