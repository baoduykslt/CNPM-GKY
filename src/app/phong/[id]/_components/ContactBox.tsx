'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phone, MessageCircle, Lock } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  phone: string | null
  authorName: string
  isLoggedIn: boolean
}

export function ContactBox({ phone, authorName, isLoggedIn }: Props) {
  const [revealed, setRevealed] = useState(false)

  const phoneClean = phone?.replace(/\D/g, '') ?? ''
  const zaloLink = phoneClean ? `https://zalo.me/${phoneClean}` : null

  // Chưa đăng nhập
  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-start gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <Link href="/dang-nhap" className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>{' '}
            để xem số điện thoại liên hệ
          </span>
        </div>
      </div>
    )
  }

  // Đã đăng nhập nhưng tác giả không để SĐT
  if (!phone) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm text-slate-500 italic">
          Người đăng chưa cung cấp số điện thoại
        </p>
      </div>
    )
  }

  // Chưa reveal
  if (!revealed) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <p className="mb-3 text-sm text-slate-600">
          Liên hệ trực tiếp với <strong>{authorName}</strong>
        </p>
        <Button
          type="button"
          className="w-full"
          size="lg"
          onClick={() => setRevealed(true)}
        >
          <Phone className="mr-2 h-4 w-4" />
          Hiện số điện thoại
        </Button>
      </div>
    )
  }

  // Đã reveal
  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="rounded-md bg-emerald-50 px-4 py-3 text-center">
        <p className="text-xs text-emerald-700">Số điện thoại</p>
        <a
          href={`tel:${phoneClean}`}
          className="text-xl font-bold text-emerald-800 hover:underline"
        >
          {phone}
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`tel:${phoneClean}`}
          className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
        >
          <Phone className="h-4 w-4" />
          Gọi ngay
        </a>

        {zaloLink ? (
          <a
            href={zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'gap-2'
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Zalo
          </a>
        ) : (
          <Button variant="outline" size="lg" disabled>
            <MessageCircle className="h-4 w-4" />
            Zalo
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Lưu ý: Cảnh giác lừa đảo. Không chuyển tiền trước khi xem phòng.
      </p>
    </div>
  )
}