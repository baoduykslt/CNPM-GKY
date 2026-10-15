'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleFavoriteAction } from '@/lib/actions/interaction'
import { cn } from '@/lib/utils'

interface Props {
  postId: string
  initialFavorited: boolean
  isLoggedIn: boolean
}

export function FavoriteButton({
  postId,
  initialFavorited,
  isLoggedIn,
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để lưu tin')
      router.push('/dang-nhap')
      return
    }

    const wasFavorited = favorited
    setFavorited(!wasFavorited)

    startTransition(async () => {
      const result = await toggleFavoriteAction(postId)
      if (!result.ok) {
        setFavorited(wasFavorited)
        toast.error(result.message)
      } else {
        toast.success(result.message)
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
        favorited
          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
        isPending && 'opacity-70'
      )}
      aria-pressed={favorited}
      aria-label={favorited ? 'Bỏ lưu' : 'Lưu yêu thích'}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark
          className={cn('h-4 w-4', favorited && 'fill-current')}
        />
      )}
      <span>{favorited ? 'Đã lưu' : 'Lưu tin'}</span>
    </button>
  )
}