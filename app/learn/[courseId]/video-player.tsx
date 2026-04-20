'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  videoSrc: string
  courseId: string
  initialPosition?: number
  durationSeconds?: number
}

export default function VideoPlayer({ videoSrc, courseId, durationSeconds = 0 }: Props) {
  const supabase = createClient()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const saveProgress = useCallback(async (elapsed: number) => {
    if (!durationSeconds || durationSeconds <= 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const percent   = Math.min(Math.round((elapsed / durationSeconds) * 100), 100)
    const completed = percent >= 90
    await supabase.from('progress').upsert(
      {
        user_id:               user.id,
        course_id:             courseId,
        last_position_seconds: Math.floor(elapsed),
        percent,
        ...(completed ? { completed_at: new Date().toISOString() } : {}),
      },
      { onConflict: 'user_id,course_id' }
    )
    console.log('[progress]', percent + '%', Math.floor(elapsed) + 's')
  }, [courseId, durationSeconds, supabase])

  useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      saveProgress(elapsed)
    }, 5000)
    return () => clearInterval(timer)
  }, [saveProgress])

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden">
      <div className="aspect-video">
        <iframe
          ref={iframeRef}
          src={videoSrc}
          className="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 text-white text-sm">
        <span className="text-zinc-400 text-xs">Bunny Stream</span>
      </div>
    </div>
  )
}
