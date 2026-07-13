'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

const LOCALES = ['en', 'ru'] as const

export function LangToggle() {
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function choose(next: string) {
    if (next === locale) return
    document.cookie = `locale=${next};path=/;max-age=31536000`
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center gap-1 text-xs font-semibold" aria-busy={pending}>
      {LOCALES.map((code, index) => (
        <span key={code} className="flex items-center gap-1">
          {index > 0 && <span className="text-border">/</span>}
          <button
            type="button"
            onClick={() => choose(code)}
            className={
              code === locale ? 'text-foreground' : 'text-foreground/50 hover:text-foreground'
            }
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
