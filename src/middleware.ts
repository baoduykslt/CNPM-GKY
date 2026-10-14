// =====================================================================
// Root middleware Next.js
// 1. Refresh session Supabase
// 2. Bảo vệ các route yêu cầu đăng nhập
// =====================================================================

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_PREFIXES = [
  '/ho-so',
  '/tin-cua-toi',
  '/tin-moi',
  '/yeu-thich',
  '/thong-bao',
  '/moderator',
  '/admin',
]

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  const { pathname } = request.nextUrl
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (needsAuth) {
    // Tạo supabase client mới để check user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dang-nhap'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}