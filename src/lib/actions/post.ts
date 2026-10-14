'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { postSchema } from '@/lib/validations/post'
import { POST_DURATION_DAYS } from '@/lib/constants'
import type { PostStatus } from '@/types/app'

export type PostActionState = {
  ok: boolean
  message: string
  errors?: Record<string, string[]>
  postId?: string
}

// =====================================================================
// Helper: lấy user hiện tại, throw nếu chưa đăng nhập
// =====================================================================
async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHENTICATED')
  return { supabase, user }
}

// =====================================================================
// Helper: kiểm tra user có bị post_ban / full_ban không
// =====================================================================
async function checkPostBan(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_restrictions')
    .select('restriction_type, ends_at')
    .eq('user_id', userId)
    .in('restriction_type', ['post_ban', 'full_ban'])

  if (!data) return false
  const now = new Date()
  return data.some(
    (r) => r.ends_at === null || new Date(r.ends_at) > now
  )
}

// =====================================================================
// Helper: parse FormData thành object để Zod validate
// =====================================================================
function parsePostFormData(formData: FormData) {
  const amenityIds = formData.getAll('amenityIds').map(String).filter(Boolean)
  return {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    price: Number(formData.get('price') ?? 0),
    area: Number(formData.get('area') ?? 0),
    address: String(formData.get('address') ?? '').trim(),
    province: String(formData.get('province') ?? '').trim(),
    ward: String(formData.get('ward') ?? '').trim(),
    roomType: String(formData.get('roomType') ?? ''),
    amenityIds,
  }
}

// =====================================================================
// CREATE — Tạo bài mới
// status = 'draft' (mặc định) hoặc 'pending' (nếu bấm "Gửi duyệt luôn")
// =====================================================================
export async function createPostAction(
  _prevState: PostActionState | null,
  formData: FormData
): Promise<PostActionState> {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireUser())
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập để đăng tin' }
  }

  // Check ban
  const banned = await checkPostBan(user.id)
  if (banned) {
    return {
      ok: false,
      message: 'Tài khoản của bạn đang bị hạn chế đăng tin',
    }
  }

  // Validate
  const raw = parsePostFormData(formData)
  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Dữ liệu không hợp lệ',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Ảnh — đã upload trước đó ở client, gửi lên dạng mảng path
  const imagePaths = formData.getAll('imagePaths').map(String).filter(Boolean)
  if (imagePaths.length === 0) {
    return {
      ok: false,
      message: 'Vui lòng thêm ít nhất 1 ảnh',
    }
  }
  if (imagePaths.length > 10) {
    return { ok: false, message: 'Tối đa 10 ảnh' }
  }

  const submitNow = formData.get('submitNow') === 'true'
  const status: PostStatus = submitNow ? 'pending' : 'draft'

  // Insert post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      area: parsed.data.area,
      address: parsed.data.address,
      province: parsed.data.province,
      ward: parsed.data.ward,
      room_type: parsed.data.roomType,
      status,
      submitted_at: submitNow ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (postError || !post) {
    return { ok: false, message: 'Không thể tạo bài đăng' }
  }

  // Insert ảnh (sort theo thứ tự gửi lên)
  const imageRows = imagePaths.map((path, idx) => ({
    post_id: post.id,
    storage_path: path,
    sort_order: idx,
  }))

  const { error: imgError } = await supabase
    .from('post_images')
    .insert(imageRows)

  if (imgError) {
    // Rollback: xoá post
    await supabase.from('posts').delete().eq('id', post.id)
    return { ok: false, message: 'Không thể lưu ảnh' }
  }

  // Insert amenities
  if (parsed.data.amenityIds.length > 0) {
    const amenityRows = parsed.data.amenityIds.map((id) => ({
      post_id: post.id,
      amenity_id: id,
    }))
    await supabase.from('post_amenities').insert(amenityRows)
  }

  revalidatePath('/tin-cua-toi')
  redirect(`/tin-cua-toi?created=${post.id}`)
}

// =====================================================================
// UPDATE — Sửa bài
// Nếu post đang draft/rejected → update trực tiếp
// Nếu post đang published/pending → tạo revision (không sửa ảnh)
// =====================================================================
export async function updatePostAction(
  postId: string,
  _prevState: PostActionState | null,
  formData: FormData
): Promise<PostActionState> {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireUser())
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }

  // Check ownership
  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, status')
    .eq('id', postId)
    .single()

  if (!post) return { ok: false, message: 'Không tìm thấy bài đăng' }
  if (post.author_id !== user.id) {
    return { ok: false, message: 'Bạn không có quyền sửa bài này' }
  }

  // Validate
  const raw = parsePostFormData(formData)
  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Dữ liệu không hợp lệ',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const submitNow = formData.get('submitNow') === 'true'

  // --- TRƯỜNG HỢP: draft / rejected → update trực tiếp ---
  if (post.status === 'draft' || post.status === 'rejected') {
    const newStatus: PostStatus = submitNow ? 'pending' : 'draft'

    const { error } = await supabase
      .from('posts')
      .update({
        title: parsed.data.title,
        description: parsed.data.description,
        price: parsed.data.price,
        area: parsed.data.area,
        address: parsed.data.address,
        province: parsed.data.province,
        ward: parsed.data.ward,
        room_type: parsed.data.roomType,
        status: newStatus,
        submitted_at: submitNow ? new Date().toISOString() : null,
      })
      .eq('id', postId)

    if (error) return { ok: false, message: 'Không thể cập nhật' }

    // Update amenities
    await supabase.from('post_amenities').delete().eq('post_id', postId)
    if (parsed.data.amenityIds.length > 0) {
      await supabase.from('post_amenities').insert(
        parsed.data.amenityIds.map((id) => ({
          post_id: postId,
          amenity_id: id,
        }))
      )
    }

    // Update ảnh: xoá hết rồi insert mới (draft/rejected thì cho phép)
    const imagePaths = formData
      .getAll('imagePaths')
      .map(String)
      .filter(Boolean)

    if (imagePaths.length > 0) {
      await supabase.from('post_images').delete().eq('post_id', postId)
      await supabase.from('post_images').insert(
        imagePaths.map((path, idx) => ({
          post_id: postId,
          storage_path: path,
          sort_order: idx,
        }))
      )
    }

    revalidatePath('/tin-cua-toi')
    revalidatePath(`/tin-cua-toi/${postId}`)
    return { ok: true, message: 'Đã cập nhật bài đăng' }
  }

  // --- TRƯỜNG HỢP: published / pending → tạo revision ---
  // Xoá revision cũ nếu có
  await supabase
    .from('post_revisions')
    .delete()
    .eq('post_id', postId)
    .eq('status', 'pending')

  // Tạo revision mới
  const { error: revError } = await supabase.from('post_revisions').insert({
    post_id: postId,
    title: parsed.data.title,
    description: parsed.data.description,
    price: parsed.data.price,
    area: parsed.data.area,
    address: parsed.data.address,
    province: parsed.data.province,
    ward: parsed.data.ward,
    room_type: parsed.data.roomType,
    status: 'pending',
  })

  if (revError) {
    return { ok: false, message: 'Không thể tạo bản chỉnh sửa' }
  }

  revalidatePath('/tin-cua-toi')
  revalidatePath(`/tin-cua-toi/${postId}`)
  return {
    ok: true,
    message: 'Đã gửi bản chỉnh sửa để chờ duyệt',
  }
}

// =====================================================================
// SUBMIT — Gửi duyệt (draft → pending)
// =====================================================================
export async function submitPostAction(
  postId: string
): Promise<PostActionState> {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireUser())
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }

  // Check ownership
  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, status')
    .eq('id', postId)
    .single()

  if (!post) return { ok: false, message: 'Không tìm thấy bài' }
  if (post.author_id !== user.id) {
    return { ok: false, message: 'Không có quyền' }
  }
  if (post.status !== 'draft' && post.status !== 'rejected') {
    return { ok: false, message: 'Bài đăng không ở trạng thái có thể gửi duyệt' }
  }

  // Check có ảnh
  const { count } = await supabase
    .from('post_images')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (!count || count === 0) {
    return { ok: false, message: 'Cần ít nhất 1 ảnh để gửi duyệt' }
  }

  const { error } = await supabase
    .from('posts')
    .update({
      status: 'pending',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) return { ok: false, message: 'Không thể gửi duyệt' }

  revalidatePath('/tin-cua-toi')
  revalidatePath(`/tin-cua-toi/${postId}`)
  return { ok: true, message: 'Đã gửi bài để chờ duyệt' }
}

// =====================================================================
// DELETE — Xoá mềm (set deleted_at)
// =====================================================================
export async function deletePostAction(
  postId: string
): Promise<PostActionState> {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireUser())
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id')
    .eq('id', postId)
    .single()

  if (!post) return { ok: false, message: 'Không tìm thấy bài' }
  if (post.author_id !== user.id) {
    return { ok: false, message: 'Không có quyền xoá' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId)

  if (error) return { ok: false, message: 'Không thể xoá' }

  revalidatePath('/tin-cua-toi')
  return { ok: true, message: 'Đã xoá bài đăng' }
}

// =====================================================================
// MARK AVAILABILITY — Đánh dấu đã cho thuê / còn trống
// =====================================================================
export async function markAvailabilityAction(
  postId: string,
  availability: 'available' | 'rented' | 'hidden'
): Promise<PostActionState> {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireUser())
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id')
    .eq('id', postId)
    .single()

  if (!post) return { ok: false, message: 'Không tìm thấy bài' }
  if (post.author_id !== user.id) {
    return { ok: false, message: 'Không có quyền' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ availability_status: availability })
    .eq('id', postId)

  if (error) return { ok: false, message: 'Không thể cập nhật' }

  revalidatePath('/tin-cua-toi')
  revalidatePath(`/tin-cua-toi/${postId}`)
  return { ok: true, message: 'Đã cập nhật trạng thái' }
}

// =====================================================================
// APPROVE / REJECT — Dành cho moderator
// =====================================================================
export async function approvePostAction(
  postId: string
): Promise<PostActionState> {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireUser())
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }

  // Check role
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['moderator', 'admin'])

  if (!roles || roles.length === 0) {
    return { ok: false, message: 'Không có quyền duyệt bài' }
  }

  // Check post
  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, title, status')
    .eq('id', postId)
    .single()

  if (!post) return { ok: false, message: 'Không tìm thấy bài' }
  if (post.status !== 'pending') {
    return { ok: false, message: 'Bài không ở trạng thái chờ duyệt' }
  }

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

  // Ghi post_reviews
  await supabase.from('post_reviews').insert({
    post_id: postId,
    moderator_id: user.id,
    action: 'approved',
  })

  // Tạo notification cho tác giả
  await supabase.from('notifications').insert({
    user_id: post.author_id,
    type: 'post_approved',
    title: 'Bài đăng đã được duyệt',
    message: `Bài "${post.title}" của bạn đã được đăng công khai.`,
    link: `/tin-cua-toi/${postId}`,
  })

  revalidatePath('/moderator')
  revalidatePath('/')
  return { ok: true, message: 'Đã duyệt bài' }
}

export async function rejectPostAction(
  postId: string,
  reason: string
): Promise<PostActionState> {
  let supabase
  let user
  try {
    ;({ supabase, user } = await requireUser())
  } catch {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }

  if (!reason || reason.trim().length < 3) {
    return { ok: false, message: 'Vui lòng nhập lý do từ chối' }
  }

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['moderator', 'admin'])

  if (!roles || roles.length === 0) {
    return { ok: false, message: 'Không có quyền' }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, title, status')
    .eq('id', postId)
    .single()

  if (!post) return { ok: false, message: 'Không tìm thấy bài' }
  if (post.status !== 'pending') {
    return { ok: false, message: 'Bài không ở trạng thái chờ duyệt' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ status: 'rejected' })
    .eq('id', postId)

  if (error) return { ok: false, message: 'Không thể từ chối' }

  // Ghi post_reviews
  await supabase.from('post_reviews').insert({
    post_id: postId,
    moderator_id: user.id,
    action: 'rejected',
    reason: reason.trim(),
  })

  // Notification
  await supabase.from('notifications').insert({
    user_id: post.author_id,
    type: 'post_rejected',
    title: 'Bài đăng bị từ chối',
    message: `Lý do: ${reason.trim()}`,
    link: `/tin-cua-toi/${postId}`,
  })

  revalidatePath('/moderator')
  return { ok: true, message: 'Đã từ chối bài' }
}