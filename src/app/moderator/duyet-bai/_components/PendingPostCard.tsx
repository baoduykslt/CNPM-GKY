'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check,
  X,
  Loader2,
  MapPin,
  Maximize2,
  Calendar,
  User as UserIcon,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  approvePostAction,
  rejectPostAction,
} from '@/lib/actions/moderation'
import { Button } from '@/components/ui/button'
import {
  formatPrice,
  formatArea,
  formatDateTime,
  getRoomTypeLabel,
} from '@/lib/constants'
import type { PendingPost } from '@/lib/queries/admin'

interface Props {
  post: PendingPost
}

export function PendingPostCard({ post }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const authorName =
    post.author?.full_name ?? post.author?.username ?? 'Người dùng'

  const handleApprove = () => {
    if (!confirm('Duyệt bài đăng này?')) return

    startTransition(async () => {
      const result = await approvePostAction(post.id)
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
      toast.error('Vui lòng nhập lý do (tối thiểu 3 ký tự)')
      return
    }

    startTransition(async () => {
      const result = await rejectPostAction(post.id, reason.trim())
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
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="relative h-48 w-full shrink-0 bg-slate-100 sm:h-auto sm:w-56">
          {post.thumbnailUrl ? (
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
          {post.imageCount > 1 && (
            <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              +{post.imageCount - 1} ảnh
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                Chờ duyệt
              </span>
              <span className="text-slate-500">
                Gửi lúc {formatDateTime(post.submitted_at)}
              </span>
            </div>

            <Link
              href={`/tin-cua-toi/${post.id}`}
              target="_blank"
              className="block font-semibold text-slate-900 hover:text-primary"
            >
              {post.title}
            </Link>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span className="font-semibold text-primary">
                {formatPrice(post.price)}
              </span>
              <span className="flex items-center gap-1">
                <Maximize2 className="h-3.5 w-3.5" />
                {formatArea(post.area)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {post.ward}, {post.province}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                {getRoomTypeLabel(post.room_type)}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
              {post.description}
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <UserIcon className="h-3.5 w-3.5" />
              Người đăng: <strong>{authorName}</strong>
              {post.author?.username && ` (@${post.author.username})`}
            </div>
          </div>

          {/* Actions */}
          {!showRejectForm ? (
            <div className="flex flex-wrap gap-2">
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
                Duyệt
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Từ chối
              </Button>

              <Link
                href={`/tin-cua-toi/${post.id}`}
                target="_blank"
                className="ml-auto self-center text-xs text-slate-500 hover:text-primary"
              >
                Xem chi tiết →
              </Link>
            </div>
          ) : (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Lý do từ chối *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={1000}
                disabled={isPending}
                placeholder="VD: Ảnh mờ, thiếu thông tin địa chỉ, giá không hợp lý..."
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
                  Xác nhận từ chối
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}