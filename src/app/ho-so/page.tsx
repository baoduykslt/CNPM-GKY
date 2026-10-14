import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './_components/ProfileForm'
import { AvatarUpload } from './_components/AvatarUpload'

export const metadata: Metadata = {
  title: 'Hồ sơ cá nhân',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/dang-nhap?next=/ho-so')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, phone, bio, avatar_url, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        Hồ sơ cá nhân
      </h1>
      <p className="text-sm text-slate-600 mb-8">
        Quản lý thông tin cá nhân và ảnh đại diện của bạn
      </p>

      <div className="space-y-8">
        <AvatarUpload
          userId={user.id}
          initialAvatarUrl={profile.avatar_url}
          username={profile.username}
        />

        <ProfileForm
          initialData={{
            fullName: profile.full_name ?? '',
            phone: profile.phone ?? '',
            bio: profile.bio ?? '',
          }}
          email={user.email ?? ''}
          username={profile.username}
        />
      </div>
    </div>
  )
}