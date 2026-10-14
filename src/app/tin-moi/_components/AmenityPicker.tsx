'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { Amenity } from '@/types/app'

interface Props {
  amenities: Pick<Amenity, 'id' | 'name' | 'slug' | 'icon' | 'category'>[]
  selected: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  'tien-ich': 'Tiện ích',
  'noi-that': 'Nội thất',
  'an-ninh': 'An ninh',
  'moi-truong': 'Môi trường',
  'dich-vu': 'Dịch vụ',
}

export function AmenityPicker({
  amenities,
  selected,
  onChange,
  disabled,
}: Props) {
  // Group theo category
  const grouped = amenities.reduce<Record<string, typeof amenities>>(
    (acc, a) => {
      const key = a.category ?? 'khac'
      acc[key] = acc[key] ?? []
      acc[key].push(a)
      return acc
    },
    {}
  )

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h4 className="mb-2 text-sm font-medium text-slate-700">
            {CATEGORY_LABELS[cat] ?? cat}
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-slate-50"
              >
                <Checkbox
                  checked={selected.includes(a.id)}
                  onCheckedChange={() => toggle(a.id)}
                  disabled={disabled}
                />
                <span className="select-none">{a.name}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {amenities.length === 0 && (
        <p className="text-sm text-slate-500 italic">
          Chưa có tiện nghi nào trong hệ thống.
        </p>
      )}
    </div>
  )
}