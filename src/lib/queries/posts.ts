// =====================================================================
// Query helpers cho posts (server-side)
// Tập trung logic SELECT để tái sử dụng ở trang chủ, danh sách, chi tiết
// =====================================================================

import { createClient } from '@/lib/supabase/server'
import type { Post, PostImage, Amenity } from '@/types/app'

export interface PublicPostListItem extends Post {
  post_images: Pick<PostImage, 'id' | 'storage_path' | 'sort_order'>[]
}

export interface PostWithDetails extends Post {
  post_images: Pick<PostImage, 'id' | 'storage_path' | 'sort_order' | 'alt_text'>[]
  post_amenities: {
    amenity_id: string
    amenities: Pick<Amenity, 'id' | 'name' | 'slug' | 'icon' | 'category'> | null
  }[]
  author: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    phone: string | null
  } | null
}

// =====================================================================
// Lấy danh sách bài published mới nhất (cho trang chủ)
// =====================================================================
export async function getLatestPublishedPosts(limit = 8) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      post_images (id, storage_path, sort_order)
    `
    )
    .eq('status', 'published')
    .eq('availability_status', 'available')
    .is('deleted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error }
console.log('[LATEST OK] count =', data?.length)
  // Resolve thumbnail URL
  const posts = (data ?? []).map((post) => {
    const images = [...(post.post_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )
    const thumbPath = images[0]?.storage_path
    const thumbnailUrl = thumbPath
      ? supabase.storage.from('post-images').getPublicUrl(thumbPath).data
          .publicUrl
      : null

    return {
      ...post,
      thumbnailUrl,
    }
  })

  return { data: posts, error: null }
}

export type LatestPost = Awaited<
  ReturnType<typeof getLatestPublishedPosts>
>['data'][number]

// =====================================================================
// Lấy chi tiết 1 bài theo id (chỉ published)
// =====================================================================
export async function getPublishedPostById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      post_images (id, storage_path, sort_order, alt_text),
      post_amenities (
        amenity_id,
        amenities (id, name, slug, icon, category)
      ),
      author:profiles!posts_author_id_fkey (
        id, username, full_name, avatar_url, phone
      )
    `
    )
    .eq('id', id)
    .eq('status', 'published')
    .eq('availability_status', 'available')
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return { data: null, error }

  // Resolve image URLs
  const sortedImages = [...(data.post_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const imageUrls = sortedImages.map((img) => ({
    id: img.id,
    url: supabase.storage.from('post-images').getPublicUrl(img.storage_path)
      .data.publicUrl,
    altText: img.alt_text,
  }))

  // Resolve author avatar URL
  let authorAvatarUrl: string | null = null
  if (data.author?.avatar_url) {
    authorAvatarUrl = supabase.storage
      .from('avatars')
      .getPublicUrl(data.author.avatar_url).data.publicUrl
  }

  return {
    data: {
      ...data,
      imageUrls,
      authorAvatarUrl,
    },
    error: null,
  }
}

export type PublishedPostDetail = NonNullable<
  Awaited<ReturnType<typeof getPublishedPostById>>['data']
>
// =====================================================================
// Search + filter + sort + pagination cho trang /phong
// =====================================================================
export interface SearchPostsParams {
  q?: string
  province?: string
  ward?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  roomType?: string
  amenityIds?: string[]
  sort?: 'newest' | 'price_asc' | 'price_desc'
  page?: number
}

export async function searchPublishedPosts(params: SearchPostsParams) {
  const supabase = await createClient()

  const {
    q,
    province,
    ward,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    roomType,
    amenityIds,
    sort = 'newest',
    page = 1,
  } = params

  const pageSize = 12
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Nếu có filter tiện nghi → pre-query danh sách post_id
  let postIdsFromAmenities: string[] | null = null
  if (amenityIds && amenityIds.length > 0) {
    const { data: pa } = await supabase
      .from('post_amenities')
      .select('post_id, amenity_id')
      .in('amenity_id', amenityIds)

    if (!pa || pa.length === 0) {
      return { data: [], total: 0, page, pageSize }
    }

    // Đếm số tiện nghi match cho từng post
    const countByPost: Record<string, Set<string>> = {}
    for (const row of pa) {
      if (!countByPost[row.post_id]) countByPost[row.post_id] = new Set()
      countByPost[row.post_id].add(row.amenity_id)
    }

    // Chỉ giữ post có ĐỦ tiện nghi user chọn (AND logic)
    postIdsFromAmenities = Object.entries(countByPost)
      .filter(([, set]) => set.size === amenityIds.length)
      .map(([id]) => id)

    if (postIdsFromAmenities.length === 0) {
      return { data: [], total: 0, page, pageSize }
    }
  }

  // Build query
  let query = supabase
    .from('posts')
    .select(
      `
      *,
      post_images (id, storage_path, sort_order)
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .eq('availability_status', 'available')
    .is('deleted_at', null)
    .gt('expires_at', new Date().toISOString())

  // Search
  if (q && q.trim().length >= 2) {
    const term = `%${q.trim()}%`
    query = query.or(`title.ilike.${term},description.ilike.${term}`)
  }

  // Location
  if (province) query = query.eq('province', province)
  if (ward) query = query.ilike('ward', `%${ward}%`)

  // Price
  if (minPrice !== undefined && minPrice > 0) query = query.gte('price', minPrice)
  if (maxPrice !== undefined && maxPrice > 0) query = query.lte('price', maxPrice)

  // Area
  if (minArea !== undefined && minArea > 0) query = query.gte('area', minArea)
  if (maxArea !== undefined && maxArea > 0) query = query.lte('area', maxArea)

  // Room type
  if (roomType) {
    query = query.eq('room_type', roomType as never)
  }

  // Amenities
  if (postIdsFromAmenities) {
    query = query.in('id', postIdsFromAmenities)
  }

  // Sort
  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    query = query.order('published_at', { ascending: false })
  }

  // Pagination
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    return { data: [], total: 0, page, pageSize }
  }

  // Resolve thumbnail
  const posts = (data ?? []).map((post) => {
    const images = [...(post.post_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )
    const thumbPath = images[0]?.storage_path
    const thumbnailUrl = thumbPath
      ? supabase.storage.from('post-images').getPublicUrl(thumbPath).data
          .publicUrl
      : null
    return { ...post, thumbnailUrl }
  })

  return { data: posts, total: count ?? 0, page, pageSize }
}

export type SearchPostResult = Awaited<
  ReturnType<typeof searchPublishedPosts>
>['data'][number]
// =====================================================================
// Lấy danh sách amenities active để render bộ lọc
// =====================================================================
export async function getActiveAmenities() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('amenities')
    .select('id, name, category, slug, icon')
    .eq('is_active', true)
    .order('category')
    .order('name')
  return data ?? []
}

export type AmenityOption = Awaited<
  ReturnType<typeof getActiveAmenities>
>[number]