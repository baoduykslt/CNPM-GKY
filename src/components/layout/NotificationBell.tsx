'use client'

import { useState } from 'react'
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
  CheckCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/lib/actions/interaction'
import { formatDateTime } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { NotificationItem } from '@/lib/queries/notifications'

interface Props {
  notifications: NotificationItem[]
  unreadCount: number
}

const ICON_MAP: Record<string, React.ReactNode> = {
  post_approved: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  post_rejected: <XCircle className="h-4 w-4 text-red-600" />,
  comment: <MessageSquare className="h-4 w-4 text-blue-600" />,
  reply: <Reply className="h-4 w-4 text-indigo-600" />,
  like: <Heart className="h-4 w-4 text-pink-600" />,
  report_result: <AlertCircle className="h-4 w-4 text-amber-600" />,
  system: <Bell className="h-4 w-4 text-slate-600" />,
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

export function NotificationBell({ notifications, unreadCount }: Props) {
  const [open, setOpen] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const router = useRouter()

  const handleOpen = () => {
    setOpen((v) => !v)
  }

  const handleNotifClick = async (notif: NotificationItem) => {
    setOpen(false)
    if (!notif.is_read) {
      await markNotificationReadAction(notif.id)
      router.refresh()
    }
    if (notif.link) {
      router.push(notif.link)
    }
  }

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMarking(true)
    const result = await markAllNotificationsReadAction()
    setIsMarking(false)
    if (result.ok) {
      toast.success(result.message)
      router.refresh()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white hover:bg-slate-50 transition-colors"
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
      >
        <Bell className="h-5 w-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 overflow-hidden rounded-lg border bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-slate-900">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarking}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">
                    Chưa có thông báo nào
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotifClick(notif)}
                    className={cn(
                      'flex w-full gap-3 border-b p-3 text-left transition-colors last:border-b-0 hover:bg-slate-50',
                      !notif.is_read && 'bg-blue-50/40'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        BG_MAP[notif.type] ?? 'bg-slate-100'
                      )}
                    >
                      {ICON_MAP[notif.type] ?? <Bell className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm line-clamp-1',
                            !notif.is_read
                              ? 'font-semibold text-slate-900'
                              : 'font-medium text-slate-700'
                          )}
                        >
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        )}
                      </div>

                      {notif.message && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                          {notif.message}
                        </p>
                      )}

                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatDateTime(notif.created_at)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t bg-slate-50 p-2">
              <Link
                href="/thong-bao"
                onClick={() => setOpen(false)}
                className="block rounded-md py-2 text-center text-sm font-medium text-primary hover:bg-slate-100"
              >
                Xem tất cả thông báo →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}