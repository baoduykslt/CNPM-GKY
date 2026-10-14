'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
] as const

export function SortSelect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('sort') ?? 'newest'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === 'newest') {
      params.delete('sort')
    } else {
      params.set('sort', e.target.value)
    }
    params.delete('page')
    router.push(`/phong?${params.toString()}`)
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="h-11 rounded-md border border-input bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}