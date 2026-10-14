import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '../_components/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Quên mật khẩu',
  description: 'Khôi phục mật khẩu tài khoản RoomConnect',
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Quên mật khẩu
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu
        </p>

        <ForgotPasswordForm />

        <div className="mt-6 text-center text-sm text-slate-600">
          Nhớ ra rồi?{' '}
          <Link
            href="/dang-nhap"
            className="font-medium text-primary hover:underline"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}