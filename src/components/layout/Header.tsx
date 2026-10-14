// =====================================================================
// Header — thanh điều hướng chính
// Đơn giản, responsive: logo + nav + nút đăng nhập
// =====================================================================

import Link from 'next/link'
import { Home, Search, LogIn, Menu } from 'lucide-react'
import { SITE_NAME, MAIN_NAV } from '@/lib/constants'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-primary"
        >
          <Home className="h-6 w-6" aria-hidden />
          <span>{SITE_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <Link
          href="/phong"
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100"
          aria-label="Tìm kiếm"
        >
          <Search className="h-5 w-5" />
        </Link>

        <Link
          href="/dang-nhap"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <LogIn className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Đăng nhập</span>
        </Link>

        <button
          type="button"
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}