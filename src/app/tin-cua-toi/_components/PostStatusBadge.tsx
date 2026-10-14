import { cn } from '@/lib/utils'
import { POST_STATUS_LABELS, AVAILABILITY_LABELS } from '@/lib/constants'
import type { PostStatus, AvailabilityStatus } from '@/types/app'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
}

const AVAILABILITY_STYLES: Record<string, string> = {
  available: 'bg-blue-50 text-blue-700 border-blue-200',
  rented: 'bg-purple-50 text-purple-700 border-purple-200',
  hidden: 'bg-slate-100 text-slate-500 border-slate-200',
}

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status]
      )}
    >
      {POST_STATUS_LABELS[status]}
    </span>
  )
}

export function AvailabilityBadge({
  availability,
}: {
  availability: AvailabilityStatus
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        AVAILABILITY_STYLES[availability]
      )}
    >
      {AVAILABILITY_LABELS[availability]}
    </span>
  )
}