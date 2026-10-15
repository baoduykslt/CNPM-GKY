'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  isModerator: boolean
  isAdmin: boolean
  pendingPosts: number
}

export function ModQuickAccess({
  isModerator,
  isAdmin,
  pendingPosts,
}: Props) {
  const pathname = usePathname()

  if (!isModerator && !isAdmin) return null

  const href = '/moderator/duyet-bai'
  const isActive = pathname.startsWith('/moderator')

  return (
    <Link
      href={href}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      )}
      title="Truy cập nhanh khu vực kiểm duyệt"
    >
      <ShieldCheck className="h-4 w-4" />
      <span className="hidden sm:inline">Kiểm duyệt</span>
      {pendingPosts > 0 && (
        <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">
          {pendingPosts > 99 ? '99+' : pendingPosts}
        </span>
      )}
    </Link>
  )
}