'use client'

import { MessageSquare } from 'lucide-react'
import { CommentForm } from './CommentForm'
import { CommentList } from './CommentList'
import type { CommentData } from './CommentItem'

interface Props {
  postId: string
  currentUserId: string | null
  comments: CommentData[]
  repliesByParent: Record<string, CommentData[]>
}

export function CommentsSectionClient({
  postId,
  currentUserId,
  comments,
  repliesByParent,
}: Props) {
  const totalCount =
    comments.length +
    Object.values(repliesByParent).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <section className="rounded-lg border bg-white p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5" />
        Bình luận ({totalCount})
      </h2>

      <div className="border-b pb-5">
        <CommentForm
          postId={postId}
          isLoggedIn={!!currentUserId}
          placeholder="Chia sẻ suy nghĩ của bạn về phòng trọ này..."
        />
      </div>

      <CommentList
        postId={postId}
        currentUserId={currentUserId}
        comments={comments}
        repliesByParent={repliesByParent}
      />
    </section>
  )
}