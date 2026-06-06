'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function acceptInvite(
  token: string,
  name: string
): Promise<{ error?: string }> {
  if (!name.trim()) return { error: 'Name is required' }

  const admin = createAdminClient()

  type InviteRow = {
    id: string
    email: string
    role: string
    accepted_at: string | null
    expires_at: string
    workspace_id: string
  }

  const { data, error: fetchError } = await admin
    .from('invites')
    .select('id, email, role, accepted_at, expires_at, workspace_id')
    .eq('token', token)
    .single()

  const invite = data as unknown as InviteRow | null

  if (fetchError || !invite) return { error: 'invalid' }
  if (invite.accepted_at) return { error: 'already_accepted' }
  if (new Date(invite.expires_at) < new Date()) return { error: 'invalid' }

  const { error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    email_confirm: true,
    user_metadata: {
      workspace_id: invite.workspace_id,
      name: name.trim(),
      role: invite.role
    }
  })

  if (createError && !createError.message.includes('already been registered')) {
    return { error: 'invite_failed' }
  }

  await admin
    .from('invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)

  return {}
}
