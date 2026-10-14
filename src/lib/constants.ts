export const SITE_NAME = 'RoomConnect'
export const SITE_DESCRIPTION =
  'Nền tảng đăng tin cho thuê phòng trọ và diễn đàn cộng đồng'

export const PAGE_SIZE = 12
export const POST_DURATION_DAYS = 30
export const MAX_IMAGES_PER_POST = 10
export const MAX_IMAGE_SIZE_MB = 5
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const MAIN_NAV = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Tìm phòng', href: '/phong' },
] as const
export const COPYRIGHT_YEAR = 2026
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ'
}

export function formatArea(area: number): string {
  return area.toLocaleString('vi-VN') + ' m²'
}