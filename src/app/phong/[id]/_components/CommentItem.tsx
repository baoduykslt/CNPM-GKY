'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Reply, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCommentAction } from '@/lib/actions/interaction'
import { formatDateTime } from '@/lib/constants'
import { CommentForm } from './CommentForm'
import { ReportButton } from './ReportButton'

export interface CommentData {
  id: string
  content: string
  parent_id: string | null
  created_at: string
  author_id: string | null
  author: {
    id: string
    username: string
    full_name: string | null
  } | null
  avatarUrl: string | null
}

interface Props {
  comment: CommentData
  postId: string
  currentUserId: string | null
  replies: CommentData[]
  isReply?: boolean
}

export function CommentItem({
  comment,
  postId,
  currentUserId,
  replies,
  isReply = false,
}: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isOwn = currentUserId === comment.author_id
  const authorName =
    comment.author?.full_name ?? comment.author?.username ?? 'Người dùng'
  const initial = authorName.charAt(0).toUpperCase()

  const handleDelete = () => {
    if (!confirm('Xoá bình luận này?')) return

    startTransition(async () => {
      const result = await deleteCommentAction(comment.id, postId)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className={isReply ? 'ml-10 mt-3' : 'mt-4'}>
      <div className="flex gap-3">
        {/* Avatar */}
        {comment.avatarUrl ? (
          <img
            src={comment.avatarUrl}
            alt={authorName}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initial}
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {authorName}
              </span>
              {comment.author?.username && (
                <span className="text-xs text-slate-500">
                  @{comment.author.username}
                </span>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
              {comment.content}
            </p>
          </div>

          {/* Actions row */}
          <div className="mt-1 flex items-center gap-3 pl-3 text-xs text-slate-500">
            <span>{formatDateTime(comment.created_at)}</span>

            {currentUserId && !isReply && (
              <button
                type="button"
                onClick={() => setShowReplyForm((v) => !v)}
                className="flex items-center gap-1 hover:text-primary"
              >
                <Reply className="h-3 w-3" />
                Trả lời
              </button>
            )}

            {!isOwn && (
              <ReportButton
                targetType="comment"
                targetId={comment.id}
                isLoggedIn={!!currentUserId}
                variant="link"
              />
            )}

            {isOwn && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1 hover:text-red-600 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                Xoá
              </button>
            )}
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-2">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                isLoggedIn={!!currentUserId}
                onSuccess={() => setShowReplyForm(false)}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Trả lời ${authorName}...`}
                autoFocus
              />
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-1">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  replies={[]}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}