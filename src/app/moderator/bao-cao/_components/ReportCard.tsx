'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  MessageSquare,
  User as UserIcon,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Flag,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  startReviewingReportAction,
  resolveReportAction,
  dismissReportAction,
} from '@/lib/actions/moderation'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ReportItem } from '@/lib/queries/admin'

interface Props {
  report: ReportItem
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  reviewing: 'Đang xem xét',
  resolved: 'Đã xử lý',
  dismissed: 'Bỏ qua',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  dismissed: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function ReportCard({ report }: Props) {
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [showDismissForm, setShowDismissForm] = useState(false)
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const targetIcon =
    report.target_type === 'post' ? (
      <FileText className="h-4 w-4" />
    ) : report.target_type === 'comment' ? (
      <MessageSquare className="h-4 w-4" />
    ) : (
      <UserIcon className="h-4 w-4" />
    )

  const reporterName =
    report.reporter?.full_name ??
    report.reporter?.username ??
    'Người dùng ẩn danh'

  const handleStartReview = () => {
    startTransition(async () => {
      const r = await startReviewingReportAction(report.id)
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const handleResolve = () => {
    startTransition(async () => {
      const r = await resolveReportAction(report.id, note)
      if (r.ok) {
        toast.success(r.message)
        setShowResolveForm(false)
        setNote('')
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const handleDismiss = () => {
    startTransition(async () => {
      const r = await dismissReportAction(report.id, note)
      if (r.ok) {
        toast.success(r.message)
        setShowDismissForm(false)
        setNote('')
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const targetHref =
    report.target_type === 'post' && report.targetPost
      ? `/phong/${report.targetPost.id}`
      : report.target_type === 'comment' && report.targetComment
        ? `/phong/${report.targetComment.post_id}`
        : null

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            STATUS_STYLE[report.status]
          )}
        >
          {targetIcon}
          {STATUS_LABEL[report.status]}
        </span>
        <span className="text-xs text-slate-500">
          Báo cáo {formatDateTime(report.created_at)}
        </span>
      </div>

      <div className="mb-3 text-xs text-slate-600">
        Người báo cáo:{' '}
        <strong className="text-slate-900">{reporterName}</strong>
        {report.reporter?.username && (
          <span className="text-slate-500"> (@{report.reporter.username})</span>
        )}
      </div>

      <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3">
        <p className="flex items-center gap-1 text-xs font-semibold text-red-700">
          <Flag className="h-3.5 w-3.5" />
          Lý do: {report.reason}
        </p>
        {report.description && (
          <p className="mt-1 text-sm text-red-800">{report.description}</p>
        )}
      </div>

      {report.targetPost && (
        <div className="mb-3 rounded-md border bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">
            Bài đăng bị báo cáo
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900 line-clamp-2">
            {report.targetPost.title}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">
              {report.targetPost.status}
            </span>
            {targetHref && (
              <Link
                href={targetHref}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Xem bài
              </Link>
            )}
          </div>
        </div>
      )}

      {report.targetComment && (
        <div className="mb-3 rounded-md border bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">
            Bình luận bị báo cáo
          </p>
          <p className="mt-1 text-sm italic text-slate-700 line-clamp-3">
            "{report.targetComment.content}"
          </p>
          {targetHref && (
            <Link
              href={targetHref}
              target="_blank"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Xem trong bài
            </Link>
          )}
        </div>
      )}

      {report.resolution_note && (
        <div className="mb-3 rounded-md bg-slate-50 p-3 text-xs">
          <span className="font-medium text-slate-700">Ghi chú: </span>
          <span className="text-slate-600">{report.resolution_note}</span>
        </div>
      )}

      {report.status === 'pending' && !showResolveForm && !showDismissForm && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartReview}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="mr-1 h-3.5 w-3.5" />
            )}
            Bắt đầu xem xét
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowResolveForm(true)}
            disabled={isPending}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Có vi phạm
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDismissForm(true)}
            disabled={isPending}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Bỏ qua
          </Button>
        </div>
      )}

      {report.status === 'reviewing' && !showResolveForm && !showDismissForm && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowResolveForm(true)}
            disabled={isPending}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Xác nhận vi phạm
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDismissForm(true)}
            disabled={isPending}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Bỏ qua
          </Button>
        </div>
      )}

      {showResolveForm && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Ghi chú xử lý (tuỳ chọn)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            disabled={isPending}
            placeholder="VD: Đã ẩn bài, cảnh cáo tác giả..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowResolveForm(false)
                setNote('')
              }}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button
              size="sm"
              onClick={handleResolve}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              )}
              Xác nhận
            </Button>
          </div>
        </div>
      )}

      {showDismissForm && (
        <div className="mt-3 rounded-md border border-slate-300 bg-slate-50 p-3">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Lý do bỏ qua (tuỳ chọn)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            disabled={isPending}
            placeholder="VD: Không phát hiện vi phạm..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowDismissForm(false)
                setNote('')
              }}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="mr-1 h-3.5 w-3.5" />
              )}
              Bỏ qua báo cáo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}