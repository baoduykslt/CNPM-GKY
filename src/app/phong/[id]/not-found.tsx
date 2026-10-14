import Link from 'next/link'
import { Search } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Search className="h-8 w-8 text-slate-400" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">
        Không tìm thấy tin đăng
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        Tin có thể đã bị xoá, hết hạn hoặc chưa được duyệt công khai.
      </p>
      <Link href="/phong" className={buttonVariants()}>
        Xem các tin khác
      </Link>
    </div>
  )
}