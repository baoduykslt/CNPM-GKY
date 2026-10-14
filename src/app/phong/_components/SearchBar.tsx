'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (q.trim()) {
      params.set('q', q.trim())
    } else {
      params.delete('q')
    }
    params.delete('page') // reset về trang 1
    router.push(`/phong?${params.toString()}`)
  }

  const handleClear = () => {
    setQ('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('page')
    router.push(`/phong?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="text"
        placeholder="Tìm theo tiêu đề, mô tả, địa chỉ..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-11 pl-10 pr-24"
      />
      {q && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-20 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Xoá tìm kiếm"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <Button
        type="submit"
        size="sm"
        className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2"
      >
        Tìm
      </Button>
    </form>
  )
}