'use client'

import { useState, useTransition } from 'react'
import { X, Loader2, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { createReportAction } from '@/lib/actions/interaction'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const REASONS = [
  { value: 'Tin giả / Không có thật', label: 'Tin giả / Không có thật' },
  { value: 'Lừa đảo / Yêu cầu đặt cọc trước', label: 'Lừa đảo / Yêu cầu đặt cọc trước' },
  { value: 'Thông tin sai lệch', label: 'Thông tin sai lệch' },
  { value: 'Ảnh không đúng thực tế', label: 'Ảnh không đúng thực tế' },
  { value: 'Nội dung không phù hợp', label: 'Nội dung không phù hợp' },
  { value: 'Spam / Quảng cáo', label: 'Spam / Quảng cáo' },
  { value: 'Khác', label: 'Khác' },
]

interface Props {
  targetType: 'post' | 'comment'
  targetId: string
  open: boolean
  onClose: () => void
}

export function ReportDialog({ targetType, targetId, open, onClose }: Props) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason) {
      toast.error('Vui lòng chọn lý do')
      return
    }

    startTransition(async () => {
      const result = await createReportAction(
        targetType,
        targetId,
        reason,
        description
      )
      if (result.ok) {
        toast.success(result.message)
        setReason('')
        setDescription('')
        onClose()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isPending) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-slate-900">
              Báo cáo {targetType === 'post' ? 'tin đăng' : 'bình luận'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Lý do báo cáo <span className="text-red-600">*</span>
              </label>
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition-colors',
                      reason === r.value
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Mô tả thêm (tuỳ chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Chi tiết vấn đề bạn gặp phải..."
                rows={3}
                maxLength={2000}
                disabled={isPending}
                className="w-full resize-y rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-slate-500">
                {description.length}/2000 ký tự
              </p>
            </div>

            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Báo cáo sai sự thật có thể bị xử lý theo chính sách cộng đồng.
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending || !reason}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Flag className="mr-2 h-4 w-4" />
                  Gửi báo cáo
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}