import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import { AvatarCircleCover } from '@/components/AvatarCircleCover'

type Props = {
  token: string | null
  /** Masalan `/api/student/cabinet/files/avatar` — faqat avtorizatsiyali GET */
  apiPath: string
  alt?: string
  sizeClass: string
  ringClassName?: string
  className?: string
}

/**
 * Kabinet fayllari maxfiy — brauzer `<img>` Authorization yubormaydi; blob URL orqali ko‘rsatamiz.
 */
export function AuthedAvatarCircleCover({
  token,
  apiPath,
  alt,
  sizeClass,
  ringClassName,
  className,
}: Props) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !apiPath) {
      setSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }

    const ac = new AbortController()

    ;(async () => {
      try {
        const res = await fetch(apiUrl(apiPath), {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        })
        if (!res.ok) return
        const blob = await res.blob()
        if (ac.signal.aborted) return
        const u = URL.createObjectURL(blob)
        setSrc((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return u
        })
      } catch {
        if (!ac.signal.aborted) {
          setSrc((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
        }
      }
    })()

    return () => {
      ac.abort()
      setSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [token, apiPath])

  if (!src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-black/10 animate-pulse ${ringClassName ?? 'border border-[var(--color-border-subtle)]'} ${sizeClass} ${className ?? ''}`}
      />
    )
  }

  return (
    <AvatarCircleCover
      src={src}
      alt={alt ?? ''}
      sizeClass={sizeClass}
      ringClassName={ringClassName}
      className={className}
    />
  )
}
