'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  postId: string
}

export function ViewCounter({ postId }: Props) {
  useEffect(() => {
    // Chống spam: dùng sessionStorage trong tab hiện tại
    const key = `viewed_${postId}`
    if (sessionStorage.getItem(key)) return

    sessionStorage.setItem(key, '1')

    const supabase = createClient()
    supabase.rpc('increment_post_view', { p_post_id: postId }).then(
      () => {},
      () => {} // im lặng nếu lỗi
    )
  }, [postId])

  return null
}