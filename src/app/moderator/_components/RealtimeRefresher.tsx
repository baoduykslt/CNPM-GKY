'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useNotificationSound } from '@/lib/realtime/NotificationSoundProvider'

export function RealtimeRefresher() {
  const router = useRouter()
  const { play } = useNotificationSound()
  const isSubscribedRef = useRef(false)

  useEffect(() => {
    if (isSubscribedRef.current) return
    isSubscribedRef.current = true

    const supabase = createClient()

    const channel = supabase
      .channel('moderator-queue')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'status=eq.pending',
        },
        (payload) => {
          console.log('[REALTIME] Bài pending mới:', payload)
          play()
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_revisions',
          filter: 'status=eq.pending',
        },
        (payload) => {
          console.log('[REALTIME] Revision pending mới:', payload)
          play()
          router.refresh()
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
      isSubscribedRef.current = false
    }
  }, [play, router])

  return null
}