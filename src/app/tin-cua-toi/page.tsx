import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PlusCircle, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { PostCard } from './_components/PostCard'
import { cn } from '@/lib/utils'
import { POST_STATUS_LABELS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Tin của tôi',
}

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'draft', label: POST_STATUS_LABELS.draft },
  { value: 'pending', label: POST_STATUS_LABELS.pending },
  { value: 'published', label: POST_STATUS_LABELS.published },
  { value: 'rejected', label: POST_STATUS_LABELS.rejected },
] as const

interface Props {
  searchParams: Promise<{ status?: string; created?: string }>
}

export default async function MyPostsPage({ searchParams }: Props) {
  const sp = await searchParams
  const filter = sp.status ?? 'all'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/dang-nhap?next=/tin-cua-toi')

  // Query posts
  let query = supabase
    .from('posts')
    .select(
      `
      *,
      post_images (id, storage_path, sort_order)
    `
    )
    .eq('author_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filter !== 'all') {
  query = query.eq(
    'status',
    filter as 'draft' | 'pending' | 'published' | 'rejected' | 'archived'
  )
}

  const { data: posts, error } = await query

  // Đếm theo status để hiện số trên tab
  const { data: counts } = await supabase
    .from('posts')
    .select('status')
    .eq('author_id', user.id)
    .is('deleted_at', null)

  const countByStatus = (counts ?? []).reduce<Record<string, number>>(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      acc.all = (acc.all ?? 0) + 1
      return acc
    },
    { all: 0 }
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tin của tôi</h1>
          <p className="text-sm text-slate-600">
            Quản lý tin đăng cho thuê của bạn
          </p>
        </div>
<Link
  href="/tin-moi"
  className={buttonVariants()}
>
  <PlusCircle className="mr-2 h-4 w-4" />
  Đăng tin mới
</Link>
      </div>

      {/* Thông báo tạo thành công */}
      {sp.created && (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ Đã lưu tin đăng. Bạn có thể gửi duyệt khi sẵn sàng.
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b">
        {FILTERS.map((f) => {
          const active = filter === f.value
          const count = countByStatus[f.value] ?? 0
          return (
            <Link
              key={f.value}
              href={
                f.value === 'all'
                  ? '/tin-cua-toi'
                  : `/tin-cua-toi?status=${f.value}`
              }
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={cn(
                    'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* List */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không thể tải danh sách tin. Vui lòng thử lại.
        </div>
      )}

      {!error && (!posts || posts.length === 0) && (
        <EmptyState filter={filter} />
      )}

      {!error && posts && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => {
            // Lấy ảnh có sort_order nhỏ nhất (ảnh chính)
            const images = [...(post.post_images ?? [])].sort(
              (a, b) => a.sort_order - b.sort_order
            )
            const firstImage = images[0]

            const thumbnailUrl = firstImage
              ? supabase.storage
                  .from('post-images')
                  .getPublicUrl(firstImage.storage_path).data.publicUrl
              : null

            return (
              <PostCard key={post.id} post={post} thumbnailUrl={thumbnailUrl} />
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ filter }: { filter: string }) {
  const isFiltered = filter !== 'all'

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 py-16 px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
        <FileText className="h-7 w-7 text-slate-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        {isFiltered ? 'Không có tin nào ở mục này' : 'Chưa có tin đăng nào'}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-slate-600">
        {isFiltered
          ? 'Thử chọn mục khác hoặc tạo tin mới.'
          : 'Bắt đầu đăng tin đầu tiên của bạn để cho thuê phòng.'}
      </p>
      <Link href="/tin-moi" className={buttonVariants()}>
  <PlusCircle className="mr-2 h-4 w-4" />
  Đăng tin đầu tiên
</Link>
    </div>
  )
}