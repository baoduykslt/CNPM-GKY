// =====================================================================
// Trang đăng ký
// =====================================================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '../_components/SignupForm'

export const metadata: Metadata = {
  title: 'Đăng ký',
  description: 'Tạo tài khoản RoomConnect để đăng tin và tương tác',
}

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Đăng ký</h1>
        <p className="text-sm text-slate-600 mb-6">
          Tạo tài khoản để đăng tin và tương tác cùng cộng đồng
        </p>

        <SignupForm />

        <div className="mt-6 text-center text-sm text-slate-600">
          Đã có tài khoản?{' '}
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