import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  History,
  Sparkles,
  Shield,
} from 'lucide-react'
import { getCurrentUserRoles } from '@/lib/queries/admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdmin } = await getCurrentUserRoles()

  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20 rounded-lg border bg-white p-2">
            <div className="flex items-center gap-2 border-b px-3 py-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Admin</span>
            </div>

            <nav className="mt-2 space-y-1">
              <SidebarLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
                Tổng quan
              </SidebarLink>
              <SidebarLink href="/admin/nguoi-dung" icon={<Users className="h-4 w-4" />}>
                Người dùng
              </SidebarLink>
              <SidebarLink href="/admin/bai-dang" icon={<FileText className="h-4 w-4" />}>
                Bài đăng
              </SidebarLink>
              <SidebarLink href="/admin/bao-cao" icon={<Flag className="h-4 w-4" />}>
                Báo cáo
              </SidebarLink>
              <SidebarLink href="/admin/tien-nghi" icon={<Sparkles className="h-4 w-4" />}>
                Tiện nghi
              </SidebarLink>
              <SidebarLink href="/admin/nhat-ky" icon={<History className="h-4 w-4" />}>
                Nhật ký
              </SidebarLink>
            </nav>

            <div className="mt-2 border-t p-2">
              <Link
                href="/moderator"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-500 hover:bg-slate-100"
              >
                Chuyển sang Moderator →
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
    >
      {icon}
      {children}
    </Link>
  )
}