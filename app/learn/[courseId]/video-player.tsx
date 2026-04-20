'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  videoSrc: string
  courseId: string
  initialPosition?: number
}

export default function VideoPlayer({ videoSrc, courseId, initialPosition = 0 }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClient()

  const saveProgress = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const currentTime = Math.floor(video.currentTime)
    const duration    = Math.floor(video.duration) || 1
    const percent     = Math.round((currentTime / duration) * 100)
    const completed   = percent >= 90
    await supabase.from('progress').upsert(
      { user_id: user.id, course_id: courseId, last_position_seconds: currentTime, percent,
        ...(completed ? { completed_at: new Date().toISOString() } : {}) },
      { onConflict: 'user_id,course_id' }
    )
  }, [courseId, supabase])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onLoaded = () => { if (initialPosition > 0) video.currentTime = initialPosition }
    video.addEventListener('loadedmetadata', onLoaded)
    timerRef.current = setInterval(saveProgress, 5000)
    video.addEventListener('ended', saveProgress)
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('ended', saveProgress)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [initialPosition, saveProgress])

  const handleRestart = async () => {
    const video = videoRef.current
    if (!video) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    video.currentTime = 0
    await supabase.from('progress')
      .update({ last_position_seconds: 0 })
      .eq('user_id', user.id)
      .eq('course_id', courseId)
  }

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden">
      <video ref={videoRef} className="w-full aspect-video" controls playsInline
        controlsList="nodownload" onContextMenu={(e) => e.preventDefault()}>
        <source src={videoSrc} type="application/x-mpegURL" />
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 text-white text-sm">
        <span className="text-zinc-400 text-xs">재생 속도</span>
        {[0.75, 1, 1.25, 1.5].map((rate) => (
          <button key={rate} onClick={() => { if (videoRef.current) videoRef.current.playbackRate = rate }}
            className="px-2 py-0.5 rounded text-xs bg-zinc-700 hover:bg-zinc-500 transition">
            {rate}x
          </button>
        ))}
        <button onClick={handleRestart} className="ml-auto text-xs text-zinc-400 hover:text-white transition">
          ↻ 처음부터 다시 보기
        </button>
      </div>
    </div>
  )
}
