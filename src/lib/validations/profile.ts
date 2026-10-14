// =====================================================================
// Zod schemas cho profile
// =====================================================================

import { z } from 'zod'

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(100, 'Họ tên tối đa 100 ký tự')
    .trim(),

  phone: z
    .string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, 'SĐT không hợp lệ (VD: 0912345678)')
    .or(z.literal(''))
    .optional(),

  bio: z
    .string()
    .max(500, 'Giới thiệu tối đa 500 ký tự')
    .optional()
    .or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>