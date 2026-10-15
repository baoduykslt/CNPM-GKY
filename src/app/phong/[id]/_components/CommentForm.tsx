'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createCommentAction } from '@/lib/actions/interaction'
import { Button } from '@/components/ui/button'

interface Props {
  postId: string
  parentId?: string | null
  isLoggedIn: boolean
  onSuccess?: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function CommentForm({
  postId,
  parentId = null,
  isLoggedIn,
  onSuccess,
  onCancel,
  placeholder = 'Viết bình luận...',
  autoFocus = false,
}: Props) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border bg-slate-50 p-4 text-center text-sm text-slate-600">
        <Link href="/dang-nhap" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>{' '}
        để bình luận
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()

    if (trimmed.length < 1) {
      toast.error('Nội dung bình luận không được trống')
      return
    }

    startTransition(async () => {
      const result = await createCommentAction(postId, trimmed, parentId)
      if (result.ok) {
        setContent('')
        toast.success(result.message)
        onSuccess?.()
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        maxLength={1000}
        autoFocus={autoFocus}
        disabled={isPending}
        className="w-full resize-y rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {content.length}/1000 ký tự
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isPending}
            >
              Huỷ
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isPending || content.trim().length < 1}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="mr-2 h-3.5 w-3.5" />
                {parentId ? 'Trả lời' : 'Gửi bình luận'}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}