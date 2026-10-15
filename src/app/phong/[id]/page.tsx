import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Maximize2,
  Building2,
  Calendar,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPublishedPostById } from '@/lib/queries/posts'
import { getUserInteractions } from '@/lib/actions/interaction'
import {
  formatPrice,
  formatArea,
  formatDate,
  getRoomTypeLabel,
} from '@/lib/constants'
import { ImageGallery } from './_components/ImageGallery'
import { ContactBox } from './_components/ContactBox'
import { ViewCounter } from './_components/ViewCounter'
import { LikeButton } from './_components/LikeButton'
import { FavoriteButton } from './_components/FavoriteButton'
import { ReportButton } from './_components/ReportButton'
import { CommentsSection } from './_components/CommentsSection'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: post } = await getPublishedPostById(id)

  if (!post) return { title: 'Không tìm thấy tin' }

  return {
    title: post.title,
    description: post.description.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.description.slice(0, 160),
      images: post.imageUrls[0] ? [post.imageUrls[0].url] : [],
    },
  }
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params

  const { data: post } = await getPublishedPostById(id)
  if (!post) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const interactions = await getUserInteractions(post.id)

  const amenities = post.post_amenities
    .map((pa) => pa.amenities)
    .filter((a): a is NonNullable<typeof a> => a !== null)

  const authorName =
    post.author?.full_name ?? post.author?.username ?? 'Người đăng'
  const authorInitial = authorName.charAt(0).toUpperCase()

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <ViewCounter postId={post.id} />

      <Link
        href="/phong"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {post.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {post.ward}, {post.province}
          </span>

          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Đăng ngày {formatDate(post.published_at)}
          </span>

          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {post.view_count} lượt xem
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <LikeButton
            postId={post.id}
            initialLiked={interactions.isLiked}
            initialCount={interactions.likeCount}
            isLoggedIn={isLoggedIn}
          />
          <FavoriteButton
            postId={post.id}
            initialFavorited={interactions.isFavorited}
            isLoggedIn={isLoggedIn}
          />
          <ReportButton
            targetType="post"
            targetId={post.id}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      {post.imageUrls.length > 0 && (
        <div className="mb-6">
          <ImageGallery images={post.imageUrls} title={post.title} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <section className="rounded-lg border bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">
              Thông tin cho thuê
            </h2>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem
                label="Giá thuê"
                value={
                  <span className="text-base font-bold text-primary">
                    {formatPrice(post.price)}
                  </span>
                }
              />

              <InfoItem
                label="Diện tích"
                value={
                  <span className="flex items-center gap-1 font-medium">
                    <Maximize2 className="h-4 w-4 text-slate-500" />
                    {formatArea(post.area)}
                  </span>
                }
              />

              <InfoItem
                label="Loại phòng"
                value={
                  <span className="flex items-center gap-1 font-medium">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    {getRoomTypeLabel(post.room_type)}
                  </span>
                }
              />
            </dl>

            <div className="mt-5 border-t pt-5">
              <p className="mb-1 text-sm text-slate-500">Địa chỉ</p>
              <p className="font-medium text-slate-900">
                {post.address}, {post.ward}, {post.province}
              </p>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold">
              Mô tả chi tiết
            </h2>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {post.description}
            </p>
          </section>

          {amenities.length > 0 && (
            <section className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold">Tiện nghi</h2>

              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span
                    key={a.id}
                    className="rounded-full border bg-slate-50 px-3 py-1 text-sm text-slate-700"
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Bình luận */}
          <CommentsSection postId={post.id} />
        </div>

        <aside className="space-y-4 md:sticky md:top-20 md:self-start">
          <div className="rounded-lg border bg-white p-4">
            <p className="mb-3 text-xs font-medium uppercase text-slate-500">
              Người đăng tin
            </p>

            <div className="flex items-center gap-3">
              {post.authorAvatarUrl ? (
                <img
                  src={post.authorAvatarUrl}
                  alt={authorName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  {authorInitial}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {authorName}
                </p>

                {post.author?.username && (
                  <p className="truncate text-xs text-slate-500">
                    @{post.author.username}
                  </p>
                )}
              </div>
            </div>
          </div>

          <ContactBox
            phone={post.author?.phone ?? null}
            authorName={authorName}
            isLoggedIn={isLoggedIn}
          />

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <p className="mb-1 font-semibold">
              ⚠️ Cảnh báo an toàn
            </p>

            <ul className="list-disc space-y-1 pl-4">
              <li>Luôn xem phòng trực tiếp trước khi đặt cọc.</li>
              <li>Không chuyển tiền khi chưa ký hợp đồng.</li>
              <li>Báo cáo tin nghi ngờ lừa đảo cho ban quản trị.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  )
}