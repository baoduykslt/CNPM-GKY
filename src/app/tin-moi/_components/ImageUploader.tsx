'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X, Star } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export interface UploadedImage {
  path: string
  previewUrl: string
  altText: string
}

interface Props {
  userId: string
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
  maxSizeMb?: number
  disabled?: boolean
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export function ImageUploader({
  userId,
  images,
  onChange,
  maxImages = 10,
  maxSizeMb = 5,
  disabled = false,
}: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // reset để chọn lại cùng file

    if (files.length === 0) return

    const remaining = maxImages - images.length
    if (remaining <= 0) {
      toast.error(`Đã đạt tối đa ${maxImages} ảnh`)
      return
    }

    const accepted = files.slice(0, remaining)
    if (files.length > remaining) {
      toast.warning(`Chỉ nhận ${remaining} ảnh, bỏ qua ${files.length - remaining} ảnh thừa`)
    }

    setIsUploading(true)
    const newImages: UploadedImage[] = []
    const errors: string[] = []

    for (const file of accepted) {
      // Validate
      if (!ACCEPTED.includes(file.type)) {
        errors.push(`${file.name}: định dạng không hỗ trợ`)
        continue
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        errors.push(`${file.name}: vượt ${maxSizeMb}MB`)
        continue
      }

      // Upload
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const path = `${userId}/tmp/${filename}`

      const { error } = await supabase.storage
        .from('post-images')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        errors.push(`${file.name}: ${error.message}`)
        continue
      }

      // Public URL để preview
      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(path)

      newImages.push({
        path,
        previewUrl: urlData.publicUrl,
        altText: '',
      })
    }

    setIsUploading(false)

    if (errors.length > 0) {
      toast.error(errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} lỗi khác)` : ''))
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages])
      toast.success(`Đã upload ${newImages.length} ảnh`)
    }
  }

  const handleRemove = async (index: number) => {
    const img = images[index]
    if (!img) return

    // Xoá trên storage (không block UI nếu lỗi)
    await supabase.storage.from('post-images').remove([img.path])

    onChange(images.filter((_, i) => i !== index))
  }

  const handleSetMain = (index: number) => {
    if (index === 0) return
    const reordered = [...images]
    const [moved] = reordered.splice(index, 1)
    reordered.unshift(moved)
    onChange(reordered)
  }

  const handleAltTextChange = (index: number, value: string) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, altText: value } : img
    )
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex flex-wrap gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          onChange={handleSelectFiles}
          className="hidden"
          disabled={disabled || isUploading || images.length >= maxImages}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading || images.length >= maxImages}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang upload...
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 h-4 w-4" />
              Chọn ảnh ({images.length}/{maxImages})
            </>
          )}
        </Button>
        <p className="text-xs text-slate-500 self-center">
          JPEG, PNG, WebP. Tối đa {maxSizeMb}MB/ảnh.
        </p>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, idx) => (
            <div
              key={img.path}
              className="group relative aspect-square overflow-hidden rounded-md border bg-slate-50"
            >
              <img
                src={img.previewUrl}
                alt={img.altText || `Ảnh ${idx + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Badge "Ảnh chính" cho ảnh đầu */}
              {idx === 0 && (
                <div className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Ảnh chính
                </div>
              )}

              {/* Overlay buttons */}
              <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetMain(idx)}
                    className="rounded-full bg-white/90 p-1.5 text-slate-700 hover:bg-white"
                    title="Đặt làm ảnh chính"
                    aria-label="Đặt làm ảnh chính"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="rounded-full bg-white/90 p-1.5 text-red-600 hover:bg-white"
                  title="Xoá ảnh"
                  aria-label="Xoá ảnh"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Alt text input */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <input
                  type="text"
                  value={img.altText}
                  onChange={(e) => handleAltTextChange(idx, e.target.value)}
                  placeholder="Mô tả ảnh (tuỳ chọn)"
                  className="w-full rounded border-0 bg-white/95 px-2 py-1 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={200}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !isUploading && (
        <p className="text-sm text-slate-500 italic">
          Chưa có ảnh nào. Vui lòng thêm ít nhất 1 ảnh.
        </p>
      )}
    </div>
  )
}