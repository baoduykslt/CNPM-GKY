'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleLikeAction } from '@/lib/actions/interaction'
import { cn } from '@/lib/utils'

interface Props {
  postId: string
  initialLiked: boolean
  initialCount: number
  isLoggedIn: boolean
}

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để thích tin')
      router.push('/dang-nhap')
      return
    }

    // Optimistic update
    const wasLiked = liked
    setLiked(!wasLiked)
    setCount((c) => c + (wasLiked ? -1 : 1))

    startTransition(async () => {
      const result = await toggleLikeAction(postId)
      if (!result.ok) {
        // Rollback
        setLiked(wasLiked)
        setCount((c) => c + (wasLiked ? 1 : -1))
        toast.error(result.message)
      } else if (result.count !== undefined) {
        // Sync với server
        setCount(result.count)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
        liked
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
        isPending && 'opacity-70'
      )}
      aria-pressed={liked}
      aria-label={liked ? 'Bỏ thích' : 'Thích'}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn('h-4 w-4', liked && 'fill-current')}
        />
      )}
      <span>{liked ? 'Đã thích' : 'Thích'}</span>
      {count > 0 && (
        <span className="text-xs opacity-75">({count})</span>
      )}
    </button>
  )
}