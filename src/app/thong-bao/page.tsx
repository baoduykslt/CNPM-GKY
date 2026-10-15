import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { getUserNotifications } from '@/lib/queries/notifications'
import { NotificationList } from './_components/NotificationList'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Thông báo',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/dang-nhap?next=/thong-bao')

  const { data: notifications, unreadCount } = await getUserNotifications()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thông báo</h1>
          <p className="text-sm text-slate-600">
            Cập nhật về tin đăng và tương tác của bạn
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white py-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="mb-1 font-semibold text-slate-900">
            Chưa có thông báo nào
          </h3>
          <p className="text-sm text-slate-600">
            Khi có tin được duyệt hoặc tương tác mới, bạn sẽ thấy ở đây.
          </p>
        </div>
      ) : (
        <NotificationList
          notifications={notifications}
          unreadCount={unreadCount}
        />
      )}
    </div>
  )
}