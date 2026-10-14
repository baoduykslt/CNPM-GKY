// =====================================================================
// Route Handler: /auth/callback
// Supabase Auth redirect về đây sau khi user click link trong email
// (dùng cho: xác nhận email, đặt lại mật khẩu, OAuth)
// =====================================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Lỗi → về trang login kèm thông báo
  return NextResponse.redirect(`${origin}/dang-nhap?error=auth-callback`)
}