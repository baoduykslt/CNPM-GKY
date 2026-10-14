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
// =====================================================================
// Danh mục tỉnh/thành (63 tỉnh)
// Sắp xếp theo miền: Bắc → Trung → Nam
// =====================================================================
export const PROVINCES = [
  // Miền Bắc
  'Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Bắc Giang',
  'Hải Dương', 'Hưng Yên', 'Thái Bình', 'Nam Định', 'Ninh Bình',
  'Hà Nam', 'Vĩnh Phúc', 'Thái Nguyên', 'Lạng Sơn', 'Cao Bằng',
  'Bắc Kạn', 'Tuyên Quang', 'Phú Thọ', 'Yên Bái', 'Lào Cai',
  'Điện Biên', 'Lai Châu', 'Sơn La', 'Hòa Bình',
  // Miền Trung
  'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị',
  'Thừa Thiên Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định',
  'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận', 'Kon Tum',
  'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng',
  // Miền Nam
  'TP. Hồ Chí Minh', 'Bình Dương', 'Bình Phước', 'Tây Ninh', 'Đồng Nai',
  'Bà Rịa - Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh',
  'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Cần Thơ',
  'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau',
] as const

export type Province = (typeof PROVINCES)[number]

// =====================================================================
// Loại phòng — khớp với enum room_type trong DB
// =====================================================================
export const ROOM_TYPES = [
  { value: 'phong_tro', label: 'Phòng trọ' },
  { value: 'chung_cu_mini', label: 'Chung cư mini' },
  { value: 'nha_nguyen_can', label: 'Nhà nguyên căn' },
  { value: 'o_ghep', label: 'Ở ghép' },
  { value: 'ky_tuc_xa', label: 'Ký túc xá' },
  { value: 'khac', label: 'Khác' },
] as const

export type RoomTypeValue = (typeof ROOM_TYPES)[number]['value']

export function getRoomTypeLabel(value: string): string {
  return ROOM_TYPES.find((r) => r.value === value)?.label ?? value
}

// =====================================================================
// Trạng thái bài đăng — label tiếng Việt
// =====================================================================
export const POST_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  published: 'Đã đăng',
  rejected: 'Bị từ chối',
  archived: 'Đã lưu trữ',
}

export const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Còn trống',
  rented: 'Đã cho thuê',
  hidden: 'Tạm ẩn',
}

// =====================================================================
// Helper format ngày
// =====================================================================
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// =====================================================================
// Helper rút gọn giá (1.5 triệu, 800 nghìn)
// =====================================================================
export function formatPriceShort(price: number): string {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000
    return `${millions.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`
  }
  if (price >= 1_000) {
    return `${(price / 1_000).toLocaleString('vi-VN')} nghìn`
  }
  return price.toString()
}