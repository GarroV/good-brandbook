import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { isAuthDisabled } from '@/lib/dev-auth'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspaceId } from '@/lib/workspace'
import { listGenerations } from '@/lib/generations/repository'
import { GenerationGrid } from '@/components/generation-grid'

export default async function MyLayoutsPage() {
  const t = await getTranslations('my')
  const workspaceId = await getActiveWorkspaceId()

  // Own layouts only. Dev (auth off) has no user → falls back to the whole
  // workspace, which is fine for a single-user dev environment.
  let userId: string | null = null
  if (!isAuthDisabled()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  }

  const cards = workspaceId ? await listGenerations(workspaceId, { userId }) : []

  if (cards.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('empty')}</p>
        <Link href="/new">
          <Button>{t('create_first')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <div className="mt-8">
        <GenerationGrid cards={cards} />
      </div>
    </div>
  )
}
