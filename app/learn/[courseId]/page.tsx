import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signBunnyHlsUrl } from "@/lib/bunny/stream";
import VideoPlayer from "./video-player";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePage({ params }: PageProps) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, stream_video_id, duration_seconds, is_free")
    .eq("id", courseId)
    .eq("is_published", true)
    .single();

  if (!course || !course.stream_video_id) {
    notFound();
  }

  let isSubscriber = false;
  if (!course.is_free) {
    const { data: profile } = await supabase
      .from("users")
      .select("academy_id")
      .eq("id", user.id)
      .maybeSingle();

    let query = supabase
      .from("subscriptions")
      .select("status")
      .in("status", ["trialing", "active"])
      .limit(1);

    query = profile?.academy_id
      ? query.or(`user_id.eq.${user.id},academy_id.eq.${profile.academy_id}`)
      : query.eq("user_id", user.id);

    const { data: subs } = await query;
    isSubscriber = Boolean(subs && subs.length > 0);
  }

  const { data: progress } = await supabase
    .from("progress")
    .select("last_position_seconds")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  return (
    <main className="pb-24">
      <header className="px-5 pt-6">
        <h1 className="text-xl font-bold">{course.title}</h1>
        {course.description && (
          <p className="mt-1 text-sm text-gray-500">{course.description}</p>
        )}
      </header>

      <div className="mt-4">
        {course.is_free || isSubscriber ? (
          <VideoPlayer
            courseId={course.id}
            videoSrc={signBunnyHlsUrl(course.stream_video_id)}
            initialPosition={progress?.last_position_seconds ?? 0}
          />
        ) : (
          <div className="mx-5 rounded-xl bg-gray-100 px-5 py-10 text-center text-sm text-gray-600">
            구독 후 시청할 수 있는 강의입니다.
          </div>
        )}
      </div>
    </main>
  );
}
