'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Flag, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { ReportCard } from './ReportCard'
import { cn } from '@/lib/utils'
import type { ReportItem } from '@/lib/queries/admin'

interface Props {
  reports: ReportItem[]
  stats: {
    pending: number
    resolved: number
    dismissed: number
    total: number
  }
  currentFilter: string
}

const FILTERS = [
  { value: 'pending', label: 'Chờ xử lý', icon: Clock },
  { value: 'resolved', label: 'Có vi phạm', icon: CheckCircle2 },
  { value: 'dismissed', label: 'Bỏ qua', icon: XCircle },
  { value: 'all', label: 'Tất cả', icon: Flag },
]

export function ReportList({ reports, stats, currentFilter }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const countFor = (key: string) => {
    if (key === 'pending') return stats.pending
    if (key === 'resolved') return stats.resolved
    if (key === 'dismissed') return stats.dismissed
    return stats.total
  }

  const setFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'pending') params.delete('status')
    else params.set('status', value)
    router.push(`/moderator/bao-cao?${params.toString()}`)
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b">
        {FILTERS.map((f) => {
          const Icon = f.icon
          const active = currentFilter === f.value
          const count = countFor(f.value)
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {f.label}
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {reports.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white py-16 text-center">
          <Flag className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-900">
            Không có báo cáo nào
          </p>
          <p className="text-sm text-slate-600">
            {currentFilter === 'pending'
              ? 'Tất cả báo cáo đã được xử lý.'
              : 'Không có báo cáo nào ở mục này.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  )
}