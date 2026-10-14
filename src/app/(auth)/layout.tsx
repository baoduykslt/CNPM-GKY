// =====================================================================
// Layout cho các trang auth (đăng ký, đăng nhập, reset password)
// Không hiện Header/Footer chính — chỉ card giữa màn hình
// =====================================================================

import Link from 'next/link'
import { Home } from 'lucide-react'
import { SITE_NAME } from '@/lib/constants'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-primary"
          >
            <Home className="h-6 w-6" aria-hidden />
            <span>{SITE_NAME}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="border-t bg-white py-4 text-center text-xs text-slate-500">
        © 2026 {SITE_NAME}
      </footer>
    </div>
  )
}