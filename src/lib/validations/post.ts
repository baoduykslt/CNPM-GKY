// =====================================================================
// Zod schemas cho bài đăng
// =====================================================================

import { z } from 'zod'
import { PROVINCES } from '@/lib/constants'

const ROOM_TYPE_VALUES = [
  'phong_tro',
  'chung_cu_mini',
  'nha_nguyen_can',
  'o_ghep',
  'ky_tuc_xa',
  'khac',
] as const

export const postSchema = z.object({
  title: z
    .string()
    .min(10, 'Tiêu đề tối thiểu 10 ký tự')
    .max(200, 'Tiêu đề tối đa 200 ký tự')
    .trim(),

  description: z
    .string()
    .min(30, 'Mô tả tối thiểu 30 ký tự')
    .max(5000, 'Mô tả tối đa 5000 ký tự')
    .trim(),

  price: z
    .number({ message: 'Vui lòng nhập giá' })
    .int('Giá phải là số nguyên')
    .positive('Giá phải lớn hơn 0')
    .max(1_000_000_000, 'Giá quá lớn'),

  area: z
    .number({ message: 'Vui lòng nhập diện tích' })
    .positive('Diện tích phải lớn hơn 0')
    .max(9999, 'Diện tích quá lớn'),

  address: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ')
    .max(200, 'Địa chỉ tối đa 200 ký tự')
    .trim(),

  province: z
    .string()
    .refine((v) => PROVINCES.includes(v as never), {
      message: 'Vui lòng chọn tỉnh/thành',
    }),

  ward: z
    .string()
    .min(1, 'Vui lòng nhập phường/xã')
    .max(100, 'Phường/xã tối đa 100 ký tự')
    .trim(),

  roomType: z.enum(ROOM_TYPE_VALUES, {
    message: 'Vui lòng chọn loại phòng',
  }),

  amenityIds: z.array(z.string().uuid()).max(30, 'Tối đa 30 tiện nghi'),
})

export type PostInput = z.infer<typeof postSchema>

// =====================================================================
// Schema cho ảnh (chỉ dùng client-side validate file)
// =====================================================================
export const postImageFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= 5 * 1024 * 1024, 'Ảnh tối đa 5MB')
    .refine(
      (f) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
      'Chỉ chấp nhận JPEG, PNG, WebP'
    ),
  altText: z.string().max(200).optional(),
})

export type PostImageFile = z.infer<typeof postImageFileSchema>