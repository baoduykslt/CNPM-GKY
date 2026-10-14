// =====================================================================
// Server Actions cho Authentication
// Chạy trên server, có quyền truy cập cookie, database
// =====================================================================

'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth'
import { translateAuthError } from '@/lib/utils/errors'

// =====================================================================
// Kiểu kết quả trả về cho form
// =====================================================================
export type ActionState = {
  ok: boolean
  message: string
  errors?: Record<string, string[]>
}

// =====================================================================
// ĐĂNG KÝ
// =====================================================================
export async function signupAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // 1. Validate input
  const raw = {
    email: formData.get('email'),
    username: formData.get('username'),
    fullName: formData.get('fullName'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Dữ liệu không hợp lệ',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // 2. Gọi Supabase Auth
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username,
        full_name: parsed.data.fullName,
      },
    },
  })

  if (error) {
    return {
      ok: false,
      message: translateAuthError(error.message),
    }
  }

  // 3. Thành công → redirect
  // (Với email confirmation OFF, user được login ngay.)
  revalidatePath('/', 'layout')
  redirect('/')
}

// =====================================================================
// ĐĂNG NHẬP
// =====================================================================
export async function loginAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Dữ liệu không hợp lệ',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      ok: false,
      message: translateAuthError(error.message),
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// =====================================================================
// ĐĂNG XUẤT
// =====================================================================
export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

// =====================================================================
// QUÊN MẬT KHẨU — gửi email reset
// =====================================================================
export async function forgotPasswordAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const raw = { email: formData.get('email') }
  const parsed = forgotPasswordSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Dữ liệu không hợp lệ',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl}/auth/callback?next=/dat-lai-mat-khau`,
    }
  )

  if (error) {
    return { ok: false, message: translateAuthError(error.message) }
  }

  // Không tiết lộ email có tồn tại hay không (chống enumeration)
  return {
    ok: true,
    message:
      'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu',
  }
}

// =====================================================================
// ĐẶT LẠI MẬT KHẨU — sau khi click link email
// =====================================================================
export async function resetPasswordAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Dữ liệu không hợp lệ',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { ok: false, message: translateAuthError(error.message) }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}