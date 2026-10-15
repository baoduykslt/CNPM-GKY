'use client'

import { Volume2, VolumeX, BellOff, Play } from 'lucide-react'
import { useNotificationSound } from '@/lib/realtime/NotificationSoundProvider'

export function SoundToggle() {
  const { enabled, setEnabled, play, stop, isReady } = useNotificationSound()

  if (!isReady) return null

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`inline-flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
          enabled
            ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
        aria-pressed={enabled}
      >
        {enabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
        <span>{enabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
      </button>

      {enabled && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={play}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Play className="h-3.5 w-3.5" />
            Test
          </button>

          <button
            type="button"
            onClick={stop}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <BellOff className="h-3.5 w-3.5" />
            Dừng
          </button>
        </div>
      )}
    </div>
  )
}