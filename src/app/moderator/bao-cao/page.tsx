import type { Metadata } from 'next'
import { Flag } from 'lucide-react'
import { getReports, getReportStats } from '@/lib/queries/admin'
import { ReportList } from './_components/ReportList'

export const metadata: Metadata = {
  title: 'Xử lý báo cáo',
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function ReportsPage({ searchParams }: Props) {
  const sp = await searchParams
  const status = sp.status ?? 'pending'

  const [reports, stats] = await Promise.all([
    getReports(status),
    getReportStats(),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Flag className="h-5 w-5 text-red-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Xử lý báo cáo
          </h1>
          <p className="text-sm text-slate-600">
            Kiểm tra và xử lý báo cáo vi phạm từ người dùng
          </p>
        </div>
      </div>

      <ReportList
        reports={reports}
        stats={stats}
        currentFilter={status}
      />
    </div>
  )
}