import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CourseType = "topik1" | "topik2" | "eps-topik";

export default async function CourseList({ type }: { type: CourseType }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, level, is_free, subtitle_lang, duration_seconds")
    .eq("type", type)
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p className="mt-6 text-sm text-red-600">
        강의 목록을 불러오지 못했습니다: {error.message}
      </p>
    );
  }
  if (!courses || courses.length === 0) {
    return <p className="mt-6 text-sm text-gray-500">아직 공개된 강의가 없습니다.</p>;
  }

  return (
    <ul className="mt-6 space-y-3">
      {courses.map((c) => (
        <li key={c.id}>
          <Link
            href={`/learn/${c.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
          >
            <div className="text-base font-semibold text-gray-900">{c.title}</div>
            {c.description && (
              <div className="mt-1 line-clamp-2 text-xs text-gray-500">{c.description}</div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              {typeof c.level === "number" && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                  Lv.{c.level}
                </span>
              )}
              {c.subtitle_lang && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium uppercase text-indigo-600">
                  {c.subtitle_lang}
                </span>
              )}
              {c.is_free ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
                  무료
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-600">
                  유료
                </span>
              )}
              {typeof c.duration_seconds === "number" && c.duration_seconds > 0 && (
                <span className="text-gray-400">
                  · {Math.floor(c.duration_seconds / 60)}분
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
