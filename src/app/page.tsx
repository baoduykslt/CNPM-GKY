import Link from 'next/link'
import { Search, MapPin, TrendingUp, Shield, Zap } from 'lucide-react'
import { SITE_NAME } from '@/lib/constants'
import { getLatestPublishedPosts } from '@/lib/queries/posts'
import { PostCard } from '@/components/features/PostCard'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const { data: latestPosts } = await getLatestPublishedPosts(8)

  return (
    <div>
      {/* ==================== HERO ==================== */}
      <section className="border-b bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Tìm phòng trọ dễ dàng cùng{' '}
              <span className="text-primary">{SITE_NAME}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Hàng ngàn phòng trọ, chung cư mini, nhà nguyên căn được cập nhật
              liên tục. Tìm kiếm theo khu vực, giá cả, tiện nghi phù hợp với bạn.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/phong"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'gap-2'
                )}
              >
                <Search className="h-5 w-5" />
                Tìm phòng ngay
              </Link>
              <Link
                href="/tin-moi"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' })
                )}
              >
                Đăng tin cho thuê
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <Feature
            icon={<Shield className="h-6 w-6" />}
            title="Tin được kiểm duyệt"
            desc="Mọi tin đăng đều được moderator kiểm duyệt trước khi công khai."
          />
          <Feature
            icon={<Zap className="h-6 w-6" />}
            title="Cập nhật realtime"
            desc="Nhận thông báo ngay khi tin của bạn được duyệt hoặc có tương tác."
          />
          <Feature
            icon={<TrendingUp className="h-6 w-6" />}
            title="Hàng ngàn tin mới"
            desc="Danh sách phòng trọ phong phú, cập nhật hàng ngày."
          />
        </div>
      </section>

      {/* ==================== LATEST POSTS ==================== */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Tin mới nhất
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Những phòng trọ vừa được đăng gần đây
              </p>
            </div>
            <Link
              href="/phong"
              className="text-sm font-medium text-primary hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          {latestPosts.length === 0 ? (
            <EmptyPosts />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {latestPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{desc}</p>
      </div>
    </div>
  )
}

function EmptyPosts() {
  return (
    <div className="rounded-lg border border-dashed bg-white py-16 text-center">
      <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-300" />
      <h3 className="mb-1 font-semibold text-slate-900">
        Chưa có tin đăng nào
      </h3>
      <p className="text-sm text-slate-600">
        Hiện chưa có phòng trọ nào được đăng công khai.
      </p>
    </div>
  )
}