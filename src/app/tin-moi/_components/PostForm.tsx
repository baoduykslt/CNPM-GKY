'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Send } from 'lucide-react'
import { toast } from 'sonner'

import { createPostAction, type PostActionState } from '@/lib/actions/post'
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
import { ImageUploader, type UploadedImage } from './ImageUploader'
import { AmenityPicker } from './AmenityPicker'
import type { Amenity } from '@/types/app'

interface Props {
  amenities: Pick<Amenity, 'id' | 'name' | 'slug' | 'icon' | 'category'>[]
  userId: string
}

export function PostForm({ amenities, userId }: Props) {
  const [state, setState] = useState<PostActionState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [amenityIds, setAmenityIds] = useState<string[]>([])

  const form = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      area: 0,
      address: '',
      province: '',
      ward: '',
      roomType: 'phong_tro',
      amenityIds: [],
    },
  })

  const priceValue = form.watch('price')

  const handleSubmit = (data: PostInput, submitNow: boolean) => {
    // Validate ảnh
    if (images.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 ảnh')
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
      const result = await createPostAction(null, formData)
      if (result && !result.ok) {
        setState(result)
        toast.error(result.message)
      }
      // Nếu thành công, server action tự redirect
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

        {/* ============ SECTION 1: Thông tin cơ bản ============ */}
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
                    <Input
                      placeholder="VD: Phòng trọ 20m² gần ĐH Bách Khoa, có gác lửng"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Từ 10–200 ký tự. Tiêu đề rõ ràng giúp tin của bạn được chú ý hơn.
                  </FormDescription>
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
                      placeholder="Mô tả về phòng, tiện ích, khu vực xung quanh, giờ giấc, điều kiện thuê..."
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Tối thiểu 30 ký tự.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ============ SECTION 2: Giá & diện tích ============ */}
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
                      placeholder="3500000"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription>
                    {priceValue > 0
                      ? `= ${formatPrice(priceValue)}`
                      : 'Nhập số tiền, không dấu chấm'}
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
                      placeholder="20"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription>Đơn vị m², VD: 20 hoặc 25.5</FormDescription>
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

        {/* ============ SECTION 3: Địa chỉ ============ */}
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
                        <option value="">-- Chọn tỉnh/thành --</option>
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
                      <Input placeholder="VD: Phường Bến Nghé" {...field} />
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
                    <Input
                      placeholder="VD: 123 Nguyễn Huệ, hẻm 45"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Số nhà, tên đường, hẻm. Địa chỉ chính xác giúp người thuê dễ tìm.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ============ SECTION 4: Tiện nghi ============ */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-1 text-lg font-semibold">Tiện nghi</h2>
          <p className="mb-4 text-sm text-slate-600">
            Chọn các tiện nghi có trong phòng.
          </p>

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

        {/* ============ SECTION 5: Ảnh ============ */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-1 text-lg font-semibold">Ảnh phòng *</h2>
          <p className="mb-4 text-sm text-slate-600">
            Thêm 1–10 ảnh. Ảnh đầu tiên sẽ là ảnh chính.
          </p>

          <ImageUploader
            userId={userId}
            images={images}
            onChange={setImages}
            disabled={isPending}
          />
        </section>

        {/* ============ Actions ============ */}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit((data) => handleSubmit(data, false))}
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
            onClick={form.handleSubmit((data) => handleSubmit(data, true))}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Gửi duyệt
          </Button>

          <p className="self-center text-sm text-slate-500">
            {isPending
              ? 'Đang xử lý...'
              : 'Lưu nháp không gửi duyệt. Gửi duyệt sẽ đợi moderator kiểm tra.'}
          </p>
        </div>
      </form>
    </Form>
  )
}