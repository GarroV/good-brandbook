import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAuthDisabled } from '@/lib/dev-auth'

// Resolve the workspace to operate on for the current request.
//   - dev (auth off): the single seeded workspace (admin client, no session)
//   - prod: the authenticated user's workspace
// Returns null when there is no session or no workspace. Server-only: uses
// cookies() via createClient.
export async function getActiveWorkspaceId(): Promise<string | null> {
  if (isAuthDisabled()) {
    const { data } = await createAdminClient()
      .from('workspaces')
      .select('id')
      .limit(1)
      .maybeSingle()
    return data?.id ?? null
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('id', user.id)
    .single()
  return data?.workspace_id ?? null
}

// Like getActiveWorkspaceId, but authorizes the caller as an ADMIN of that
// workspace against the DB (source of truth — not stale JWT claims). Returns
// null for non-admins / no session. Use on every admin mutation and page:
// middleware also gates /admin/*, but server actions are a public surface and
// must authorize independently (defense in depth). Dev (auth off) is admin.
export async function getAdminWorkspaceId(): Promise<string | null> {
  if (isAuthDisabled()) {
    const { data } = await createAdminClient()
      .from('workspaces')
      .select('id')
      .limit(1)
      .maybeSingle()
    return data?.id ?? null
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('workspace_id, role, is_superadmin')
    .eq('id', user.id)
    .single()
  if (!data) return null
  if (data.role !== 'admin' && !data.is_superadmin) return null
  return data.workspace_id
}
