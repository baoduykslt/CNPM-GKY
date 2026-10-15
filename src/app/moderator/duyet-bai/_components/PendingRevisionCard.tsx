'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, ArrowRight, FileEdit } from 'lucide-react'
import { toast } from 'sonner'
import {
  approveRevisionAction,
  rejectRevisionAction,
} from '@/lib/actions/moderation'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatPrice } from '@/lib/constants'
import type { PendingRevision } from '@/lib/queries/admin'

interface Props {
  revision: PendingRevision
}

export function PendingRevisionCard({ revision }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const authorName =
    revision.author?.full_name ?? revision.author?.username ?? 'Người dùng'

  const handleApprove = () => {
    if (!confirm('Duyệt bản chỉnh sửa? Nội dung bài gốc sẽ bị thay thế.')) return

    startTransition(async () => {
      const result = await approveRevisionAction(revision.id)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleReject = () => {
    if (reason.trim().length < 3) {
      toast.error('Vui lòng nhập lý do')
      return
    }

    startTransition(async () => {
      const result = await rejectRevisionAction(revision.id, reason.trim())
      if (result.ok) {
        toast.success(result.message)
        setShowRejectForm(false)
        setReason('')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <FileEdit className="h-4 w-4 text-blue-600" />
        <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
          Bản chỉnh sửa
        </span>
        <span className="text-slate-500">
          Tạo lúc {formatDateTime(revision.created_at)}
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Người đăng: <strong>{authorName}</strong>
        {revision.author?.username && ` (@${revision.author.username})`}
      </p>

      {/* Diff view */}
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-start gap-3 rounded-md border bg-slate-50 p-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500">Tiêu đề cũ</p>
            <p className="mt-1 line-through text-slate-500">
              {revision.original_title}
            </p>
          </div>
          <ArrowRight className="mt-5 h-4 w-4 shrink-0 text-slate-400" />
          <div className="flex-1">
            <p className="text-xs font-medium text-emerald-700">Tiêu đề mới</p>
            <p className="mt-1 font-medium text-slate-900">{revision.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border p-2">
            <span className="text-slate-500">Giá mới:</span>{' '}
            <strong>{formatPrice(revision.price)}</strong>
          </div>
          <div className="rounded-md border p-2">
            <span className="text-slate-500">Diện tích:</span>{' '}
            <strong>{revision.area} m²</strong>
          </div>
          <div className="col-span-2 rounded-md border p-2">
            <span className="text-slate-500">Địa chỉ mới:</span>{' '}
            <strong>
              {revision.ward}, {revision.province}
            </strong>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!showRejectForm ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1 h-3.5 w-3.5" />
            )}
            Duyệt bản sửa
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRejectForm(true)}
            disabled={isPending}
            className="text-red-600 hover:bg-red-50"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Từ chối
          </Button>

          <Link
            href={`/tin-cua-toi/${revision.post_id}`}
            target="_blank"
            className="ml-auto self-center text-xs text-slate-500 hover:text-primary"
          >
            Xem bài gốc →
          </Link>
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Lý do từ chối *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={1000}
            disabled={isPending}
            className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowRejectForm(false)
                setReason('')
              }}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || reason.trim().length < 3}
            >
              {isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="mr-1 h-3.5 w-3.5" />
              )}
              Xác nhận
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}