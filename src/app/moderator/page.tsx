import type { Metadata } from 'next'
import Link from 'next/link'
import { FileCheck, Flag, ArrowRight } from 'lucide-react'
import { getPendingCount } from '@/lib/queries/admin'
import { createClient } from '@/lib/supabase/server'
import { unstable_noStore } from 'next/cache'

export const metadata: Metadata = {
  title: 'Moderator Dashboard',
}

export default async function ModeratorDashboard() {
  unstable_noStore()

  const pendingCount = await getPendingCount()

  const supabase = await createClient()
  const { count: pendingReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: revisionsPending } = await supabase
    .from('post_revisions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">
        Moderator Dashboard
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        Quản lý kiểm duyệt bài đăng và báo cáo
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<FileCheck className="h-6 w-6" />}
          label="Bài chờ duyệt"
          value={pendingCount}
          href="/moderator/duyet-bai"
          color="amber"
        />
        <StatCard
          icon={<FileCheck className="h-6 w-6" />}
          label="Bản chỉnh sửa chờ duyệt"
          value={revisionsPending ?? 0}
          href="/moderator/duyet-bai"
          color="blue"
        />
        <StatCard
          icon={<Flag className="h-6 w-6" />}
          label="Báo cáo chờ xử lý"
          value={pendingReports ?? 0}
          href="/moderator/bao-cao"
          color="red"
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  href: string
  color: 'amber' | 'blue' | 'red'
}) {
  const colors = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-lg border p-5 transition-shadow hover:shadow-md ${colors[color]}`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/60">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium opacity-90">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <ArrowRight className="h-5 w-5 opacity-50 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}