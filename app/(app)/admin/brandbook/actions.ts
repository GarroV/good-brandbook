'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAuthDisabled } from '@/lib/dev-auth'
import { getAdminWorkspaceId } from '@/lib/workspace'
import type { BrandTokens } from '@/lib/claude/prompt'

export interface SaveBrandbookInput {
  tokens: BrandTokens
  context: string
}

export async function saveBrandbook(
  input: SaveBrandbookInput,
): Promise<{ ok: boolean; error?: string }> {
  // Admin-only mutation: authorize against the DB (source of truth), not just
  // the middleware route gate — server actions are a public surface.
  const workspaceId = await getAdminWorkspaceId()
  if (!workspaceId) return { ok: false, error: 'forbidden' }

  // Dev (auth off) writes via the admin client to bypass RLS; in prod the user
  // client's RLS already permits an upsert into the user's own workspace row.
  const writer = isAuthDisabled() ? createAdminClient() : await createClient()
  const { error } = await writer.from('brandbook').upsert(
    {
      workspace_id: workspaceId,
      tokens: input.tokens,
      context: input.context,
      updated_at: new Date().toISOString(),
      // jsonb row — skip strict typing of the tokens shape here.
    } as never,
    { onConflict: 'workspace_id' },
  )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
