import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Search as SearchIcon, Filter } from 'lucide-react'
import {
  searchPublishedPosts,
  getActiveAmenities,
} from '@/lib/queries/posts'
import { PostCard } from '@/components/features/PostCard'
import { SearchBar } from './_components/SearchBar'
import { SortSelect } from './_components/SortSelect'
import { FilterSidebar } from './_components/FilterSidebar'

export const metadata: Metadata = {
  title: 'Tìm phòng trọ',
  description: 'Tìm phòng trọ, chung cư mini, nhà nguyên căn cho thuê',
}

interface Props {
  searchParams: Promise<{
    q?: string
    province?: string
    ward?: string
    minPrice?: string
    maxPrice?: string
    minArea?: string
    maxArea?: string
    roomType?: string
    sort?: string
    page?: string
    amenityIds?: string | string[]
  }>
}

export default async function PostListPage({ searchParams }: Props) {
  const sp = await searchParams

  const amenityIds = sp.amenityIds
    ? Array.isArray(sp.amenityIds)
      ? sp.amenityIds
      : [sp.amenityIds]
    : []

  const params = {
    q: sp.q,
    province: sp.province,
    ward: sp.ward,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    minArea: sp.minArea ? Number(sp.minArea) : undefined,
    maxArea: sp.maxArea ? Number(sp.maxArea) : undefined,
    roomType: sp.roomType,
    amenityIds,
    sort: (sp.sort as 'newest' | 'price_asc' | 'price_desc') ?? 'newest',
    page: sp.page ? Number(sp.page) : 1,
  }

  const [{ data: posts, total }, amenities] = await Promise.all([
    searchPublishedPosts(params),
    getActiveAmenities(),
  ])

  const totalPages = Math.ceil(total / 12)
  const activeFilterCount =
    [
      sp.province, sp.roomType, sp.minPrice, sp.maxPrice,
      sp.minArea, sp.maxArea,
    ].filter(Boolean).length + amenityIds.length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tìm phòng trọ</h1>
        <p className="mt-1 text-sm text-slate-600">
          {total > 0
            ? `Tìm thấy ${total} tin đăng phù hợp`
            : 'Không có tin đăng nào'}
        </p>
      </div>

      {/* Search + sort */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Suspense fallback={<div className="h-11 flex-1 rounded-md border bg-slate-50" />}>
          <SearchBar />
        </Suspense>
        <Suspense fallback={<div className="h-11 w-40 rounded-md border bg-slate-50" />}>
          <SortSelect />
        </Suspense>
      </div>

      {/* Mobile filter toggle */}
      <details className="mb-4 rounded-lg border bg-white lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </span>
          <span className="text-xs text-slate-500">Nhấn để mở</span>
        </summary>
        <div className="border-t p-4">
          <Suspense fallback={null}>
            <FilterSidebar amenities={amenities} />
          </Suspense>
        </div>
      </details>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20">
            <Suspense fallback={null}>
              <FilterSidebar amenities={amenities} />
            </Suspense>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {posts.length === 0 ? (
            <EmptyResults hasFilter={!!(sp.q || activeFilterCount > 0)} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={params.page ?? 1}
                  totalPages={totalPages}
                  searchParams={sp as Record<string, string>}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyResults({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="rounded-lg border border-dashed bg-white py-16 text-center">
      <SearchIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
      <h3 className="mb-1 font-semibold text-slate-900">
        {hasFilter ? 'Không tìm thấy phòng nào' : 'Chưa có tin đăng nào'}
      </h3>
      <p className="text-sm text-slate-600">
        {hasFilter
          ? 'Thử điều chỉnh từ khóa hoặc bộ lọc của bạn.'
          : 'Hiện chưa có phòng trọ nào được đăng công khai.'}
      </p>
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | string[]>
}) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k === 'page') return
      if (Array.isArray(v)) v.forEach((x) => params.append(k, x))
      else params.set(k, v)
    })
    if (page > 1) params.set('page', String(page))
    return `/phong?${params.toString()}`
  }

  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <a
          href={buildHref(currentPage - 1)}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          ← Trước
        </a>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`gap-${i}`} className="px-2 text-slate-400">
            ...
          </span>
        ) : (
          <a
            key={p}
            href={buildHref(p)}
            className={
              p === currentPage
                ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                : 'rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100'
            }
          >
            {p}
          </a>
        )
      )}
      {currentPage < totalPages && (
        <a
          href={buildHref(currentPage + 1)}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          Sau →
        </a>
      )}
    </nav>
  )
}