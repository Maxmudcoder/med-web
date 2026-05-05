import type { ReactNode } from 'react'
import { stickerSrc } from '@/lib/stickerSrc'

export type AvatarCircleCoverProps = {
  src: string
  alt?: string
  /** Masalan: `h-20 w-20` — dumaloq uchun kvadrat boʻlishi kerak */
  sizeClass: string
  className?: string
  /** Ramka / halqa (Tailwind) */
  ringClassName?: string
  /** Yuklash indikatori kabi — `absolute inset-0` bilan toʻliq qoplash mumkin */
  overlay?: ReactNode
}

/**
 * Yuklangan rasm istalgan oʻlcham va nisbatda boʻlsa ham dumaloq ichida markazdan kesiladi
 * (`object-cover`), cheti boʻsh qolmaydi.
 */
export function AvatarCircleCover({
  src,
  alt = '',
  sizeClass,
  className = '',
  ringClassName = 'border border-[var(--color-border-subtle)] ring-2 ring-teal-500/35',
  overlay,
}: AvatarCircleCoverProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-black/10 ${ringClassName} ${sizeClass} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
        decoding="async"
        loading="lazy"
      />
      {overlay}
    </div>
  )
}

export type StaffStickerAvatarProps = Omit<AvatarCircleCoverProps, 'src'> & { stickerUrl: string }

export function StaffStickerAvatar({ stickerUrl, ...rest }: StaffStickerAvatarProps) {
  return <AvatarCircleCover src={stickerSrc(stickerUrl)} {...rest} />
}
