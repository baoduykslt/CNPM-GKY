import Link from 'next/link'
import { MapPin, Maximize2, Calendar, Eye } from 'lucide-react'
import { formatPrice, formatArea, formatDate } from '@/lib/constants'
import { PostStatusBadge, AvailabilityBadge } from './PostStatusBadge'
import { PostActions } from './PostActions'
import type { Post, PostImage } from '@/types/app'

interface Props {
  post: Post & {
    post_images: Pick<PostImage, 'id' | 'storage_path' | 'sort_order'>[]
  }
  thumbnailUrl: string | null
}

export function PostCard({ post, thumbnailUrl }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 sm:flex-row">
      {/* Thumbnail */}
      <Link
        href={`/tin-cua-toi/${post.id}`}
        className="block h-40 w-full shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-32 sm:w-44"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={post.title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Không có ảnh
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PostStatusBadge status={post.status} />
            {post.status === 'published' && (
              <AvailabilityBadge availability={post.availability_status} />
            )}
          </div>

          <Link
            href={`/tin-cua-toi/${post.id}`}
            className="block font-semibold text-slate-900 hover:text-primary line-clamp-2"
          >
            {post.title}
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="font-semibold text-primary">
              {formatPrice(post.price)}
            </span>
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" />
              {formatArea(post.area)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {post.ward}, {post.province}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Tạo: {formatDate(post.created_at)}
            </span>
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.view_count} lượt xem
              </span>
            )}
          </div>
        </div>

        <PostActions post={post} />
      </div>
    </div>
  )
}