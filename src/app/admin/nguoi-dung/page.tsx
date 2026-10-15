import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { getUsers, getUserStats, getUserEmails } from '@/lib/queries/admin'
import { createClient } from '@/lib/supabase/server'
import { UserList } from './_components/UserList'

export const metadata: Metadata = {
  title: 'Quản lý người dùng',
}

interface Props {
  searchParams: Promise<{
    search?: string
    role?: string
    status?: string
  }>
}

export default async function UsersPage({ searchParams }: Props) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const role = sp.role ?? 'all'
  const status = sp.status ?? 'all'

  const supabase = await createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const [users, stats] = await Promise.all([
  getUsers({
    search,
    role,
    status: status as 'all' | 'active' | 'banned',
  }),
  getUserStats(),
])

  // Lấy email cho user
  const emails = await getUserEmails(users.map((u) => u.id))
  const usersWithEmail = users.map((u) => ({
    ...u,
    email: emails[u.id] ?? '',
  }))

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-slate-600">
            Cấp quyền, hạn chế tài khoản và quản lý người dùng
          </p>
        </div>
      </div>

      <UserList
        users={usersWithEmail}
        currentAdminId={currentUser?.id ?? ''}
        stats={stats}
        currentFilter={{ search, role, status }}
      />
    </div>
  )
}