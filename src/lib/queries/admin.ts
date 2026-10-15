// =====================================================================
// Query helpers cho Moderator & Admin
// =====================================================================

import { unstable_noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// =====================================================================
// Kiểm tra user hiện tại có role mod/admin
// =====================================================================
export async function getCurrentUserRoles(): Promise<{
  userId: string | null
  isModerator: boolean
  isAdmin: boolean
}> {
  unstable_noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { userId: null, isModerator: false, isAdmin: false }
  }

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const roleSet = new Set((roles ?? []).map((r) => r.role))

  return {
    userId: user.id,
    isModerator: roleSet.has('moderator') || roleSet.has('admin'),
    isAdmin: roleSet.has('admin'),
  }
}

// =====================================================================
// MODERATOR: Queue bài pending
// =====================================================================
export interface PendingPost {
  id: string
  title: string
  description: string
  price: number
  area: number
  address: string
  province: string
  ward: string
  room_type: string
  submitted_at: string | null
  created_at: string
  author: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  } | null
  thumbnailUrl: string | null
  imageCount: number
}

export async function getPendingPosts(): Promise<PendingPost[]> {
  unstable_noStore()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id, title, description, price, area, address, province, ward,
      room_type, submitted_at, created_at,
      author:profiles!posts_author_id_fkey (
        id, username, full_name, avatar_url
      ),
      post_images (id, storage_path, sort_order)
    `
    )
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('submitted_at', { ascending: true })

  if (error || !data) return []

  return data.map((post) => {
    const images = [...(post.post_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )
    const thumbPath = images[0]?.storage_path
    const thumbnailUrl = thumbPath
      ? supabase.storage.from('post-images').getPublicUrl(thumbPath).data
          .publicUrl
      : null

    return {
      id: post.id,
      title: post.title,
      description: post.description,
      price: post.price,
      area: post.area,
      address: post.address,
      province: post.province,
      ward: post.ward,
      room_type: post.room_type,
      submitted_at: post.submitted_at,
      created_at: post.created_at,
      author: post.author,
      thumbnailUrl,
      imageCount: images.length,
    }
  })
}

// =====================================================================
// MODERATOR: Đếm số pending (cho badge/realtime)
// =====================================================================
export async function getPendingCount(): Promise<number> {
  unstable_noStore()

  const supabase = await createClient()
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .is('deleted_at', null)

  return count ?? 0
}

// =====================================================================
// MODERATOR: Queue revision pending
// =====================================================================
export interface PendingRevision {
  id: string
  post_id: string
  title: string
  price: number
  area: number
  province: string
  ward: string
  room_type: string
  created_at: string
  // Thông tin post gốc
  original_title: string
  author: {
    id: string
    username: string
    full_name: string | null
  } | null
}

export async function getPendingRevisions(): Promise<PendingRevision[]> {
  unstable_noStore()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('post_revisions')
    .select(
      `
      id, post_id, title, price, area, province, ward,
      room_type, created_at,
      post:posts!post_revisions_post_id_fkey (
        id, title,
        author:profiles!posts_author_id_fkey (
          id, username, full_name
        )
      )
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((rev) => {
    const post = rev.post as
      | {
          id: string
          title: string
          author: {
            id: string
            username: string
            full_name: string | null
          } | null
        }
      | null

    return {
      id: rev.id,
      post_id: rev.post_id,
      title: rev.title,
      price: rev.price,
      area: rev.area,
      province: rev.province,
      ward: rev.ward,
      room_type: rev.room_type,
      created_at: rev.created_at,
      original_title: post?.title ?? '—',
      author: post?.author ?? null,
    }
  })
}

// =====================================================================
// ADMIN: Thống kê tổng quan
// =====================================================================
export interface AdminStats {
  totalUsers: number
  totalPosts: number
  postsByStatus: Record<string, number>
  totalReports: number
  pendingReports: number
  totalComments: number
  totalLikes: number
  topProvinces: { province: string; count: number }[]
  recentSignups: number
}

export async function getAdminStats(): Promise<AdminStats> {
  unstable_noStore()

  const supabase = await createClient()

  const [
    usersRes,
    postsRes,
    postsStatusRes,
    reportsRes,
    pendingReportsRes,
    commentsRes,
    likesRes,
    provinceRes,
    recentUsersRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase.from('posts').select('status').is('deleted_at', null),
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase.from('post_likes').select('*', { count: 'exact', head: true }),
    supabase
      .from('posts')
      .select('province')
      .eq('status', 'published')
      .is('deleted_at', null),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Đếm status
  const postsByStatus: Record<string, number> = {}
  ;(postsStatusRes.data ?? []).forEach((p) => {
    postsByStatus[p.status] = (postsByStatus[p.status] ?? 0) + 1
  })

  // Top provinces
  const provinceCount: Record<string, number> = {}
  ;(provinceRes.data ?? []).forEach((p) => {
    provinceCount[p.province] = (provinceCount[p.province] ?? 0) + 1
  })
  const topProvinces = Object.entries(provinceCount)
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalUsers: usersRes.count ?? 0,
    totalPosts: postsRes.count ?? 0,
    postsByStatus,
    totalReports: reportsRes.count ?? 0,
    pendingReports: pendingReportsRes.count ?? 0,
    totalComments: commentsRes.count ?? 0,
    totalLikes: likesRes.count ?? 0,
    topProvinces,
    recentSignups: recentUsersRes.count ?? 0,
  }
}

// =====================================================================
// MODERATOR: Lịch sử kiểm duyệt gần đây
// =====================================================================
export interface ReviewLogItem {
  id: string
  action: string
  reason: string | null
  created_at: string
  post: { id: string; title: string } | null
  moderator: { id: string; username: string; full_name: string | null } | null
}

export async function getRecentReviews(limit = 20): Promise<ReviewLogItem[]> {
  unstable_noStore()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('post_reviews')
    .select(
      `
      id, action, reason, created_at,
      post:posts!post_reviews_post_id_fkey (id, title),
      moderator:profiles!post_reviews_moderator_id_fkey (
        id, username, full_name
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as unknown as ReviewLogItem[]
}
// =====================================================================
// MODERATOR: Đếm pending (đã có getPendingCount, thêm helper này cho nhanh)
// =====================================================================
export async function getModBadgeCounts() {
  unstable_noStore()

  const supabase = await createClient()

  const [postsRes, reportsRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  return {
    pendingPosts: postsRes.count ?? 0,
    pendingReports: reportsRes.count ?? 0,
  }
}
// =====================================================================
// MODERATOR: Queue báo cáo
// =====================================================================
export interface ReportItem {
  id: string
  target_type: 'post' | 'comment' | 'user'
  target_id: string
  reason: string
  description: string | null
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
  reporter: {
    id: string
    username: string
    full_name: string | null
  } | null
  resolved_by: string | null
  resolved_at: string | null
  resolution_note: string | null
  // Thông tin đối tượng bị báo cáo (chỉ có nếu là post)
  targetPost?: {
    id: string
    title: string
    status: string
    author_id: string
  } | null
  targetComment?: {
    id: string
    content: string
    post_id: string
  } | null
}

export async function getReports(status?: string): Promise<ReportItem[]> {
  unstable_noStore()

  const supabase = await createClient()

  let query = supabase
    .from('reports')
    .select(
      `
      id, target_type, target_id, reason, description, status,
      created_at, resolved_by, resolved_at, resolution_note,
      reporter:profiles!reports_reporter_id_fkey (
        id, username, full_name
      )
    `
    )
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status as never)
  }

  const { data, error } = await query
  if (error || !data) return []

  // Fetch post/comment info cho từng report
  const postIds = data
    .filter((r) => r.target_type === 'post')
    .map((r) => r.target_id)
  const commentIds = data
    .filter((r) => r.target_type === 'comment')
    .map((r) => r.target_id)

  const [postsRes, commentsRes] = await Promise.all([
    postIds.length > 0
      ? supabase
          .from('posts')
          .select('id, title, status, author_id')
          .in('id', postIds)
      : Promise.resolve({ data: [], error: null }),
    commentIds.length > 0
      ? supabase
          .from('comments')
          .select('id, content, post_id')
          .in('id', commentIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const postsMap = new Map(
    (postsRes.data ?? []).map((p) => [p.id, p])
  )
  const commentsMap = new Map(
    (commentsRes.data ?? []).map((c) => [c.id, c])
  )

  return data.map((r) => ({
    ...r,
    target_type: r.target_type as 'post' | 'comment' | 'user',
    status: r.status as
      | 'pending'
      | 'reviewing'
      | 'resolved'
      | 'dismissed',
    targetPost:
      r.target_type === 'post' ? postsMap.get(r.target_id) ?? null : null,
    targetComment:
      r.target_type === 'comment'
        ? commentsMap.get(r.target_id) ?? null
        : null,
  })) as ReportItem[]
}

export async function getReportStats() {
  unstable_noStore()

  const supabase = await createClient()

  const [pending, resolved, dismissed] = await Promise.all([
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved'),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'dismissed'),
  ])

  return {
    pending: pending.count ?? 0,
    resolved: resolved.count ?? 0,
    dismissed: dismissed.count ?? 0,
    total:
      (pending.count ?? 0) +
      (resolved.count ?? 0) +
      (dismissed.count ?? 0),
  }
}
// =====================================================================
// ADMIN: Danh sách user
// =====================================================================
export interface AdminUser {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  last_sign_in_at: string | null
  roles: string[]
  isBanned: boolean
  bannedUntil: string | null
  restrictionTypes: string[]
}

export async function getUsers(options?: {
  search?: string
  role?: string
  status?: 'all' | 'active' | 'banned'
}): Promise<AdminUser[]> {
  unstable_noStore()

  const supabase = await createClient()

  // Lấy profiles + user_roles
  let query = supabase
    .from('profiles')
        .select(
      `
      id, username, full_name, avatar_url, phone, created_at,
      user_roles!user_roles_user_id_fkey (role)
    `
    )
    .order('created_at', { ascending: false })

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`
    query = query.or(
      `username.ilike.${term},full_name.ilike.${term}`
    )
  }

  const { data: profiles, error } = await query
  if (error || !profiles) return []

  // Lấy email + last_sign_in_at từ auth.users (qua RPC? hoặc join)
  // Dùng RPC để lấy (vì không query trực tiếp auth.users qua PostgREST)
  const userIds = profiles.map((p) => p.id)

  // Lấy restrictions
  const { data: restrictions } = await supabase
    .from('user_restrictions')
    .select('user_id, restriction_type, ends_at')
    .in('user_id', userIds)

  const now = new Date()
  const restrictionsByUser = new Map<string, typeof restrictions>()
  ;(restrictions ?? []).forEach((r) => {
    if (!restrictionsByUser.has(r.user_id)) {
      restrictionsByUser.set(r.user_id, [])
    }
    restrictionsByUser.get(r.user_id)!.push(r)
  })

  // Enrich với email — dùng supabase.auth.admin? Không có.
  // Thay vào đó dùng RPC hoặc chấp nhận không có email
  const users: AdminUser[] = profiles.map((p) => {
    const userRestrictions = restrictionsByUser.get(p.id) ?? []
    const activeRestrictions = userRestrictions.filter(
      (r) => r.ends_at === null || new Date(r.ends_at) > now
    )

    const roles = ((p.user_roles ?? []) as unknown as { role: string }[]).map(
  (r) => r.role
)

    return {
      id: p.id,
      email: '', // sẽ bổ sung qua RPC
      username: p.username,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      phone: p.phone,
      created_at: p.created_at,
      last_sign_in_at: null,
      roles,
      isBanned: activeRestrictions.some(
        (r) =>
          r.restriction_type === 'login_ban' ||
          r.restriction_type === 'full_ban'
      ),
      bannedUntil:
        activeRestrictions.find(
          (r) =>
            r.restriction_type === 'login_ban' ||
            r.restriction_type === 'full_ban'
        )?.ends_at ?? null,
      restrictionTypes: activeRestrictions.map((r) => r.restriction_type),
    }
  })

  // Filter theo role/status nếu có
  let filtered = users
  if (options?.role && options.role !== 'all') {
    filtered = filtered.filter((u) => u.roles.includes(options.role!))
  }
  if (options?.status === 'banned') {
    filtered = filtered.filter((u) => u.isBanned)
  } else if (options?.status === 'active') {
    filtered = filtered.filter((u) => !u.isBanned)
  }

  return filtered
}

export async function getUserStats() {
  unstable_noStore()

  const supabase = await createClient()

  const [usersRes, bannedRes, modsRes, adminsRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('user_restrictions')
      .select('user_id', { count: 'exact', head: true })
      .in('restriction_type', ['login_ban', 'full_ban'])
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`),
    supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'moderator'),
    supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin'),
  ])

  return {
    total: usersRes.count ?? 0,
    banned: bannedRes.count ?? 0,
    moderators: modsRes.count ?? 0,
    admins: adminsRes.count ?? 0,
  }
}

// =====================================================================
// ADMIN: RPC lấy email user (dùng SQL function)
// =====================================================================
export async function getUserEmails(userIds: string[]): Promise<Record<string, string>> {
  unstable_noStore()

  if (userIds.length === 0) return {}

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_user_emails', {
    user_ids: userIds,
  })

  if (error || !data) return {}

  const map: Record<string, string> = {}
  ;(data as { id: string; email: string }[]).forEach((row) => {
    map[row.id] = row.email
  })
  return map
}