'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, LogOut, FileText, Heart, Bell } from 'lucide-react'
import { logoutAction } from '@/lib/actions/auth'
import type { Profile } from '@/types/app'

interface UserMenuProps {
  profile: Pick<Profile, 'username' | 'full_name' | 'avatar_url'>
  avatarUrl: string | null
}

export function UserMenu({ profile, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false)

  const displayName = profile.full_name ?? profile.username
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border p-1 pr-3 hover:bg-slate-100 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial}
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium">
          {profile.username}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border bg-white shadow-lg"
          >
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium text-slate-900">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">@{profile.username}</p>
            </div>

            <div className="p-1">
              <MenuItem href="/ho-so" icon={<User className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Hồ sơ cá nhân
              </MenuItem>
              <MenuItem href="/tin-cua-toi" icon={<FileText className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Tin của tôi
              </MenuItem>
              <MenuItem href="/yeu-thich" icon={<Heart className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Yêu thích
              </MenuItem>
              <MenuItem href="/thong-bao" icon={<Bell className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Thông báo
              </MenuItem>
            </div>

            <div className="border-t p-1">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({
  href,
  icon,
  children,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
      role="menuitem"
    >
      {icon}
      {children}
    </Link>
  )
}