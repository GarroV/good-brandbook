'use client'

import { useActionState, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { FORMATS, FORMAT_KEYS } from '@/lib/formats'
import { uploadMaterialAction, deleteMaterialAction, initialUploadState } from './actions'

export interface MaterialCard {
  id: string
  title: string
  kind: string
  format: string | null
  market: string | null
  thumbUrl: string | null
}

export function MaterialsManager({ items }: { items: MaterialCard[] }) {
  const t = useTranslations('admin_materials')
  const [state, formAction, pending] = useActionState(uploadMaterialAction, initialUploadState)
  const [formatFilter, setFormatFilter] = useState('')
  const [marketFilter, setMarketFilter] = useState('')

  const markets = useMemo(
    () => Array.from(new Set(items.map((m) => m.market).filter((m): m is string => Boolean(m)))),
    [items],
  )
  const filtered = items.filter(
    (m) =>
      (!formatFilter || m.format === formatFilter) &&
      (!marketFilter || m.market === marketFilter),
  )

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('file')}</span>
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="text-sm"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('title_label')}</span>
          <input
            type="text"
            name="title"
            placeholder={t('title_ph')}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t('format')}</span>
            <select name="format" className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">{t('any_format')}</option>
              {FORMAT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {FORMATS[key].label} — {FORMATS[key].width}×{FORMATS[key].height}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t('market')}</span>
            <input
              type="text"
              name="market"
              placeholder="UAE, TR, QA…"
              className="h-10 rounded-md border bg-background px-3 text-sm"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? t('uploading') : t('add')}
          </Button>
          {state.ok && <span className="text-sm text-muted-foreground">{t('added')}</span>}
          {state.error && (
            <span className="text-sm text-destructive">{`${t('error')}: ${state.error}`}</span>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={formatFilter}
              onChange={(event) => setFormatFilter(event.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">{t('all_formats')}</option>
              {FORMAT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {FORMATS[key].label}
                </option>
              ))}
            </select>
            <select
              value={marketFilter}
              onChange={(event) => setMarketFilter(event.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">{t('all_markets')}</option>
              {markets.map((market) => (
                <option key={market} value={market}>
                  {market}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              {filtered.length} / {items.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('no_matches')}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filtered.map((material) => (
            <li key={material.id} className="overflow-hidden rounded-lg border bg-card">
              {material.thumbUrl && (
                <a
                  href={material.thumbUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={t('open_full')}
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={material.thumbUrl}
                    alt={material.title}
                    className="aspect-square w-full cursor-zoom-in bg-muted object-cover transition-opacity hover:opacity-90"
                  />
                </a>
              )}
              <div className="p-2.5 text-xs">
                <div className="truncate font-semibold">{material.title}</div>
                <div className="mt-0.5 text-muted-foreground">
                  {material.format ?? t('any_format')}
                  {material.market ? ` · ${material.market}` : ''}
                </div>
                <form action={deleteMaterialAction.bind(null, material.id)}>
                  <button type="submit" className="mt-1 text-destructive hover:underline">
                    {t('delete')}
                  </button>
                </form>
              </div>
            </li>
          ))}
              </ul>
            )}
          </div>
      )}
    </div>
  )
}
