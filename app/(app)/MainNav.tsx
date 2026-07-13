'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function MainNav({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const links = [
    { href: '/', label: t('gallery') },
    { href: '/new', label: t('new') },
    { href: '/my', label: t('my') },
    ...(isAdmin
      ? [
          { href: '/admin/brandbook', label: t('admin') },
          { href: '/admin/materials', label: t('materials') },
        ]
      : []),
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="flex items-center gap-5 overflow-x-auto">
      <Link href="/" className="shrink-0 text-base font-bold tracking-tight">
        Good Brandbook
      </Link>
      <span className="h-4 w-px shrink-0 bg-border" aria-hidden />
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? 'page' : undefined}
          className={`shrink-0 whitespace-nowrap text-sm transition-colors ${
            isActive(link.href)
              ? 'font-semibold text-foreground'
              : 'font-medium text-foreground/60 hover:text-foreground'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
