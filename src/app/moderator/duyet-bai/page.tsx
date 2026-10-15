import type { Metadata } from 'next'
import { FileCheck, FileEdit } from 'lucide-react'
import { getPendingPosts, getPendingRevisions } from '@/lib/queries/admin'
import { PendingPostCard } from './_components/PendingPostCard'
import { PendingRevisionCard } from './_components/PendingRevisionCard'

export const metadata: Metadata = {
  title: 'Duyệt bài',
}

export default async function ModeratePage() {
  const [pendingPosts, pendingRevisions] = await Promise.all([
    getPendingPosts(),
    getPendingRevisions(),
  ])

  return (
    <div className="space-y-8">
      {/* Section bài mới */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-amber-600" />
          <h2 className="text-xl font-bold text-slate-900">
            Bài chờ duyệt ({pendingPosts.length})
          </h2>
        </div>

        {pendingPosts.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white py-12 text-center">
            <FileCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-900">Không có bài nào</p>
            <p className="text-sm text-slate-600">
              Tất cả bài đăng đã được xử lý.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingPosts.map((post) => (
              <PendingPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Section revision */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <FileEdit className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">
            Bản chỉnh sửa chờ duyệt ({pendingRevisions.length})
          </h2>
        </div>

        {pendingRevisions.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white py-12 text-center">
            <FileEdit className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-900">Không có bản sửa nào</p>
            <p className="text-sm text-slate-600">
              Tất cả bản chỉnh sửa đã được xử lý.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRevisions.map((rev) => (
              <PendingRevisionCard key={rev.id} revision={rev} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}