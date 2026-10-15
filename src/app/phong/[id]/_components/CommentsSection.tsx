import { createClient } from '@/lib/supabase/server'
import { getPostComments } from '@/lib/actions/interaction'
import { CommentsSectionClient } from './CommentsSectionClient'

interface Props {
  postId: string
}

export async function CommentsSection({ postId }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { comments, repliesByParent } = await getPostComments(postId)

  return (
    <CommentsSectionClient
      postId={postId}
      currentUserId={user?.id ?? null}
      comments={comments}
      repliesByParent={repliesByParent}
    />
  )
}