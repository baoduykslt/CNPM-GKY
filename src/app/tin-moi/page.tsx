import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from './_components/PostForm'

export const metadata: Metadata = {
  title: 'Đăng tin cho thuê',
}

export default async function NewPostPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/dang-nhap?next=/tin-moi')

  // Lấy danh sách tiện nghi để hiển thị checkbox
  const { data: amenities } = await supabase
    .from('amenities')
    .select('id, name, slug, icon, category')
    .eq('is_active', true)
    .order('category')
    .order('name')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Đăng tin cho thuê
        </h1>
        <p className="text-sm text-slate-600">
          Điền thông tin bên dưới. Bạn có thể lưu nháp và gửi duyệt sau.
        </p>
      </div>

      <PostForm amenities={amenities ?? []} userId={user.id} />
    </div>
  )
}