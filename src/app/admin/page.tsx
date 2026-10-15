import type { Metadata } from 'next'
import {
  Users,
  FileText,
  Flag,
  MessageSquare,
  Heart,
  TrendingUp,
} from 'lucide-react'
import { getAdminStats } from '@/lib/queries/admin'
import { POST_STATUS_LABELS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="mb-6 text-sm text-slate-600">
        Tổng quan hoạt động của RoomConnect
      </p>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCard
          icon={<Users className="h-5 w-5" />}
          label="Người dùng"
          value={stats.totalUsers}
          sub={`+${stats.recentSignups} tuần này`}
          color="blue"
        />
        <MiniCard
          icon={<FileText className="h-5 w-5" />}
          label="Bài đăng"
          value={stats.totalPosts}
          sub={`${stats.postsByStatus.published ?? 0} đã đăng`}
          color="green"
        />
        <MiniCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Bình luận"
          value={stats.totalComments}
          color="purple"
        />
        <MiniCard
          icon={<Heart className="h-5 w-5" />}
          label="Lượt thích"
          value={stats.totalLikes}
          color="pink"
        />
      </div>

      {/* Status + Reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">Bài đăng theo trạng thái</h2>
          <div className="space-y-3">
            {Object.entries(stats.postsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">
                  {POST_STATUS_LABELS[status] ?? status}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(stats.postsByStatus).length === 0 && (
              <p className="text-sm italic text-slate-500">Chưa có dữ liệu</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">Báo cáo</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Tổng báo cáo</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
                {stats.totalReports}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Chờ xử lý</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                {stats.pendingReports}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Top provinces */}
      <section className="mt-6 rounded-lg border bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <TrendingUp className="h-5 w-5 text-primary" />
          Top tỉnh/thành có nhiều tin đăng
        </h2>
        {stats.topProvinces.length === 0 ? (
          <p className="text-sm italic text-slate-500">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-2">
            {stats.topProvinces.map((p, idx) => {
              const max = stats.topProvinces[0].count
              const pct = (p.count / max) * 100
              return (
                <div key={p.province} className="flex items-center gap-3">
                  <span className="w-6 text-xs font-semibold text-slate-400">
                    #{idx + 1}
                  </span>
                  <span className="w-40 truncate text-sm text-slate-700">
                    {p.province}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-slate-600">
                    {p.count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function MiniCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
  color: 'blue' | 'green' | 'purple' | 'pink'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-purple-50 text-purple-700',
    pink: 'bg-pink-50 text-pink-700',
  }

  return (
    <div className="rounded-lg border bg-white p-5">
      <div
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${colors[color]}`}
      >
        {icon}
      </div>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}