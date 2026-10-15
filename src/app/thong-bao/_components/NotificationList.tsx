'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { markAllNotificationsReadAction } from '@/lib/actions/interaction'
import { NotificationItem } from './NotificationItem'
import { Button } from '@/components/ui/button'
import type { NotificationItem as NotificationData } from '@/lib/queries/notifications'

interface Props {
  notifications: NotificationData[]
  unreadCount: number
}

export function NotificationList({ notifications, unreadCount }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction()
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="rounded-lg border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-semibold">Tất cả thông báo</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-slate-600">
              Bạn có <strong className="text-blue-600">{unreadCount}</strong>{' '}
              thông báo chưa đọc
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-3.5 w-3.5" />
            )}
            Đọc tất cả
          </Button>
        )}
      </div>

      {/* List */}
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  )
}