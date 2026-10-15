// =====================================================================
// Query helpers cho notifications
// =====================================================================

import { unstable_noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

// =====================================================================
// Lấy danh sách thông báo của user hiện tại
// =====================================================================
export async function getUserNotifications(limit = 50) {
  unstable_noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: [], unreadCount: 0 }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, link, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return { data: [], unreadCount: 0 }

  const unreadCount = data.filter((n) => !n.is_read).length

  return { data: data as NotificationItem[], unreadCount }
}

// =====================================================================
// Đếm số thông báo chưa đọc (dùng cho badge trên Header)
// =====================================================================
export async function getUnreadNotificationCount(): Promise<number> {
  unstable_noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return count ?? 0
}