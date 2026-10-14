import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Maximize2,
  Calendar,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import {
  PostStatusBadge,
  AvailabilityBadge,
} from '../_components/PostStatusBadge'
import {
  formatPrice,
  formatArea,
  formatDate,
  formatDateTime,
  getRoomTypeLabel,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Chi tiết tin đăng',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function MyPostDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/dang-nhap?next=/tin-cua-toi/${id}`)

  // Fetch post
  const { data: post } = await supabase
    .from('posts')
    .select(
      `
      *,
      post_images (id, storage_path, sort_order),
      post_amenities (amenity_id, amenities (id, name, slug)),
      post_revisions (
        id, title, description, price, area, address, province, ward,
        room_type, status, review_note, created_at
      )
    `
    )
    .eq('id', id)
    .eq('author_id', user.id)
    .maybeSingle()

  if (!post) notFound()

  // Lấy review gần nhất (nếu bị reject)
  const { data: lastReview } = await supabase
    .from('post_reviews')
    .select('action, reason, created_at')
    .eq('post_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Resolve ảnh
  const sortedImages = [...(post.post_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const imageUrls = sortedImages.map((img) => ({
    id: img.id,
    url: supabase.storage
      .from('post-images')
      .getPublicUrl(img.storage_path).data.publicUrl,
  }))

  // Revision pending (nếu có)
  const pendingRevision = (post.post_revisions ?? []).find(
    (r) => r.status === 'pending'
  )

  const amenities = (post.post_amenities ?? [])
    .map((pa) => pa.amenities)
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/tin-cua-toi"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PostStatusBadge status={post.status} />
            {post.status === 'published' && (
              <AvailabilityBadge availability={post.availability_status} />
            )}
            {pendingRevision && (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Có bản chỉnh sửa chờ duyệt
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{post.title}</h1>
        </div>

        <Link
          href={`/tin-cua-toi/${post.id}/sua`}
          className={buttonVariants({ variant: 'outline' })}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Sửa tin
        </Link>
      </div>

      {/* Reject reason */}
      {post.status === 'rejected' && lastReview?.reason && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="text-sm">
              <p className="font-medium text-red-800">Bài bị từ chối</p>
              <p className="mt-1 text-red-700">Lý do: {lastReview.reason}</p>
              <p className="mt-1 text-xs text-red-600">
                {formatDateTime(lastReview.created_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revision pending warning */}
      {pendingRevision && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="font-medium text-amber-800">
            Đang chờ duyệt bản chỉnh sửa
          </p>
          <p className="mt-1 text-amber-700">
            Nội dung công khai vẫn là bản cũ cho tới khi moderator duyệt bản
            chỉnh sửa. Bản chỉnh sửa tạo lúc{' '}
            {formatDateTime(pendingRevision.created_at)}.
          </p>
        </div>
      )}

      {/* Images gallery */}
      {imageUrls.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {imageUrls.map((img, idx) => (
            <div
              key={img.id}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md border bg-slate-100',
                idx === 0 && 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2'
              )}
            >
              <img
                src={img.url}
                alt={`Ảnh ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              {idx === 0 && (
                <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Ảnh chính
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <section className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Thông tin cho thuê</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-600">Giá thuê</dt>
                <dd className="font-semibold text-primary">
                  {formatPrice(post.price)}
                </dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-600">Diện tích</dt>
                <dd className="font-medium">{formatArea(post.area)}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-600">Loại phòng</dt>
                <dd className="font-medium">
                  {getRoomTypeLabel(post.room_type)}
                </dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-600">Địa chỉ</dt>
                <dd className="font-medium text-right">
                  {post.address}, {post.ward}, {post.province}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Mô tả</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
              {post.description}
            </p>
          </section>

          {amenities.length > 0 && (
            <section className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Tiện nghi</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) =>
                  a ? (
                    <span
                      key={a.id}
                      className="rounded-full border bg-slate-50 px-3 py-1 text-sm text-slate-700"
                    >
                      {a.name}
                    </span>
                  ) : null
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar meta */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4 text-sm">
            <h3 className="mb-3 font-semibold">Thống kê</h3>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{post.view_count} lượt xem</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Tạo: {formatDate(post.created_at)}</span>
              </div>
              {post.published_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Đăng: {formatDate(post.published_at)}</span>
                </div>
              )}
              {post.expires_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Hết hạn: {formatDate(post.expires_at)}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}