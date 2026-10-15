'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const COOKIE_NAME = 'mod_sound_enabled'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const LOOP_COUNT = 3
const COOLDOWN_MS = 8000

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp('(^| )' + name + '=([^;]+)')
  )
  return match ? match[2] : null
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`
}

interface SoundContextValue {
  enabled: boolean
  setEnabled: (next: boolean) => void
  play: () => void
  stop: () => void
  isReady: boolean
}

const SoundContext = createContext<SoundContextValue | null>(null)

export function NotificationSoundProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [enabled, setEnabledState] = useState<boolean>(false)
  const [isReady, setIsReady] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPlayRef = useRef<number>(0)
  const playCountRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Đọc cookie
  useEffect(() => {
    const saved = getCookie(COOKIE_NAME)
    setEnabledState(saved === 'true')
    setIsReady(true)
  }, [])

  // Tạo audio 1 lần
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio('/sounds/notification.mp3')
    audio.preload = 'auto'
    audio.volume = 1.0
    audioRef.current = audio

    return () => {
      audio.pause()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const stopInternal = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    playCountRef.current = 0
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next)
      setCookie(COOKIE_NAME, String(next), COOKIE_MAX_AGE)
      if (!next) stopInternal()
    },
    [stopInternal]
  )

  const play = useCallback(() => {
    if (!enabled || !audioRef.current) {
      console.log('[SOUND] play skipped: enabled =', enabled)
      return
    }

    const now = Date.now()
    if (now - lastPlayRef.current < COOLDOWN_MS) {
      console.log('[SOUND] cooldown, skip')
      return
    }
    lastPlayRef.current = now

    stopInternal()

    const audio = audioRef.current
    audio.currentTime = 0
    audio.volume = 1.0

    audio
      .play()
      .then(() => {
        console.log('[SOUND] started, duration =', audio.duration)
        playCountRef.current = 1

        intervalRef.current = setInterval(() => {
          if (!audioRef.current) return
          const a = audioRef.current

          if (a.paused && playCountRef.current < LOOP_COUNT) {
            playCountRef.current += 1
            console.log(
              '[SOUND] loop',
              playCountRef.current,
              '/',
              LOOP_COUNT
            )
            a.currentTime = 0
            a.play().catch((e) => console.error('[SOUND] loop error:', e))
          } else if (a.paused && playCountRef.current >= LOOP_COUNT) {
            console.log('[SOUND] finished all loops')
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            playCountRef.current = 0
          }
        }, 200)
      })
      .catch((err) => console.error('[SOUND] play error:', err))
  }, [enabled, stopInternal])

  const stop = useCallback(() => {
    stopInternal()
    console.log('[SOUND] stopped by user')
  }, [stopInternal])

  return (
    <SoundContext.Provider value={{ enabled, setEnabled, play, stop, isReady }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useNotificationSound() {
  const ctx = useContext(SoundContext)
  if (!ctx) {
    throw new Error(
      'useNotificationSound must be used inside <NotificationSoundProvider>'
    )
  }
  return ctx
}