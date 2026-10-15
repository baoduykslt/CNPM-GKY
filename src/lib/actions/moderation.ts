'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { POST_DURATION_DAYS } from '@/lib/constants'

export type ModerationResult = {
  ok: boolean
  message: string
}

async function requireModerator() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('UNAUTHENTICATED')

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['moderator', 'admin'])

  if (!roles || roles.length === 0) throw new Error('FORBIDDEN')

  return { supabase, user }
}

// =====================================================================
// APPROVE POST
// =====================================================================
export async function approvePostAction(
  postId: string
): Promise<ModerationResult> {
  try {
    const { supabase, user } = await requireModerator()

    const { data: post } = await supabase
      .from('posts')
      .select('id, title, author_id, status')
      .eq('id', postId)
      .single()

    if (!post) return { ok: false, message: 'Không tìm thấy bài' }
    if (post.status !== 'pending')
      return { ok: false, message: 'Bài không ở trạng thái chờ duyệt' }

    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + POST_DURATION_DAYS)

    const { error } = await supabase
      .from('posts')
      .update({
        status: 'published',
        published_at: now.toISOString(),
        expires_at: expires.toISOString(),
      })
      .eq('id', postId)

    if (error) return { ok: false, message: 'Không thể duyệt bài' }

    await supabase.from('post_reviews').insert({
      post_id: postId,
      moderator_id: user.id,
      action: 'approved',
    })

    await supabase.from('notifications').insert({
      user_id: post.author_id,
      type: 'post_approved',
      title: 'Bài đăng đã được duyệt',
      message: `Bài "${post.title}" của bạn đã được đăng công khai.`,
      link: `/tin-cua-toi/${postId}`,
    })

    revalidatePath('/moderator')
    revalidatePath('/moderator/duyet-bai')
    revalidatePath('/')
    return { ok: true, message: 'Đã duyệt bài' }
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN')
      return { ok: false, message: 'Không có quyền' }
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}

// =====================================================================
// REJECT POST
// =====================================================================
export async function rejectPostAction(
  postId: string,
  reason: string
): Promise<ModerationResult> {
  try {
    const { supabase, user } = await requireModerator()

    const trimmed = reason.trim()
    if (trimmed.length < 3)
      return { ok: false, message: 'Vui lòng nhập lý do (tối thiểu 3 ký tự)' }

    const { data: post } = await supabase
      .from('posts')
      .select('id, title, author_id, status')
      .eq('id', postId)
      .single()

    if (!post) return { ok: false, message: 'Không tìm thấy bài' }
    if (post.status !== 'pending')
      return { ok: false, message: 'Bài không ở trạng thái chờ duyệt' }

    const { error } = await supabase
      .from('posts')
      .update({ status: 'rejected' })
      .eq('id', postId)

    if (error) return { ok: false, message: 'Không thể từ chối' }

    await supabase.from('post_reviews').insert({
      post_id: postId,
      moderator_id: user.id,
      action: 'rejected',
      reason: trimmed,
    })

    await supabase.from('notifications').insert({
      user_id: post.author_id,
      type: 'post_rejected',
      title: 'Bài đăng bị từ chối',
      message: `Lý do: ${trimmed}`,
      link: `/tin-cua-toi/${postId}`,
    })

    revalidatePath('/moderator')
    revalidatePath('/moderator/duyet-bai')
    return { ok: true, message: 'Đã từ chối bài' }
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN')
      return { ok: false, message: 'Không có quyền' }
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}

// =====================================================================
// HIDE POST (đã published → ẩn)
// =====================================================================
export async function hidePostAction(
  postId: string,
  reason: string
): Promise<ModerationResult> {
  try {
    const { supabase, user } = await requireModerator()

    const trimmed = reason.trim()
    if (trimmed.length < 3)
      return { ok: false, message: 'Vui lòng nhập lý do' }

    const { data: post } = await supabase
      .from('posts')
      .select('id, title, author_id, status')
      .eq('id', postId)
      .single()

    if (!post) return { ok: false, message: 'Không tìm thấy bài' }
    if (post.status !== 'published')
      return { ok: false, message: 'Chỉ ẩn được bài đã published' }

    const { error } = await supabase
      .from('posts')
      .update({
        status: 'archived',
        availability_status: 'hidden',
      })
      .eq('id', postId)

    if (error) return { ok: false, message: 'Không thể ẩn bài' }

    await supabase.from('post_reviews').insert({
      post_id: postId,
      moderator_id: user.id,
      action: 'hidden',
      reason: trimmed,
    })

    await supabase.from('notifications').insert({
      user_id: post.author_id,
      type: 'system',
      title: 'Bài đăng đã bị ẩn',
      message: `Lý do: ${trimmed}`,
      link: `/tin-cua-toi/${postId}`,
    })

    revalidatePath('/moderator/duyet-bai')
    revalidatePath('/')
    return { ok: true, message: 'Đã ẩn bài' }
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN')
      return { ok: false, message: 'Không có quyền' }
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}

// =====================================================================
// APPROVE REVISION (copy revision vào post gốc)
// =====================================================================
export async function approveRevisionAction(
  revisionId: string
): Promise<ModerationResult> {
  try {
    const { supabase, user } = await requireModerator()

    const { data: revision } = await supabase
      .from('post_revisions')
      .select(
        'id, post_id, title, description, price, area, address, province, ward, room_type, status'
      )
      .eq('id', revisionId)
      .single()

    if (!revision) return { ok: false, message: 'Không tìm thấy revision' }
    if (revision.status !== 'pending')
      return { ok: false, message: 'Revision không ở trạng thái chờ' }

    // Cập nhật post gốc với nội dung revision
    const { error: updateErr } = await supabase
      .from('posts')
      .update({
        title: revision.title,
        description: revision.description,
        price: revision.price,
        area: revision.area,
        address: revision.address,
        province: revision.province,
        ward: revision.ward,
        room_type: revision.room_type,
      })
      .eq('id', revision.post_id)

    if (updateErr)
      return { ok: false, message: 'Không thể cập nhật bài gốc' }

    // Xoá revision
    await supabase.from('post_revisions').delete().eq('id', revisionId)

    // Ghi log review
    await supabase.from('post_reviews').insert({
      post_id: revision.post_id,
      revision_id: revisionId,
      moderator_id: user.id,
      action: 'approved',
      reason: 'Duyệt bản chỉnh sửa',
    })

    // Notification cho tác giả
    const { data: post } = await supabase
      .from('posts')
      .select('author_id, title')
      .eq('id', revision.post_id)
      .single()

    if (post) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        type: 'post_approved',
        title: 'Bản chỉnh sửa đã được duyệt',
        message: `Bài "${post.title}" đã cập nhật nội dung mới.`,
        link: `/tin-cua-toi/${revision.post_id}`,
      })
    }

    revalidatePath('/moderator/duyet-bai')
    return { ok: true, message: 'Đã duyệt bản chỉnh sửa' }
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN')
      return { ok: false, message: 'Không có quyền' }
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}

// =====================================================================
// REJECT REVISION (xoá revision, giữ post gốc)
// =====================================================================
export async function rejectRevisionAction(
  revisionId: string,
  reason: string
): Promise<ModerationResult> {
  try {
    const { supabase, user } = await requireModerator()

    const trimmed = reason.trim()
    if (trimmed.length < 3)
      return { ok: false, message: 'Vui lòng nhập lý do' }

    const { data: revision } = await supabase
      .from('post_revisions')
      .select('id, post_id, status')
      .eq('id', revisionId)
      .single()

    if (!revision) return { ok: false, message: 'Không tìm thấy revision' }

    // Xoá revision
    await supabase.from('post_revisions').delete().eq('id', revisionId)

    // Ghi log
    await supabase.from('post_reviews').insert({
      post_id: revision.post_id,
      revision_id: revisionId,
      moderator_id: user.id,
      action: 'rejected',
      reason: trimmed,
    })

    // Notification
    const { data: post } = await supabase
      .from('posts')
      .select('author_id, title')
      .eq('id', revision.post_id)
      .single()

    if (post) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        type: 'post_rejected',
        title: 'Bản chỉnh sửa bị từ chối',
        message: `Lý do: ${trimmed}. Bài gốc vẫn giữ nguyên.`,
        link: `/tin-cua-toi/${revision.post_id}`,
      })
    }

    revalidatePath('/moderator/duyet-bai')
    return { ok: true, message: 'Đã từ chối bản chỉnh sửa' }
  } catch (e) {
    if (e instanceof Error && e.message === 'FORBIDDEN')
      return { ok: false, message: 'Không có quyền' }
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}
// =====================================================================
// REPORT: Bắt đầu xử lý (pending → reviewing)
// =====================================================================
export async function startReviewingReportAction(
  reportId: string
): Promise<ModerationResult> {
  try {
    const { supabase } = await requireModerator()

    const { error } = await supabase
      .from('reports')
      .update({ status: 'reviewing' })
      .eq('id', reportId)
      .eq('status', 'pending')

    if (error) return { ok: false, message: 'Không thể cập nhật' }

    revalidatePath('/moderator/bao-cao')
    return { ok: true, message: 'Đang xem xét báo cáo' }
  } catch {
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}

// =====================================================================
// REPORT: Đánh dấu vi phạm (resolved)
// =====================================================================
export async function resolveReportAction(
  reportId: string,
  note: string
): Promise<ModerationResult> {
  try {
    const { supabase, user } = await requireModerator()

    const trimmed = note.trim()

    const { error } = await supabase
      .from('reports')
      .update({
        status: 'resolved',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution_note: trimmed || null,
      })
      .eq('id', reportId)

    if (error) return { ok: false, message: 'Không thể cập nhật' }

    // Notify người báo cáo
    const { data: report } = await supabase
      .from('reports')
      .select('reporter_id, target_type')
      .eq('id', reportId)
      .single()

    if (report?.reporter_id) {
      await supabase.from('notifications').insert({
        user_id: report.reporter_id,
        type: 'report_result',
        title: 'Báo cáo của bạn đã được xử lý',
        message: 'Cảm ơn bạn. Chúng tôi đã xử lý vi phạm theo chính sách.',
        link: '/thong-bao',
      })
    }

    revalidatePath('/moderator/bao-cao')
    return { ok: true, message: 'Đã đánh dấu vi phạm' }
  } catch {
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}

// =====================================================================
// REPORT: Bỏ qua (dismissed)
// =====================================================================
export async function dismissReportAction(
  reportId: string,
  note: string
): Promise<ModerationResult> {
  try {
    const { supabase, user } = await requireModerator()

    const trimmed = note.trim()

    const { error } = await supabase
      .from('reports')
      .update({
        status: 'dismissed',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution_note: trimmed || null,
      })
      .eq('id', reportId)

    if (error) return { ok: false, message: 'Không thể cập nhật' }

    // Notify người báo cáo
    const { data: report } = await supabase
      .from('reports')
      .select('reporter_id')
      .eq('id', reportId)
      .single()

    if (report?.reporter_id) {
      await supabase.from('notifications').insert({
        user_id: report.reporter_id,
        type: 'report_result',
        title: 'Báo cáo của bạn đã được xem xét',
        message:
          'Sau khi kiểm tra, chúng tôi chưa phát hiện vi phạm. Cảm ơn bạn đã quan tâm.',
        link: '/thong-bao',
      })
    }

    revalidatePath('/moderator/bao-cao')
    return { ok: true, message: 'Đã bỏ qua báo cáo' }
  } catch {
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}