import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()

  type InviteRow = {
    id: string
    email: string
    role: string
    accepted_at: string | null
    expires_at: string
    workspace_id: string
    workspaces: { name: string } | null
  }

  const { data, error } = await supabase
    .from('invites')
    .select('id, email, role, accepted_at, expires_at, workspace_id, workspaces(name)')
    .eq('token', token)
    .single()

  const invite = data as unknown as InviteRow | null

  if (error || !invite) {
    return NextResponse.json({ error: 'invalid' }, { status: 404 })
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: 'already_accepted' }, { status: 410 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'invalid' }, { status: 410 })
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    workspace: invite.workspaces?.name ?? 'Design Terminal'
  })
}
