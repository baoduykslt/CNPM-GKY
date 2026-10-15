import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileCheck,
  Flag,
  History,
  ShieldCheck,
} from 'lucide-react'
import { getCurrentUserRoles } from '@/lib/queries/admin'
import { NotificationSoundProvider } from '@/lib/realtime/NotificationSoundProvider'
import { RealtimeRefresher } from './_components/RealtimeRefresher'
import { SoundToggle } from './_components/SoundToggle'

export default async function ModeratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isModerator } = await getCurrentUserRoles()

  if (!isModerator) {
    redirect('/')
  }

  return (
    <NotificationSoundProvider>
      <div className="min-h-screen bg-slate-50">
        <RealtimeRefresher />

        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20 rounded-lg border bg-white p-2">
              <div className="flex items-center gap-2 border-b px-3 py-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="font-semibold">Moderator</span>
              </div>

              <nav className="mt-2 space-y-1">
                <SidebarLink href="/moderator" icon={<LayoutDashboard className="h-4 w-4" />}>
                  Tổng quan
                </SidebarLink>
                <SidebarLink href="/moderator/duyet-bai" icon={<FileCheck className="h-4 w-4" />}>
                  Duyệt bài
                </SidebarLink>
                <SidebarLink href="/moderator/bao-cao" icon={<Flag className="h-4 w-4" />}>
                  Báo cáo
                </SidebarLink>
                <SidebarLink href="/moderator/lich-su" icon={<History className="h-4 w-4" />}>
                  Lịch sử
                </SidebarLink>
              </nav>

              <div className="mt-3 border-t p-2">
                <SoundToggle />
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </NotificationSoundProvider>
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