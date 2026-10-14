import type { Metadata } from 'next'
import { ResetPasswordForm } from '../_components/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Đặt lại mật khẩu',
  description: 'Đặt mật khẩu mới cho tài khoản RoomConnect',
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Đặt lại mật khẩu
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>

        <ResetPasswordForm />
      </div>
    </div>
  )
}