// =====================================================================
// Supabase client cho phía Browser (Client Components)
// Dùng ở: "use client" components, event handlers
// KHÔNG dùng ở: Server Components, Server Actions, Route Handlers
// =====================================================================

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}