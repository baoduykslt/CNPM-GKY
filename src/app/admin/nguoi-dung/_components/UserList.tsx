'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Users, X } from 'lucide-react'
import { UserRow } from './UserRow'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { AdminUser } from '@/lib/queries/admin'

interface Props {
  users: AdminUser[]
  currentAdminId: string
  stats: {
    total: number
    banned: number
    moderators: number
    admins: number
  }
  currentFilter: {
    search: string
    role: string
    status: string
  }
}

const ROLE_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'member', label: 'Member' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'banned', label: 'Bị khóa' },
]

export function UserList({ users, currentAdminId, stats, currentFilter }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentFilter.search)

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    router.push(`/admin/nguoi-dung?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParam('search', search.trim())
  }

  const clearSearch = () => {
    setSearch('')
    updateParam('search', '')
  }

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Tổng user" value={stats.total} />
        <StatBox label="Moderator" value={stats.moderators} color="purple" />
        <StatBox label="Admin" value={stats.admins} color="red" />
        <StatBox label="Bị khóa" value={stats.banned} color="amber" />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo username hoặc họ tên..."
          className="h-10 pl-10 pr-10"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Role</p>
          <div className="flex gap-1">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => updateParam('role', f.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  currentFilter.role === f.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Trạng thái</p>
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => updateParam('status', f.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  currentFilter.status === f.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3 text-sm font-medium text-slate-600">
          {users.length} user
        </div>

        {users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-900">Không có user nào</p>
            <p className="text-sm text-slate-600">
              Thử đổi bộ lọc hoặc từ khóa.
            </p>
          </div>
        ) : (
          users.map((u) => (
            <UserRow key={u.id} user={u} currentAdminId={currentAdminId} />
          ))
        )}
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  color = 'slate',
}: {
  label: string
  value: number
  color?: 'slate' | 'purple' | 'red' | 'amber'
}) {
  const colors = {
    slate: 'text-slate-900',
    purple: 'text-purple-700',
    red: 'text-red-700',
    amber: 'text-amber-700',
  }
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs text-slate-600">{label}</p>
      <p className={cn('mt-1 text-xl font-bold', colors[color])}>{value}</p>
    </div>
  )
}