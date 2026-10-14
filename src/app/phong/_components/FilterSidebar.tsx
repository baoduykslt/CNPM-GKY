'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { PROVINCES, ROOM_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { AmenityOption } from '@/lib/queries/posts'

interface Props {
  amenities: AmenityOption[]
}

const PRICE_PRESETS = [
  { label: 'Dưới 2 triệu', min: 0, max: 2_000_000 },
  { label: '2 – 3.5 triệu', min: 2_000_000, max: 3_500_000 },
  { label: '3.5 – 5 triệu', min: 3_500_000, max: 5_000_000 },
  { label: '5 – 10 triệu', min: 5_000_000, max: 10_000_000 },
  { label: 'Trên 10 triệu', min: 10_000_000, max: 100_000_000 },
]

export function FilterSidebar({ amenities }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [province, setProvince] = useState(searchParams.get('province') ?? '')
  const [roomType, setRoomType] = useState(searchParams.get('roomType') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '')
  const [minArea, setMinArea] = useState(searchParams.get('minArea') ?? '')
  const [maxArea, setMaxArea] = useState(searchParams.get('maxArea') ?? '')
  const [amenityIds, setAmenityIds] = useState<string[]>(
    searchParams.getAll('amenityIds')
  )

  const activeFilterCount =
    [province, roomType, minPrice, maxPrice, minArea, maxArea].filter(Boolean)
      .length + amenityIds.length

  const buildParams = () => {
    const params = new URLSearchParams(searchParams.toString())
    const setOrDelete = (key: string, val: string) => {
      if (val) params.set(key, val)
      else params.delete(key)
    }
    setOrDelete('province', province)
    setOrDelete('roomType', roomType)
    setOrDelete('minPrice', minPrice)
    setOrDelete('maxPrice', maxPrice)
    setOrDelete('minArea', minArea)
    setOrDelete('maxArea', maxArea)
    params.delete('amenityIds')
    amenityIds.forEach((id) => params.append('amenityIds', id))
    params.delete('page')
    return params
  }

  const handleApply = () => {
    router.push(`/phong?${buildParams().toString()}`)
  }

  const handleReset = () => {
    setProvince('')
    setRoomType('')
    setMinPrice('')
    setMaxPrice('')
    setMinArea('')
    setMaxArea('')
    setAmenityIds([])
    const params = new URLSearchParams(searchParams.toString())
    ;[
      'province', 'roomType', 'minPrice', 'maxPrice',
      'minArea', 'maxArea', 'amenityIds', 'page',
    ].forEach((k) => params.delete(k))
    router.push(`/phong?${params.toString()}`)
  }

  const handlePricePreset = (min: number, max: number) => {
    setMinPrice(String(min))
    setMaxPrice(String(max))
  }

  const toggleAmenity = (id: string) => {
    if (amenityIds.includes(id)) {
      setAmenityIds(amenityIds.filter((x) => x !== id))
    } else {
      setAmenityIds([...amenityIds, id])
    }
  }

  return (
    <div className="space-y-6 rounded-lg border bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Bộ lọc</h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-red-600 hover:underline"
          >
            <X className="h-3 w-3" />
            Xoá tất cả ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Tỉnh/thành */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Tỉnh/Thành phố
        </label>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Tất cả</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Loại phòng */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Loại phòng
        </label>
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Tất cả</option>
          {ROOM_TYPES.map((rt) => (
            <option key={rt.value} value={rt.value}>{rt.label}</option>
          ))}
        </select>
      </div>

      {/* Giá */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Khoảng giá
        </label>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Từ"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-9 text-sm"
          />
          <Input
            type="number"
            placeholder="Đến"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          {PRICE_PRESETS.map((preset) => {
            const active =
              Number(minPrice) === preset.min && Number(maxPrice) === preset.max
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePricePreset(preset.min, preset.max)}
                className={cn(
                  'block w-full rounded-md px-2 py-1 text-left text-xs transition-colors',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Diện tích */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Diện tích (m²)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Từ"
            value={minArea}
            onChange={(e) => setMinArea(e.target.value)}
            className="h-9 text-sm"
          />
          <Input
            type="number"
            placeholder="Đến"
            value={maxArea}
            onChange={(e) => setMaxArea(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Tiện nghi */}
      {amenities.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Tiện nghi
          </label>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {amenities.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-slate-50"
              >
                <Checkbox
                  checked={amenityIds.includes(a.id)}
                  onCheckedChange={() => toggleAmenity(a.id)}
                />
                <span className="select-none">{a.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t pt-4">
        <Button
          type="button"
          onClick={handleApply}
          className="flex-1"
        >
          Áp dụng
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={activeFilterCount === 0}
        >
          Xoá
        </Button>
      </div>
    </div>
  )
}