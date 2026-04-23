'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

type PlayerJsPlayer = {
  on: (
    event: string,
    callback: (data?: { seconds?: number; duration?: number }) => void,
  ) => void
  off: (event: string) => void
}

type PlayerJsGlobal = {
  Player: new (el: HTMLIFrameElement) => PlayerJsPlayer
}

const PLAYERJS_SRC =
  'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js'

interface Props {
  videoSrc: string
  courseId: string
  initialPosition?: number
  durationSeconds?: number
}

export default function VideoPlayer({ videoSrc, courseId, durationSeconds = 0 }: Props) {
  const supabase = createClient()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [playerSdkReady, setPlayerSdkReady] = useState(false)

  const lastSavedAtRef = useRef(0)
  const lastSavedSecondsRef = useRef(-1)
  const lastDurationRef = useRef(durationSeconds)

  const saveProgress = useCallback(
    async (elapsed: number, duration: number) => {
      if (duration <= 0) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const percent = Math.min(Math.round((elapsed / duration) * 100), 100)
      const completed = percent >= 90
      await supabase.from('progress').upsert(
        {
          user_id: user.id,
          course_id: courseId,
          last_position_seconds: Math.floor(elapsed),
          percent,
          ...(completed ? { completed_at: new Date().toISOString() } : {}),
        },
        { onConflict: 'user_id,course_id' },
      )
      console.log('[progress]', percent + '%', Math.floor(elapsed) + 's')
    },
    [courseId, supabase],
  )

  useEffect(() => {
    if (!playerSdkReady) return
    const iframe = iframeRef.current
    if (!iframe) return
    const pj = (window as unknown as { playerjs?: PlayerJsGlobal }).playerjs
    if (!pj) return

    const player = new pj.Player(iframe)

    player.on('ready', () => {
      console.log('[Bunny] Player.js ready')

      player.on('timeupdate', (data) => {
        const seconds = typeof data?.seconds === 'number' ? data.seconds : NaN
        const duration =
          typeof data?.duration === 'number' ? data.duration : NaN

        if (Number.isFinite(duration) && duration > 0) {
          lastDurationRef.current = duration
        }

        const effectiveDuration = lastDurationRef.current
        if (!Number.isFinite(seconds) || effectiveDuration <= 0) return

        const now = Date.now()
        if (now - lastSavedAtRef.current < 5000) return
        if (Math.abs(seconds - lastSavedSecondsRef.current) < 1) return

        lastSavedAtRef.current = now
        lastSavedSecondsRef.current = seconds
        saveProgress(seconds, effectiveDuration)
      })

      player.on('ended', () => {
        console.log('[Bunny] ended')
        const duration = lastDurationRef.current
        if (duration > 0) {
          saveProgress(duration, duration)
        }
      })
    })

    return () => {
      try {
        player.off('ready')
        player.off('timeupdate')
        player.off('ended')
      } catch {
        /* ignore */
      }
    }
  }, [playerSdkReady, saveProgress])

  return (
    <>
      <Script
        src={PLAYERJS_SRC}
        strategy="afterInteractive"
        onReady={() => setPlayerSdkReady(true)}
      />
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
    </>
  )
}
