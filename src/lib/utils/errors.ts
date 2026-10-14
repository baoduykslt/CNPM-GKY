// =====================================================================
// Helper: dịch lỗi Supabase Auth sang tiếng Việt
// =====================================================================

/**
 * Nhận error message từ Supabase, trả về thông báo tiếng Việt.
 * Fallback về message gốc nếu không match.
 */
export function translateAuthError(message: string): string {
  const lower = message.toLowerCase()

  // Đăng ký
  if (lower.includes('user already registered')) {
    return 'Email này đã được đăng ký'
  }
  if (lower.includes('email address') && lower.includes('invalid')) {
    return 'Email không hợp lệ'
  }
  if (lower.includes('password should be at least')) {
    return 'Mật khẩu quá ngắn (tối thiểu 8 ký tự)'
  }
  if (lower.includes('signup is disabled')) {
    return 'Chức năng đăng ký đang tạm đóng'
  }

  // Đăng nhập
  if (lower.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không đúng'
  }
  if (lower.includes('email not confirmed')) {
    return 'Email chưa được xác nhận. Kiểm tra hộp thư của bạn'
  }
  if (lower.includes('too many requests')) {
    return 'Bạn thao tác quá nhanh, vui lòng thử lại sau'
  }

  // Reset password
  if (lower.includes('user not found')) {
    return 'Không tìm thấy tài khoản với email này'
  }
  if (lower.includes('same password')) {
    return 'Mật khẩu mới phải khác mật khẩu cũ'
  }
  if (lower.includes('token has expired') || lower.includes('invalid token')) {
    return 'Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ'
  }

  // Session
  if (lower.includes('jwt expired') || lower.includes('session')) {
    return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
  }

  // Fallback: trả message gốc để dev biết cần bổ sung
  return message
}

/**
 * Kiểm tra user có bị restrict post_ban / full_ban không.
 * Trả về true nếu bị cấm đăng bài.
 */
export function isPostBanned(restrictions: Array<{
  restriction_type: string
  ends_at: string | null
}>): boolean {
  const now = new Date()
  return restrictions.some(
    (r) =>
      (r.restriction_type === 'post_ban' ||
        r.restriction_type === 'full_ban') &&
      (r.ends_at === null || new Date(r.ends_at) > now)
  )
}