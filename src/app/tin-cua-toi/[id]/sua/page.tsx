import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EditPostForm } from '../../_components/EditPostForm'

export const metadata: Metadata = {
  title: 'Sửa tin đăng',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/dang-nhap?next=/tin-cua-toi/${id}/sua`)

  // Fetch post + revision pending (nếu có)
  const { data: post } = await supabase
    .from('posts')
    .select(
      `
      *,
      post_images (id, storage_path, sort_order, alt_text),
      post_amenities (amenity_id),
      post_revisions (
        id, title, description, price, area, address, province, ward,
        room_type, status, created_at
      )
    `
    )
    .eq('id', id)
    .eq('author_id', user.id)
    .maybeSingle()

  if (!post) notFound()

  // Không cho sửa archived
  if (post.status === 'archived') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="mb-2 text-xl font-semibold">
          Không thể sửa tin này
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Tin đã bị lưu trữ. Vui lòng liên hệ ban quản trị nếu cần hỗ trợ.
        </p>
        <Link
          href="/tin-cua-toi"
          className="text-sm text-primary hover:underline"
        >
          ← Quay lại danh sách tin
        </Link>
      </div>
    )
  }

  // Lấy amenities để hiển thị cho user chọn
  const { data: allAmenities } = await supabase
    .from('amenities')
    .select('id, name, slug, icon, category')
    .eq('is_active', true)
    .order('category')
    .order('name')

  // Lấy revision pending (nếu có)
  const pendingRevision = (post.post_revisions ?? []).find(
    (r) => r.status === 'pending'
  )

  // Nếu có revision → prefill từ revision (nội dung user đã edit lần trước)
  // Ngược lại prefill từ post gốc
  const initialData = pendingRevision
    ? {
        title: pendingRevision.title,
        description: pendingRevision.description,
        price: pendingRevision.price,
        area: pendingRevision.area,
        address: pendingRevision.address,
        province: pendingRevision.province,
        ward: pendingRevision.ward,
        roomType: pendingRevision.room_type,
      }
    : {
        title: post.title,
        description: post.description,
        price: post.price,
        area: post.area,
        address: post.address,
        province: post.province,
        ward: post.ward,
        roomType: post.room_type,
      }

  // Ảnh hiện có (dùng cho ImageUploader)
  const currentImages = [...(post.post_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      path: img.storage_path,
      previewUrl: supabase.storage
        .from('post-images')
        .getPublicUrl(img.storage_path).data.publicUrl,
      altText: img.alt_text ?? '',
    }))

  // Amenity IDs hiện có
  const selectedAmenityIds = (post.post_amenities ?? [])
    .map((pa) => pa.amenity_id)
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href={`/tin-cua-toi/${post.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại chi tiết
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Sửa tin</h1>
        <p className="text-sm text-slate-600">
          {post.status === 'published' || post.status === 'pending'
            ? 'Tin đang được đăng công khai. Khi lưu, bản chỉnh sửa sẽ chờ duyệt — nội dung cũ vẫn hiển thị cho tới khi được duyệt.'
            : 'Chỉnh sửa thông tin tin đăng của bạn.'}
        </p>
      </div>

      <EditPostForm
        postId={post.id}
        postStatus={post.status}
        userId={user.id}
        initialData={initialData}
        initialImages={currentImages}
        selectedAmenityIds={selectedAmenityIds}
        amenities={allAmenities ?? []}
        hasPendingRevision={!!pendingRevision}
      />
    </div>
  )
}