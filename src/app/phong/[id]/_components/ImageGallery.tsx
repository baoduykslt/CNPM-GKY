'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  images: { id: string; url: string; altText: string | null }[]
  title: string
}

export function ImageGallery({ images, title }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  const openLightbox = (i: number) => setLightboxIndex(i)
  const closeLightbox = () => setLightboxIndex(null)
  const next = () =>
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % images.length
    )
  const prev = () =>
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + images.length) % images.length
    )

  return (
    <>
      {/* Grid thumbnail */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => openLightbox(idx)}
            className={cn(
              'group relative aspect-square overflow-hidden rounded-md border bg-slate-100',
              idx === 0 && 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2'
            )}
          >
            <img
              src={img.url}
              alt={img.altText ?? `${title} - Ảnh ${idx + 1}`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {idx === 0 && (
              <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                Ảnh chính
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
              <ZoomIn className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10"
            aria-label="Đóng"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white hover:bg-black/60"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex].url}
            alt={images[lightboxIndex].altText ?? title}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white hover:bg-black/60"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}