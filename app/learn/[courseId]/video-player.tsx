"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { StreamPlayerApi } from "@cloudflare/stream-react";
import { createClient } from "@/lib/supabase/client";

const Stream = dynamic(
  () => import("@cloudflare/stream-react").then((m) => m.Stream),
  { ssr: false },
);

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

type Props = {
  courseId: string;
  videoSrc: string;
  durationSeconds: number;
  startSeconds: number;
  canPlay: boolean;
};

export default function VideoPlayer({
  courseId,
  videoSrc,
  durationSeconds,
  startSeconds,
  canPlay,
}: Props) {
  const supabase = createClient();
  const streamRef = useRef<StreamPlayerApi | undefined>(undefined);
  const lastSavedRef = useRef<number>(startSeconds);
  const [rate, setRate] = useState<number>(1);
  const [showPaywall, setShowPaywall] = useState<boolean>(!canPlay);

  async function saveProgress(currentSeconds: number, completed = false) {
    const percent =
      durationSeconds > 0
        ? Math.min(100, Math.round((currentSeconds / durationSeconds) * 100))
        : completed
          ? 100
          : 0;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("progress").upsert(
      {
        user_id: user.id,
        course_id: courseId,
        last_position_seconds: Math.floor(currentSeconds),
        percent: completed ? 100 : percent,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,course_id" },
    );
  }

  function handleTimeUpdate() {
    const current = streamRef.current?.currentTime ?? 0;
    if (current - lastSavedRef.current >= 5) {
      lastSavedRef.current = current;
      saveProgress(current);
    }
  }

  function handleEnded() {
    const total = streamRef.current?.duration ?? durationSeconds;
    saveProgress(total, true);
  }

  async function restartFromBeginning() {
    const player = streamRef.current;
    if (!player) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("progress")
        .update({ last_position_seconds: 0 })
        .eq("user_id", user.id)
        .eq("course_id", courseId);
    }

    lastSavedRef.current = 0;
    player.currentTime = 0;
    player.play().catch(() => {
      // autoplay 정책으로 play() 거부될 수 있음 — 사용자 재생 버튼으로 이어짐
    });
  }

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.playbackRate = rate;
    }
  }, [rate]);

  return (
    <>
      {canPlay ? (
        <>
        <div
          className="relative w-full aspect-video bg-black select-none"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          <Stream
            streamRef={streamRef}
            src={videoSrc}
            controls
            responsive
            startTime={startSeconds > 0 ? `${startSeconds}s` : undefined}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
          <div className="absolute top-2 right-2 flex gap-1 bg-black/60 rounded-md p-1 text-xs z-10">
            {PLAYBACK_RATES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRate(r)}
                className={`px-2 py-1 rounded ${
                  rate === r ? "bg-white text-black" : "text-white/80"
                }`}
                aria-pressed={rate === r}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex justify-end px-1">
          <button
            type="button"
            onClick={restartFromBeginning}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 active:bg-gray-50"
          >
            <span aria-hidden="true">↻</span>
            처음부터 다시 보기
          </button>
        </div>
        </>
      ) : (
        <div className="w-full aspect-video bg-gray-100 flex flex-col items-center justify-center text-center px-6">
          <p className="text-base font-semibold text-gray-900">
            구독이 필요한 강의입니다
          </p>
          <p className="mt-1 text-sm text-gray-500">
            7일 무료 체험 후 바로 시작할 수 있어요.
          </p>
          <Link
            href="/pricing"
            className="mt-4 h-11 px-5 inline-flex items-center rounded-lg bg-blue-600 text-white font-semibold"
          >
            구독 시작하기
          </Link>
        </div>
      )}

      {showPaywall && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center px-5">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              pluepe 구독으로 시작하세요
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              이 강의는 구독자 전용이에요. 7일 무료 체험을 제공합니다.
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex w-full h-12 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold"
            >
              구독 시작하기
            </Link>
            <button
              type="button"
              onClick={() => setShowPaywall(false)}
              className="mt-3 block w-full text-sm text-gray-500"
            >
              나중에 하기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
