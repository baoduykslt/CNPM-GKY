'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag } from 'lucide-react'
import { toast } from 'sonner'
import { ReportDialog } from './ReportDialog'
import { cn } from '@/lib/utils'

interface Props {
  targetType: 'post' | 'comment'
  targetId: string
  isLoggedIn: boolean
  variant?: 'button' | 'link'
}

export function ReportButton({
  targetType,
  targetId,
  isLoggedIn,
  variant = 'button',
}: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để báo cáo')
      router.push('/dang-nhap')
      return
    }
    setOpen(true)
  }

  if (variant === 'link') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
        >
          <Flag className="h-3 w-3" />
          Báo cáo
        </button>
        <ReportDialog
          targetType={targetType}
          targetId={targetId}
          open={open}
          onClose={() => setOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-600'
        )}
        aria-label="Báo cáo"
      >
        <Flag className="h-4 w-4" />
        <span>Báo cáo</span>
      </button>
      <ReportDialog
        targetType={targetType}
        targetId={targetId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}