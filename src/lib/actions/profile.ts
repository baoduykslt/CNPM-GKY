'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { updateProfileSchema } from '@/lib/validations/profile'

export type ProfileActionState = {
  ok: boolean
  message: string
  errors?: Record<string, string[]>
}

// =====================================================================
// Cập nhật thông tin text của profile
// =====================================================================
export async function updateProfileAction(
  _prevState: ProfileActionState | null,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }

  const raw = {
    fullName: formData.get('fullName'),
    phone: formData.get('phone') || '',
    bio: formData.get('bio') || '',
  }

  const parsed = updateProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Dữ liệu không hợp lệ',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      bio: parsed.data.bio || null,
    })
    .eq('id', user.id)

  if (error) {
    return { ok: false, message: 'Không thể cập nhật hồ sơ' }
  }

  revalidatePath('/ho-so')
  revalidatePath('/', 'layout')

  return { ok: true, message: 'Cập nhật hồ sơ thành công' }
}

// =====================================================================
// Cập nhật avatar_url (sau khi client upload xong)
// =====================================================================
export async function updateAvatarAction(
  avatarUrl: string
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'Bạn cần đăng nhập' }
  }

  // Chỉ cho path thuộc folder của mình
  if (!avatarUrl.startsWith(`${user.id}/`)) {
    return { ok: false, message: 'Đường dẫn ảnh không hợp lệ' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) {
    return { ok: false, message: 'Không thể cập nhật avatar' }
  }

  revalidatePath('/ho-so')
  revalidatePath('/', 'layout')

  return { ok: true, message: 'Cập nhật avatar thành công' }
}