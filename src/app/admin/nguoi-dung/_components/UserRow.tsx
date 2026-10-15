'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  User as UserIcon,
  Shield,
  ShieldCheck,
  Ban,
  Loader2,
  MoreVertical,
  Check,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  grantRoleAction,
  revokeRoleAction,
  restrictUserAction,
  unrestrictUserAction,
} from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { AdminUser } from '@/lib/queries/admin'

interface Props {
  user: AdminUser
  currentAdminId: string
}

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: 'Admin', cls: 'bg-red-100 text-red-700 border-red-200' },
  moderator: {
    label: 'Mod',
    cls: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  member: {
    label: 'Member',
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
  },
}

export function UserRow({ user, currentAdminId }: Props) {
  const [openMenu, setOpenMenu] = useState(false)
  const [showBanForm, setShowBanForm] = useState(false)
  const [banType, setBanType] = useState<'post_ban' | 'login_ban' | 'full_ban'>(
    'post_ban'
  )
  const [banDays, setBanDays] = useState<string>('7')
  const [banReason, setBanReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isSelf = user.id === currentAdminId

  const handleGrantRole = (role: 'moderator' | 'admin') => {
    if (!confirm(`Cấp role ${role} cho user ${user.username}?`)) return
    setOpenMenu(false)
    startTransition(async () => {
      const r = await grantRoleAction(user.id, role)
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const handleRevokeRole = (role: 'moderator' | 'admin') => {
    if (!confirm(`Thu role ${role} của user ${user.username}?`)) return
    setOpenMenu(false)
    startTransition(async () => {
      const r = await revokeRoleAction(user.id, role)
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const handleBan = () => {
    if (banReason.trim().length < 3) {
      toast.error('Vui lòng nhập lý do (tối thiểu 3 ký tự)')
      return
    }
    const days = banDays === 'forever' ? null : Number(banDays)
    if (days !== null && (isNaN(days) || days < 1)) {
      toast.error('Số ngày không hợp lệ')
      return
    }

    startTransition(async () => {
      const r = await restrictUserAction(user.id, banType, days, banReason)
      if (r.ok) {
        toast.success(r.message)
        setShowBanForm(false)
        setBanReason('')
        setBanDays('7')
        setBanType('post_ban')
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const handleUnban = (type: string) => {
    if (!confirm(`Gỡ hạn chế "${type}" của user ${user.username}?`)) return
    startTransition(async () => {
      const r = await unrestrictUserAction(user.id, type)
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  const displayName = user.full_name ?? user.username

  return (
    <>
      <div className="flex items-center gap-4 border-b p-4 last:border-b-0 hover:bg-slate-50">
        {/* Avatar */}
        <div className="shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-slate-900">
              {displayName}
            </p>
            {user.roles.map((r) => (
              <span
                key={r}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase',
                  ROLE_BADGE[r]?.cls ?? 'bg-slate-100 text-slate-600'
                )}
              >
                {ROLE_BADGE[r]?.label ?? r}
              </span>
            ))}
            {user.isBanned && (
              <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                BỊ KHÓA
              </span>
            )}
            {isSelf && (
              <span className="text-[10px] italic text-slate-400">(bạn)</span>
            )}
          </div>
          <p className="truncate text-xs text-slate-500">
            @{user.username}
            {user.phone && ` · ${user.phone}`}
          </p>
          <p className="text-xs text-slate-500">
            Đăng ký: {formatDate(user.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="shrink-0">
          {user.isBanned ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">
                {user.restrictionTypes.join(', ')}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUnban(user.restrictionTypes[0])}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Gỡ khóa
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenMenu((v) => !v)}
                disabled={isPending || isSelf}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <MoreVertical className="h-3.5 w-3.5" />
                    Thao tác
                  </>
                )}
              </Button>

              {openMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpenMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-md border bg-white shadow-lg">
                    {!user.roles.includes('moderator') && (
                      <button
                        type="button"
                        onClick={() => handleGrantRole('moderator')}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <Shield className="h-4 w-4 text-purple-600" />
                        Cấp Moderator
                      </button>
                    )}
                    {user.roles.includes('moderator') && (
                      <button
                        type="button"
                        onClick={() => handleRevokeRole('moderator')}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        Thu Moderator
                      </button>
                    )}
                    {!user.roles.includes('admin') && (
                      <button
                        type="button"
                        onClick={() => handleGrantRole('admin')}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <ShieldCheck className="h-4 w-4 text-red-600" />
                        Cấp Admin
                      </button>
                    )}
                    {user.roles.includes('admin') && (
                      <button
                        type="button"
                        onClick={() => handleRevokeRole('admin')}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        Thu Admin
                      </button>
                    )}
                    <div className="border-t">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenu(false)
                          setShowBanForm(true)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <Ban className="h-4 w-4" />
                        Hạn chế tài khoản
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ban form modal */}
      {showBanForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBanForm(false)
          }}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-5">
            <h3 className="mb-3 font-semibold">
              Hạn chế user: {displayName}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Loại hạn chế
                </label>
                <select
                  value={banType}
                  onChange={(e) =>
                    setBanType(e.target.value as typeof banType)
                  }
                  disabled={isPending}
                  className="h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value="post_ban">Cấm đăng tin</option>
                  <option value="login_ban">Cấm đăng nhập</option>
                  <option value="full_ban">Cấm toàn bộ</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Thời hạn
                </label>
                <select
                  value={banDays}
                  onChange={(e) => setBanDays(e.target.value)}
                  disabled={isPending}
                  className="h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value="1">1 ngày</option>
                  <option value="3">3 ngày</option>
                  <option value="7">7 ngày</option>
                  <option value="30">30 ngày</option>
                  <option value="90">90 ngày</option>
                  <option value="forever">Vĩnh viễn</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Lý do *
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  disabled={isPending}
                  placeholder="VD: Spam nhiều bài vi phạm..."
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBanForm(false)}
                disabled={isPending}
              >
                Huỷ
              </Button>
              <Button
                variant="destructive"
                onClick={handleBan}
                disabled={isPending || banReason.trim().length < 3}
              >
                {isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-1 h-4 w-4" />
                )}
                Xác nhận hạn chế
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}