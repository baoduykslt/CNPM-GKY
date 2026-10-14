// =====================================================================
// Supabase client cho phía Server (Server Components, Server Actions,
// Route Handlers)
// Đọc/ghi cookie từ next/headers để đồng bộ session với browser
// =====================================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // `setAll` được gọi từ Server Component — Next.js không cho set cookie
            // ở đây. Bỏ qua an toàn vì middleware đã refresh session.
          }
        },
      },
    }
  )
}