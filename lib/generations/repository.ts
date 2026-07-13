import { createAdminClient } from '@/lib/supabase/server'

// Private bucket from migration 003 — holds each generation's HTML + preview.
const BUCKET = 'generated'
const LIST_LIMIT = 60

export interface SaveGenerationInput {
  workspaceId: string
  userId: string | null
  prompt: string
  format: string
  html: string // stored CLEAN (keeps the {{LEGAL}} placeholder) so export re-stamps
  previewBytes: Uint8Array
  // True for dev / no-auth (DISABLE_AUTH) runs — badged as TEST in the gallery.
  isTest: boolean
}

export interface GenerationCard {
  id: string
  format: string
  prompt: string
  createdAt: string
  previewUrl: string | null
  isTest: boolean
}

async function signedUrl(path: string): Promise<string | null> {
  const { data } = await createAdminClient().storage.from(BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

// Persist one generation: a batch + batch_item, HTML + preview in Storage, and a
// jpeg_preview asset row. Best-effort — returns null on failure so a storage/DB
// hiccup never loses the already-generated preview the caller still returns.
export async function saveGeneration(
  input: SaveGenerationInput,
): Promise<{ itemId: string } | null> {
  const admin = createAdminClient()

  const { data: batch } = await admin
    .from('batches')
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      prompt: input.prompt,
      status: 'draft',
      is_test: input.isTest,
    } as never)
    .select('id')
    .single()
  if (!batch) return null

  const { data: item } = await admin
    .from('batch_items')
    .insert({
      batch_id: batch.id,
      workspace_id: input.workspaceId,
      format: input.format,
      status: 'preview_ready',
    })
    .select('id')
    .single()
  if (!item) return null

  const base = `${input.workspaceId}/${item.id}`
  const htmlPath = `${base}/source.html`
  const previewPath = `${base}/preview.jpg`

  await admin.storage
    .from(BUCKET)
    .upload(htmlPath, Buffer.from(input.html, 'utf8'), { contentType: 'text/html', upsert: true })
  await admin.storage
    .from(BUCKET)
    .upload(previewPath, Buffer.from(input.previewBytes), {
      contentType: 'image/jpeg',
      upsert: true,
    })

  await admin.from('batch_items').update({ html_url: htmlPath }).eq('id', item.id)
  await admin.from('assets').insert({
    batch_item_id: item.id,
    workspace_id: input.workspaceId,
    type: 'jpeg_preview',
    url: previewPath,
  })

  return { itemId: item.id }
}

// Cards for the gallery (whole workspace) or "my layouts" (opts.userId). Joins
// batches → batch_items → jpeg_preview asset in JS to avoid embed typing issues.
export async function listGenerations(
  workspaceId: string,
  opts?: { userId?: string | null },
): Promise<GenerationCard[]> {
  const admin = createAdminClient()

  let query = admin
    .from('batches')
    .select('id, prompt, created_at, is_test')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT)
  if (opts?.userId) query = query.eq('user_id', opts.userId)

  const { data: batches } = await query
  if (!batches || batches.length === 0) return []
  const batchById = new Map(batches.map((b) => [b.id, b]))

  const { data: items } = await admin
    .from('batch_items')
    .select('id, batch_id, format')
    .in(
      'batch_id',
      batches.map((b) => b.id),
    )
  if (!items || items.length === 0) return []

  const { data: assets } = await admin
    .from('assets')
    .select('batch_item_id, url')
    .eq('type', 'jpeg_preview')
    .in(
      'batch_item_id',
      items.map((i) => i.id),
    )
  const previewByItem = new Map((assets ?? []).map((a) => [a.batch_item_id, a.url]))

  const cards: GenerationCard[] = []
  for (const item of items) {
    const batch = batchById.get(item.batch_id)
    if (!batch) continue
    const path = previewByItem.get(item.id)
    cards.push({
      id: item.id,
      format: item.format,
      prompt: batch.prompt,
      createdAt: batch.created_at,
      previewUrl: path ? await signedUrl(path) : null,
      isTest: batch.is_test ?? false,
    })
  }
  cards.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return cards
}

// HTML + format for a saved generation, scoped to the workspace. Used by the
// export route to re-render a final PNG/PDF (legal is re-stamped there).
export async function getGenerationForExport(
  itemId: string,
  workspaceId: string,
): Promise<{ html: string; format: string; prompt: string } | null> {
  const admin = createAdminClient()
  const { data: item } = await admin
    .from('batch_items')
    .select('format, html_url, batch_id')
    .eq('id', itemId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  if (!item?.html_url) return null

  const { data: batch } = await admin
    .from('batches')
    .select('prompt')
    .eq('id', item.batch_id)
    .maybeSingle()

  const { data, error } = await admin.storage.from(BUCKET).download(item.html_url)
  if (error || !data) return null
  return { html: await data.text(), format: item.format, prompt: batch?.prompt ?? '' }
}
