'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type InteractionResult = {
  ok: boolean
  message: string
  action?: 'added' | 'removed'
  count?: number
  commentId?: string
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  return { supabase, user }
}

// =====================================================================
// LIKE — toggle thả tim
// =====================================================================
export async function toggleLikeAction(
  postId: string
): Promise<InteractionResult> {
  try {
    const { supabase, user } = await requireUser()

    const { data: existing } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (error) return { ok: false, message: 'Không thể bỏ thích' }

      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      revalidatePath(`/phong/${postId}`)
      return {
        ok: true,
        message: 'Đã bỏ thích',
        action: 'removed',
        count: count ?? 0,
      }
    }

    const { error } = await supabase
      .from('post_likes')
      .insert({ user_id: user.id, post_id: postId })

    if (error) return { ok: false, message: 'Không thể thích' }

    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    revalidatePath(`/phong/${postId}`)
    return {
      ok: true,
      message: 'Đã thích',
      action: 'added',
      count: count ?? 0,
    }
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }
}

// =====================================================================
// FAVORITE — toggle lưu yêu thích
// =====================================================================
export async function toggleFavoriteAction(
  postId: string
): Promise<InteractionResult> {
  try {
    const { supabase, user } = await requireUser()

    const { data: existing } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (error) return { ok: false, message: 'Không thể bỏ lưu' }

      revalidatePath(`/phong/${postId}`)
      revalidatePath('/yeu-thich')
      return { ok: true, message: 'Đã bỏ lưu', action: 'removed' }
    }

    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, post_id: postId })

    if (error) return { ok: false, message: 'Không thể lưu' }

    revalidatePath(`/phong/${postId}`)
    revalidatePath('/yeu-thich')
    return { ok: true, message: 'Đã lưu vào yêu thích', action: 'added' }
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }
}

// =====================================================================
// COMMENT — tạo bình luận
// =====================================================================
export async function createCommentAction(
  postId: string,
  content: string,
  parentId: string | null = null
): Promise<InteractionResult> {
  try {
    const { supabase, user } = await requireUser()

    const trimmed = content.trim()
    if (trimmed.length < 1) {
      return { ok: false, message: 'Nội dung bình luận không được trống' }
    }
    if (trimmed.length > 1000) {
      return { ok: false, message: 'Bình luận tối đa 1000 ký tự' }
    }

    // Check bị cấm
    const { data: restrictions } = await supabase
      .from('user_restrictions')
      .select('restriction_type, ends_at')
      .eq('user_id', user.id)
      .eq('restriction_type', 'full_ban')

    const now = new Date()
    const isBanned = (restrictions ?? []).some(
      (r) => r.ends_at === null || new Date(r.ends_at) > now
    )
    if (isBanned) {
      return { ok: false, message: 'Tài khoản của bạn đang bị hạn chế' }
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        parent_id: parentId,
        content: trimmed,
      })
      .select('id')
      .single()

    if (error || !data) {
      return { ok: false, message: 'Không thể gửi bình luận' }
    }

    // Notification cho tác giả bài
    const { data: post } = await supabase
      .from('posts')
      .select('author_id, title')
      .eq('id', postId)
      .single()

    if (post && post.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        type: 'comment',
        title: 'Có bình luận mới',
        message: `Ai đó đã bình luận về tin "${post.title}"`,
        link: `/phong/${postId}`,
      })
    }

    // Nếu là reply → notify cha
    if (parentId) {
      const { data: parent } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', parentId)
        .single()

      if (parent && parent.author_id && parent.author_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: parent.author_id,
          type: 'reply',
          title: 'Có trả lời bình luận của bạn',
          message: 'Ai đó đã trả lời bình luận của bạn',
          link: `/phong/${postId}`,
        })
      }
    }

    revalidatePath(`/phong/${postId}`)
    return { ok: true, message: 'Đã gửi bình luận', commentId: data.id }
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập để bình luận' }
  }
}

// =====================================================================
// DELETE COMMENT — xoá mềm
// =====================================================================
export async function deleteCommentAction(
  commentId: string,
  postId: string
): Promise<InteractionResult> {
  try {
    const { supabase, user } = await requireUser()

    const { data: comment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .single()

    if (!comment) return { ok: false, message: 'Không tìm thấy bình luận' }
    if (comment.author_id !== user.id) {
      return { ok: false, message: 'Không có quyền xoá' }
    }

    const { error } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)

    if (error) return { ok: false, message: 'Không thể xoá' }

    revalidatePath(`/phong/${postId}`)
    return { ok: true, message: 'Đã xoá bình luận' }
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }
}

// =====================================================================
// REPORT — báo cáo
// =====================================================================
export async function createReportAction(
  targetType: 'post' | 'comment' | 'user',
  targetId: string,
  reason: string,
  description: string
): Promise<InteractionResult> {
  try {
    const { supabase, user } = await requireUser()

    const reasonTrim = reason.trim()
    if (reasonTrim.length < 3) {
      return { ok: false, message: 'Vui lòng chọn lý do' }
    }
    if (description.length > 2000) {
      return { ok: false, message: 'Mô tả tối đa 2000 ký tự' }
    }

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: reasonTrim,
      description: description.trim() || null,
    })

    if (error) {
      return { ok: false, message: 'Không thể gửi báo cáo' }
    }

    return { ok: true, message: 'Cảm ơn bạn. Báo cáo đã được gửi.' }
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập để báo cáo' }
  }
}

// =====================================================================
// NOTIFICATIONS — đánh dấu đã đọc
// =====================================================================
export async function markNotificationReadAction(
  notificationId: string
): Promise<InteractionResult> {
  try {
    const { supabase, user } = await requireUser()

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) return { ok: false, message: 'Không thể cập nhật' }

    revalidatePath('/thong-bao')
    return { ok: true, message: 'Đã đánh dấu đã đọc' }
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }
}

export async function markAllNotificationsReadAction(): Promise<InteractionResult> {
  try {
    const { supabase, user } = await requireUser()

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) return { ok: false, message: 'Không thể cập nhật' }

    revalidatePath('/thong-bao')
    return { ok: true, message: 'Đã đánh dấu tất cả đã đọc' }
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }
}

// =====================================================================
// GET user interactions cho 1 post (dùng ở chi tiết phòng)
// =====================================================================
export async function getUserInteractions(postId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const [likeCountRes, commentCountRes] = await Promise.all([
      supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .is('deleted_at', null)
        .eq('is_hidden', false),
    ])

    return {
      isLiked: false,
      isFavorited: false,
      likeCount: likeCountRes.count ?? 0,
      commentCount: commentCountRes.count ?? 0,
    }
  }

  const [likeRes, favRes, likeCountRes, commentCountRes] = await Promise.all([
    supabase
      .from('post_likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle(),
    supabase
      .from('favorites')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle(),
    supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId),
    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .is('deleted_at', null)
      .eq('is_hidden', false),
  ])

  return {
    isLiked: !!likeRes.data,
    isFavorited: !!favRes.data,
    likeCount: likeCountRes.count ?? 0,
    commentCount: commentCountRes.count ?? 0,
  }
}
// =====================================================================
// GET COMMENTS của post (bao gồm reply, tối đa 1 cấp)
// =====================================================================
export async function getPostComments(postId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      id, content, parent_id, created_at, author_id,
      profiles:author_id (id, username, full_name, avatar_url)
    `
    )
    .eq('post_id', postId)
    .is('deleted_at', null)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true })

  if (error || !data) return { comments: [], repliesByParent: {} }

  // Resolve avatar URLs
  const comments = data.map((c) => {
    const profile = c.profiles as
      | {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
        }
      | null

    return {
      id: c.id,
      content: c.content,
      parent_id: c.parent_id,
      created_at: c.created_at,
      author_id: c.author_id,
      author: profile
        ? {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
          }
        : null,
      avatarUrl: profile?.avatar_url
        ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data
            .publicUrl
        : null,
    }
  })

  // Group replies by parent
  const roots = comments.filter((c) => c.parent_id === null)
  const repliesByParent: Record<string, typeof comments> = {}
  comments
    .filter((c) => c.parent_id !== null)
    .forEach((reply) => {
      const key = reply.parent_id!
      if (!repliesByParent[key]) repliesByParent[key] = []
      repliesByParent[key].push(reply)
    })

  return { comments: roots, repliesByParent }
}