'use client'

import { CommentItem, type CommentData } from './CommentItem'

interface Props {
  postId: string
  currentUserId: string | null
  comments: CommentData[]
  repliesByParent: Record<string, CommentData[]>
}

export function CommentList({
  postId,
  currentUserId,
  comments,
  repliesByParent,
}: Props) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Chưa có bình luận nào. Hãy là người đầu tiên!
      </div>
    )
  }

  return (
    <div className="divide-y">
      {comments.map((comment) => (
        <div key={comment.id} className="pb-4">
          <CommentItem
            comment={comment}
            postId={postId}
            currentUserId={currentUserId}
            replies={repliesByParent[comment.id] ?? []}
          />
        </div>
      ))}
    </div>
  )
}