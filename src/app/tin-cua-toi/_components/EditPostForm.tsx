'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Send, Lock } from 'lucide-react'
import { toast } from 'sonner'

import { updatePostAction, type PostActionState } from '@/lib/actions/post'
import { postSchema, type PostInput } from '@/lib/validations/post'
import { PROVINCES, ROOM_TYPES, formatPrice } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUploader, type UploadedImage } from '../../tin-moi/_components/ImageUploader'
import { AmenityPicker } from '../../tin-moi/_components/AmenityPicker'
import type { Amenity, PostStatus } from '@/types/app'

interface Props {
  postId: string
  postStatus: PostStatus
  userId: string
  initialData: {
    title: string
    description: string
    price: number
    area: number
    address: string
    province: string
    ward: string
    roomType: string
  }
  initialImages: UploadedImage[]
  selectedAmenityIds: string[]
  amenities: Pick<Amenity, 'id' | 'name' | 'slug' | 'icon' | 'category'>[]
  hasPendingRevision: boolean
}

export function EditPostForm({
  postId,
  postStatus,
  userId,
  initialData,
  initialImages,
  selectedAmenityIds,
  amenities,
  hasPendingRevision,
}: Props) {
  const [state, setState] = useState<PostActionState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [images, setImages] = useState<UploadedImage[]>(initialImages)
  const [amenityIds, setAmenityIds] = useState<string[]>(selectedAmenityIds)
  const router = useRouter()

  // Ảnh chỉ sửa được khi draft / rejected
  const imagesEditable =
    postStatus === 'draft' || postStatus === 'rejected'

  const form = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData.title,
      description: initialData.description,
      price: initialData.price,
      area: initialData.area,
      address: initialData.address,
      province: initialData.province,
      ward: initialData.ward,
      roomType: initialData.roomType as never,
      amenityIds: selectedAmenityIds,
    },
  })

  const priceValue = form.watch('price')

  const handleSubmit = (data: PostInput, submitNow: boolean) => {
    if (images.length === 0) {
      toast.error('Cần ít nhất 1 ảnh')
      return
    }

    const formData = new FormData()
    formData.set('title', data.title)
    formData.set('description', data.description)
    formData.set('price', String(data.price))
    formData.set('area', String(data.area))
    formData.set('address', data.address)
    formData.set('province', data.province)
    formData.set('ward', data.ward)
    formData.set('roomType', data.roomType)
    formData.set('submitNow', submitNow ? 'true' : 'false')

    data.amenityIds.forEach((id) => formData.append('amenityIds', id))
    images.forEach((img) => formData.append('imagePaths', img.path))

    startTransition(async () => {
      const result = await updatePostAction(postId, null, formData)
      setState(result)
      if (result.ok) {
        toast.success(result.message)
        router.push(`/tin-cua-toi/${postId}`)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Form {...form}>
      <form className="space-y-8">
        {state && !state.ok && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {hasPendingRevision && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Đang có bản chỉnh sửa chờ duyệt. Lưu lần này sẽ thay thế bản chỉnh
            sửa cũ.
          </div>
        )}

        {/* ===== SECTION 1: Basic ===== */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Thông tin cơ bản</h2>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề tin đăng *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Từ 10–200 ký tự.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả chi tiết *</FormLabel>
                  <FormControl>
                    <textarea
                      rows={6}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ===== SECTION 2: Price & area ===== */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Giá thuê & diện tích</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giá thuê (VNĐ/tháng) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={100000}
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription>
                    {priceValue > 0 ? `= ${formatPrice(priceValue)}` : ''}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diện tích (m²) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={form.control}
              name="roomType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại phòng *</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {ROOM_TYPES.map((rt) => (
                        <option key={rt.value} value={rt.value}>
                          {rt.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ===== SECTION 3: Address ===== */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Địa chỉ</h2>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tỉnh/Thành phố *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">-- Chọn --</option>
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phường/Xã *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ chi tiết *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ===== SECTION 4: Amenities ===== */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Tiện nghi</h2>

          <AmenityPicker
            amenities={amenities}
            selected={amenityIds}
            onChange={(ids) => {
              setAmenityIds(ids)
              form.setValue('amenityIds', ids)
            }}
            disabled={isPending}
          />
        </section>

        {/* ===== SECTION 5: Images ===== */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-1 text-lg font-semibold">Ảnh phòng</h2>

          {imagesEditable ? (
            <p className="mb-4 text-sm text-slate-600">
              Thêm, xoá hoặc sắp xếp lại ảnh. Ảnh đầu tiên là ảnh chính.
            </p>
          ) : (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Không thể sửa ảnh khi tin đã được đăng. Muốn đổi ảnh, bạn cần
                xoá tin và tạo tin mới.
              </span>
            </div>
          )}

          <ImageUploader
            userId={userId}
            images={images}
            onChange={setImages}
            disabled={isPending || !imagesEditable}
          />
        </section>

        {/* ===== Actions ===== */}
        <div className="flex flex-wrap gap-3">
          {postStatus === 'draft' || postStatus === 'rejected' ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit((d) => handleSubmit(d, false))}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu nháp
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit((d) => handleSubmit(d, true))}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Gửi duyệt
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={form.handleSubmit((d) => handleSubmit(d, true))}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Gửi bản chỉnh sửa
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}