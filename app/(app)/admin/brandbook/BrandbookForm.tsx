'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { BrandTokens } from '@/lib/claude/prompt'
import { saveBrandbook } from './actions'

interface Props {
  initialTokens: BrandTokens
  initialContext: string
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border bg-background px-3 text-sm"
      />
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-9 w-9 shrink-0 rounded-md border"
          style={{ background: value || 'transparent' }}
        />
        <input
          type="text"
          value={value}
          placeholder="#000000"
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        />
      </div>
    </label>
  )
}

export function BrandbookForm({ initialTokens, initialContext }: Props) {
  const t = useTranslations('admin_brandbook')
  const [colors, setColors] = useState({
    primary: initialTokens.colors?.primary ?? '',
    secondary: initialTokens.colors?.secondary ?? '',
    background: initialTokens.colors?.background ?? '',
    accent: initialTokens.colors?.accent ?? '',
  })
  const [typography, setTypography] = useState({
    heading_font: initialTokens.typography?.heading_font ?? '',
    body_font: initialTokens.typography?.body_font ?? '',
    base_size: initialTokens.typography?.base_size ?? '',
  })
  const [spacing, setSpacing] = useState({
    unit: initialTokens.spacing?.unit ?? '',
    border_radius: initialTokens.spacing?.border_radius ?? '',
  })
  const [logo, setLogo] = useState({
    light: initialTokens.logo?.light ?? '',
    dark: initialTokens.logo?.dark ?? '',
  })
  const [context, setContext] = useState(initialContext)
  const [legal, setLegal] = useState(initialTokens.legal ?? '')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('saving')
    setErrorMsg('')
    const tokens: BrandTokens = { colors, typography, spacing, logo, legal }
    const result = await saveBrandbook({ tokens, context })
    if (result.ok) {
      setStatus('saved')
    } else {
      setStatus('error')
      setErrorMsg(result.error ?? '')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('colors')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label={t('primary')} value={colors.primary} onChange={(v) => setColors({ ...colors, primary: v })} />
          <ColorField label={t('secondary')} value={colors.secondary} onChange={(v) => setColors({ ...colors, secondary: v })} />
          <ColorField label={t('background')} value={colors.background} onChange={(v) => setColors({ ...colors, background: v })} />
          <ColorField label={t('accent')} value={colors.accent} onChange={(v) => setColors({ ...colors, accent: v })} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('typography')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('heading_font')} value={typography.heading_font} onChange={(v) => setTypography({ ...typography, heading_font: v })} />
          <Field label={t('body_font')} value={typography.body_font} onChange={(v) => setTypography({ ...typography, body_font: v })} />
          <Field label={t('base_size')} value={typography.base_size} onChange={(v) => setTypography({ ...typography, base_size: v })} placeholder="16px" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('spacing')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('unit')} value={spacing.unit} onChange={(v) => setSpacing({ ...spacing, unit: v })} placeholder="8px" />
          <Field label={t('radius')} value={spacing.border_radius} onChange={(v) => setSpacing({ ...spacing, border_radius: v })} placeholder="4px" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('logo')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('logo_light')} value={logo.light} onChange={(v) => setLogo({ ...logo, light: v })} placeholder="https://…" />
          <Field label={t('logo_dark')} value={logo.dark} onChange={(v) => setLogo({ ...logo, dark: v })} placeholder="https://…" />
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('context')}
        </h2>
        <textarea
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder={t('context_ph')}
          rows={6}
          className="rounded-md border bg-background p-3 text-sm"
        />
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('legal')}
        </h2>
        <textarea
          value={legal}
          onChange={(event) => setLegal(event.target.value)}
          placeholder={t('legal_ph')}
          rows={4}
          className="rounded-md border bg-background p-3 text-sm"
        />
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? t('saving') : t('save')}
        </Button>
        {status === 'saved' && <span className="text-sm text-muted-foreground">{t('saved')}</span>}
        {status === 'error' && <span className="text-sm text-destructive">{`${t('error')}: ${errorMsg}`}</span>}
      </div>
    </form>
  )
}
