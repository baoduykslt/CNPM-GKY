'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Send,
  Trash2,
  Pencil,
  Eye,
  Loader2,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  submitPostAction,
  deletePostAction,
  markAvailabilityAction,
} from '@/lib/actions/post'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Post } from '@/types/app'

interface Props {
  post: Pick<Post, 'id' | 'status' | 'availability_status' | 'deleted_at'>
}

export function PostActions({ post }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = () => {
    if (!confirm('Gửi bài này để chờ duyệt?')) return
    startTransition(async () => {
      const r = await submitPostAction(post.id)
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Xoá bài đăng này? Hành động không thể hoàn tác.')) return
    startTransition(async () => {
      const r = await deletePostAction(post.id)
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const handleMark = (value: 'available' | 'rented') => {
    startTransition(async () => {
      const r = await markAvailabilityAction(post.id, value)
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const disabled = isPending || !!post.deleted_at
  const linkDisabledClass = disabled ? 'pointer-events-none opacity-50' : ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sửa — luôn hiện */}
      <Link
        href={`/tin-cua-toi/${post.id}/sua`}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          linkDisabledClass
        )}
      >
        <Pencil className="mr-1 h-3.5 w-3.5" />
        Sửa
      </Link>

      {/* Gửi duyệt — chỉ với draft / rejected */}
      {(post.status === 'draft' || post.status === 'rejected') && (
        <Button size="sm" onClick={handleSubmit} disabled={disabled}>
          {isPending ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-1 h-3.5 w-3.5" />
          )}
          Gửi duyệt
        </Button>
      )}

      {/* Đánh dấu cho thuê / còn trống — chỉ với published */}
      {post.status === 'published' && (
        <>
          {post.availability_status === 'available' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMark('rented')}
              disabled={disabled}
            >
              {isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              )}
              Đã cho thuê
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMark('available')}
              disabled={disabled}
            >
              {isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <PackageCheck className="mr-1 h-3.5 w-3.5" />
              )}
              Còn trống
            </Button>
          )}
        </>
      )}

      {/* Xem — với published */}
      {post.status === 'published' && (
        <Link
          href={`/phong/${post.id}`}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            linkDisabledClass
          )}
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          Xem
        </Link>
      )}

      {/* Xoá */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={disabled}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        Xoá
      </Button>
    </div>
  )
}