'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Reply,
  Heart,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { markNotificationReadAction } from '@/lib/actions/interaction'
import { formatDateTime } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { NotificationItem as NotificationData } from '@/lib/queries/notifications'

interface Props {
  notification: NotificationData
}

const ICON_MAP: Record<string, React.ReactNode> = {
  post_approved: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  post_rejected: <XCircle className="h-5 w-5 text-red-600" />,
  comment: <MessageSquare className="h-5 w-5 text-blue-600" />,
  reply: <Reply className="h-5 w-5 text-indigo-600" />,
  like: <Heart className="h-5 w-5 text-pink-600" />,
  report_result: <AlertCircle className="h-5 w-5 text-amber-600" />,
  system: <Bell className="h-5 w-5 text-slate-600" />,
}

const BG_MAP: Record<string, string> = {
  post_approved: 'bg-emerald-50',
  post_rejected: 'bg-red-50',
  comment: 'bg-blue-50',
  reply: 'bg-indigo-50',
  like: 'bg-pink-50',
  report_result: 'bg-amber-50',
  system: 'bg-slate-100',
}

export function NotificationItem({ notification }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleMarkRead = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    startTransition(async () => {
      const result = await markNotificationReadAction(notification.id)
      if (result.ok) {
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleClick = () => {
    if (!notification.is_read) {
      startTransition(async () => {
        await markNotificationReadAction(notification.id)
      })
    }
  }

  const content = (
    <div
      className={cn(
        'flex gap-3 border-b p-4 transition-colors last:border-b-0',
        notification.link && 'cursor-pointer hover:bg-slate-50',
        !notification.is_read && 'bg-blue-50/40'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          BG_MAP[notification.type] ?? 'bg-slate-100'
        )}
      >
        {ICON_MAP[notification.type] ?? <Bell className="h-5 w-5" />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm',
              !notification.is_read
                ? 'font-semibold text-slate-900'
                : 'font-medium text-slate-700'
            )}
          >
            {notification.title}
          </p>

          {!notification.is_read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
          )}
        </div>

        {notification.message && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {notification.message}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
          <span>{formatDateTime(notification.created_at)}</span>

          {!notification.is_read && (
            <button
              type="button"
              onClick={handleMarkRead}
              disabled={isPending}
              className="flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Đánh dấu đã đọc
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleClick}>
        {content}
      </Link>
    )
  }

  return content
}