'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { FORMAT_KEYS } from '@/lib/formats'
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t('title_label')}</span>
            <input
              type="text"
              name="title"
              placeholder={t('title_ph')}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t('kind')}</span>
            <select name="kind" className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="exemplar">{t('kind_exemplar')}</option>
              <option value="product_photo">{t('kind_product')}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t('format')}</span>
            <select name="format" className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">{t('any_format')}</option>
              {FORMAT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
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
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((material) => (
            <li key={material.id} className="overflow-hidden rounded-lg border">
              {material.thumbUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={material.thumbUrl}
                  alt={material.title}
                  className="aspect-square w-full bg-muted object-cover"
                />
              )}
              <div className="p-2 text-xs">
                <div className="truncate font-medium">{material.title}</div>
                <div className="text-muted-foreground">
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
  )
}
