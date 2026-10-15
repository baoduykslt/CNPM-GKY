import Link from 'next/link'
import { Home, Search, LogIn, Menu } from 'lucide-react'
import { SITE_NAME, MAIN_NAV } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { getRecentNotifications } from '@/lib/queries/notifications'
import { getCurrentUserRoles, getModBadgeCounts } from '@/lib/queries/admin'
import { UserMenu } from './UserMenu'
import { NotificationBell } from './NotificationBell'
import { ModQuickAccess } from './ModQuickAccess'
import type { Profile } from '@/types/app'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Pick<Profile, 'username' | 'full_name' | 'avatar_url'> | null =
    null
  let avatarUrl: string | null = null
  let notifications: Awaited<ReturnType<typeof getRecentNotifications>> = {
    data: [],
    unreadCount: 0,
  }
  let isModerator = false
  let isAdmin = false
  let pendingPosts = 0

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data

    if (data?.avatar_url) {
      avatarUrl = supabase.storage
        .from('avatars')
        .getPublicUrl(data.avatar_url).data.publicUrl
    }

    // Lấy notification + roles song song
    const [notifRes, rolesRes] = await Promise.all([
      getRecentNotifications(5),
      getCurrentUserRoles(),
    ])

    notifications = notifRes
    isModerator = rolesRes.isModerator
    isAdmin = rolesRes.isAdmin

    // Đếm pending cho badge (chỉ mod/admin)
    if (isModerator || isAdmin) {
      const counts = await getModBadgeCounts()
      pendingPosts = counts.pendingPosts
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-primary"
        >
          <Home className="h-6 w-6" aria-hidden />
          <span>{SITE_NAME}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <Link
          href="/phong"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 md:hidden"
          aria-label="Tìm kiếm"
        >
          <Search className="h-5 w-5" />
        </Link>

        {profile ? (
          <>
            {/* Nút truy cập nhanh cho mod */}
            <ModQuickAccess
              isModerator={isModerator}
              isAdmin={isAdmin}
              pendingPosts={pendingPosts}
            />

            {/* Chuông thông báo */}
            <NotificationBell
              notifications={notifications.data}
              unreadCount={notifications.unreadCount}
            />

            {/* Avatar user */}
            <UserMenu
              profile={profile}
              avatarUrl={avatarUrl}
              isModerator={isModerator}
              isAdmin={isAdmin}
            />
          </>
        ) : (
          <Link
            href="/dang-nhap"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Đăng nhập</span>
          </Link>
        )}

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 md:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}