'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updateAvatarAction } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'

const MAX_SIZE_MB = 2
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

interface Props {
  userId: string
  initialAvatarUrl: string | null
  username: string
}

export function AvatarUpload({ userId, initialAvatarUrl, username }: Props) {
  const [avatarPath, setAvatarPath] = useState<string | null>(initialAvatarUrl)
  const [isPending, startTransition] = useTransition()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tính public URL từ path
  const supabase = createClient()
  const displayUrl = previewUrl
    ? previewUrl
    : avatarPath
      ? supabase.storage.from('avatars').getPublicUrl(avatarPath).data.publicUrl
      : null

  const initial = username.charAt(0).toUpperCase()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate client-side
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Chỉ chấp nhận ảnh JPEG, PNG, WebP')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Ảnh tối đa ${MAX_SIZE_MB}MB`)
      return
    }

    // Preview local
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    startTransition(async () => {
      // Upload lên Storage
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${userId}/avatar-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        toast.error('Upload ảnh thất bại: ' + uploadError.message)
        setPreviewUrl(null)
        return
      }

      // Gọi server action update avatar_url
      const result = await updateAvatarAction(path)

      if (!result.ok) {
        toast.error(result.message)
        setPreviewUrl(null)
        return
      }

      // Xoá ảnh cũ nếu có và khác path
      if (avatarPath && avatarPath !== path) {
        await supabase.storage.from('avatars').remove([avatarPath])
      }

      setAvatarPath(path)
      setPreviewUrl(null)
      toast.success('Cập nhật ảnh đại diện thành công')
    })
  }

  return (
    <section className="rounded-lg border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Ảnh đại diện</h2>

      <div className="flex items-center gap-6">
        <div className="relative">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={username}
              className="h-24 w-24 rounded-full object-cover border"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
              {initial}
            </div>
          )}

          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
          >
            <Camera className="mr-2 h-4 w-4" />
            Chọn ảnh
          </Button>
          <p className="mt-2 text-xs text-slate-500">
            JPEG, PNG hoặc WebP. Tối đa {MAX_SIZE_MB}MB.
          </p>
        </div>
      </div>
    </section>
  )
}