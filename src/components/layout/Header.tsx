import Link from 'next/link'
import { Home, Search, LogIn, Menu } from 'lucide-react'
import { SITE_NAME, MAIN_NAV } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/queries/notifications'
import { UserMenu } from './UserMenu'
import type { Profile } from '@/types/app'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Pick<Profile, 'username' | 'full_name' | 'avatar_url'> | null =
    null
  let avatarUrl: string | null = null
  let unreadNotifications = 0

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

    unreadNotifications = await getUnreadNotificationCount()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
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
          <UserMenu
            profile={profile}
            avatarUrl={avatarUrl}
            unreadNotifications={unreadNotifications}
          />
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