import Link from 'next/link'
import { MapPin, Maximize2, ImageOff } from 'lucide-react'
import { formatPrice, formatArea, getRoomTypeLabel } from '@/lib/constants'
import type { LatestPost } from '@/lib/queries/posts'

interface Props {
  post: LatestPost
}

export function PostCard({ post }: Props) {
  const href = `/phong/${post.id}`

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {post.thumbnailUrl ? (
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <ImageOff className="h-8 w-8" />
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2.5 py-1 text-sm font-semibold text-primary shadow-sm">
          {formatPrice(post.price)}
        </div>

        {/* Room type badge */}
        <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {getRoomTypeLabel(post.room_type)}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-primary">
          {post.title}
        </h3>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3 w-3" />
            {formatArea(post.area)}
          </span>
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {post.ward}, {post.province}
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}