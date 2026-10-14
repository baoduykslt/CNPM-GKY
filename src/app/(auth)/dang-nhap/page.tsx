import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '../_components/LoginForm'

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào RoomConnect',
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Đăng nhập</h1>
        <p className="text-sm text-slate-600 mb-6">
          Chào mừng trở lại RoomConnect
        </p>

        <LoginForm />

        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-slate-600">
          <div>
            Chưa có tài khoản?{' '}
            <Link
              href="/dang-ky"
              className="font-medium text-primary hover:underline"
            >
              Đăng ký
            </Link>
          </div>
          <div>
            <Link
              href="/quen-mat-khau"
              className="text-sm text-slate-500 hover:text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}