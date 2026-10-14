// =====================================================================
// Trang chủ — placeholder, sẽ hoàn thiện ở Giai đoạn 7
// =====================================================================

import Link from 'next/link'
import { Search, Home } from 'lucide-react'
import { SITE_NAME } from '@/lib/constants'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <section className="text-center py-12 sm:py-20">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Home className="h-4 w-4" aria-hidden />
          <span>Nền tảng tìm phòng trọ</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
          Tìm phòng trọ dễ dàng cùng{' '}
          <span className="text-primary">{SITE_NAME}</span>
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 mb-8">
          Hàng ngàn phòng trọ, chung cư mini, nhà nguyên căn được cập nhật liên
          tục. Tìm kiếm theo khu vực, giá cả, tiện nghi phù hợp với bạn.
        </p>

        {/* Nút CTA tạm — search sẽ làm ở Giai đoạn 7 */}
        <Link
          href="/phong"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Search className="h-5 w-5" aria-hidden />
          Tìm phòng ngay
        </Link>
      </section>

      {/* Placeholder cho danh sách tin — Giai đoạn 7 */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Tin mới nhất
        </h2>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">
            Danh sách tin sẽ hiển thị ở đây sau khi hoàn thành Giai đoạn 6–7.
          </p>
        </div>
      </section>
    </div>
  )
}