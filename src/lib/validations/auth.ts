// =====================================================================
// Zod schemas cho authentication
// Dùng chung cho client form + server action
// =====================================================================

import { z } from 'zod'

// =====================================================================
// Đăng ký
// =====================================================================
export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Vui lòng nhập email')
      .email('Email không hợp lệ')
      .max(255, 'Email quá dài')
      .toLowerCase()
      .trim(),

    username: z
      .string()
      .min(3, 'Username tối thiểu 3 ký tự')
      .max(30, 'Username tối đa 30 ký tự')
      .regex(
        /^[a-z0-9_]+$/,
        'Username chỉ chứa chữ thường, số và dấu gạch dưới'
      )
      .toLowerCase()
      .trim(),

    fullName: z
      .string()
      .min(2, 'Họ tên tối thiểu 2 ký tự')
      .max(100, 'Họ tên tối đa 100 ký tự')
      .trim(),

    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .max(72, 'Mật khẩu tối đa 72 ký tự'), // bcrypt giới hạn 72

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type SignupInput = z.infer<typeof signupSchema>

// =====================================================================
// Đăng nhập
// =====================================================================
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu'),
})

export type LoginInput = z.infer<typeof loginSchema>

// =====================================================================
// Quên mật khẩu — gửi email reset
// =====================================================================
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ')
    .toLowerCase()
    .trim(),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

// =====================================================================
// Đặt lại mật khẩu — sau khi click link trong email
// =====================================================================
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .max(72, 'Mật khẩu tối đa 72 ký tự'),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>