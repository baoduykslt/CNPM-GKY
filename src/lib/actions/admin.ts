'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AdminActionResult = {
  ok: boolean
  message: string
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('UNAUTHENTICATED')

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')

  if (!roles || roles.length === 0) throw new Error('FORBIDDEN')

  return { supabase, user }
}

// =====================================================================
// Cấp role
// =====================================================================
export async function grantRoleAction(
  userId: string,
  role: 'member' | 'moderator' | 'admin'
): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin()

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role, granted_by: user.id })

    if (error) {
      if (error.code === '23505') {
        return { ok: false, message: 'User đã có role này' }
      }
      return { ok: false, message: 'Không thể cấp role' }
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'role.grant',
      target_type: 'user',
      target_id: userId,
      metadata: { role },
    })

    // Notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title: 'Bạn đã được cấp quyền mới',
      message: `Bạn đã được cấp quyền ${role}.`,
    })

    revalidatePath('/admin/nguoi-dung')
    return { ok: true, message: `Đã cấp role ${role}` }
  } catch {
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}

// =====================================================================
// Thu role
// =====================================================================
export async function revokeRoleAction(
  userId: string,
  role: 'member' | 'moderator' | 'admin'
): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin()

    if (userId === user.id && role === 'admin') {
      return { ok: false, message: 'Không thể tự thu role admin của mình' }
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role)

    if (error) return { ok: false, message: 'Không thể thu role' }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'role.revoke',
      target_type: 'user',
      target_id: userId,
      metadata: { role },
    })

    revalidatePath('/admin/nguoi-dung')
    return { ok: true, message: `Đã thu role ${role}` }
  } catch {
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}

// =====================================================================
// Hạn chế user (ban)
// =====================================================================
export async function restrictUserAction(
  userId: string,
  restrictionType: 'post_ban' | 'login_ban' | 'full_ban',
  days: number | null,
  reason: string
): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin()

    if (userId === user.id) {
      return { ok: false, message: 'Không thể tự ban chính mình' }
    }

    const trimmed = reason.trim()
    if (trimmed.length < 3) {
      return { ok: false, message: 'Vui lòng nhập lý do' }
    }

    const startsAt = new Date()
    const endsAt =
      days === null
        ? null
        : new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000)

    const { error } = await supabase.from('user_restrictions').insert({
      user_id: userId,
      restriction_type: restrictionType,
      reason: trimmed,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt?.toISOString() ?? null,
      created_by: user.id,
    })

    if (error) return { ok: false, message: 'Không thể hạn chế user' }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'user.restrict',
      target_type: 'user',
      target_id: userId,
      metadata: {
        restriction_type: restrictionType,
        days,
        reason: trimmed,
      },
    })

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title: 'Tài khoản bị hạn chế',
      message: `Lý do: ${trimmed}`,
    })

    revalidatePath('/admin/nguoi-dung')
    return { ok: true, message: 'Đã hạn chế user' }
  } catch {
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}

// =====================================================================
// Gỡ hạn chế
// =====================================================================
export async function unrestrictUserAction(
  userId: string,
  restrictionType: string
): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin()

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('user_restrictions')
      .update({ ends_at: now })
      .eq('user_id', userId)
      .eq('restriction_type', restrictionType as never)
      .or(`ends_at.is.null,ends_at.gt.${now}`)

    if (error) return { ok: false, message: 'Không thể gỡ hạn chế' }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'user.unrestrict',
      target_type: 'user',
      target_id: userId,
      metadata: { restriction_type: restrictionType },
    })

    revalidatePath('/admin/nguoi-dung')
    return { ok: true, message: 'Đã gỡ hạn chế' }
  } catch {
    return { ok: false, message: 'Có lỗi xảy ra' }
  }
}