import { notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAuthDisabled } from '@/lib/dev-auth'
import { getAdminWorkspaceId } from '@/lib/workspace'
import { getTranslations } from 'next-intl/server'
import type { BrandTokens } from '@/lib/claude/prompt'
import { BrandbookForm } from './BrandbookForm'

// Admin-only page: authorize against the DB, then read that workspace's row.
async function loadBrandbook(): Promise<{ tokens: BrandTokens; context: string } | null> {
  const workspaceId = await getAdminWorkspaceId()
  if (!workspaceId) return null

  const reader = isAuthDisabled() ? createAdminClient() : await createClient()
  const { data } = await reader
    .from('brandbook')
    .select('tokens, context')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  return { tokens: (data?.tokens as BrandTokens) ?? {}, context: data?.context ?? '' }
}

export default async function AdminBrandbookPage() {
  const t = await getTranslations('admin_brandbook')
  const brand = await loadBrandbook()
  if (!brand) notFound()
  const { tokens, context } = brand

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-8">
        <BrandbookForm initialTokens={tokens} initialContext={context} />
      </div>
    </div>
  )
}
