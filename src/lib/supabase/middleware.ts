// =====================================================================
// Helper cho middleware Next.js — refresh session Supabase mỗi request
// Đảm bảo session cookie luôn tươi, không bị logout giữa chừng
// =====================================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // QUAN TRỌNG: gọi getUser() để buộc refresh token nếu hết hạn.
  // KHÔNG dùng getSession() ở middleware — không an toàn.
  await supabase.auth.getUser()

  return supabaseResponse
}