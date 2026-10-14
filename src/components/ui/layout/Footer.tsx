// =====================================================================
// Footer — chân trang
// =====================================================================

import Link from 'next/link'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <h3 className="font-semibold text-slate-900">{SITE_NAME}</h3>
            <p className="mt-2 text-sm text-slate-600">{SITE_DESCRIPTION}</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Liên kết</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link href="/phong" className="text-slate-600 hover:text-primary">
                  Tìm phòng
                </Link>
              </li>
              <li>
                <Link href="/tin-moi" className="text-slate-600 hover:text-primary">
                  Đăng tin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Hỗ trợ</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link href="/dieu-khoan" className="text-slate-600 hover:text-primary">
                  Điều khoản
                </Link>
              </li>
              <li>
                <Link href="/bao-mat" className="text-slate-600 hover:text-primary">
                  Bảo mật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {SITE_NAME}. Bảo lưu mọi quyền.
        </div>
      </div>
    </footer>
  )
}