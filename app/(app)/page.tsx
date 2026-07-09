import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getActiveWorkspaceId } from '@/lib/workspace'
import { listGenerations } from '@/lib/generations/repository'
import { GenerationGrid } from '@/components/generation-grid'

export default async function GalleryPage() {
  const t = await getTranslations('gallery')
  const workspaceId = await getActiveWorkspaceId()
  const cards = workspaceId ? await listGenerations(workspaceId) : []

  if (cards.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('empty')}</p>
        <Link href="/new">
          <Button>{t('create_first')}</Button>
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">{t('materials_hint')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('materials_hint')}</p>
        </div>
        <Link href="/new">
          <Button>{t('create_first')}</Button>
        </Link>
      </div>
      <div className="mt-8">
        <GenerationGrid cards={cards} />
      </div>
    </div>
  )
}
