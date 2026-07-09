import { createAdminClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/types'

export type BrandMaterial = Tables<'brand_materials'>

// Private storage bucket created in migration 002.
export const MATERIALS_BUCKET = 'brand-materials'

// How many reference layouts to feed the model, and the per-image byte cap we
// are willing to inline into the request (keeps token cost and latency bounded).
const MAX_REFERENCES = 3
const MAX_REFERENCE_BYTES = 4 * 1024 * 1024

// A reference image ready to attach to a generation request.
export interface ReferenceImage {
  mime: string
  base64: string
  title: string
}

export interface SaveMaterialInput {
  title: string
  kind: 'exemplar' | 'product_photo'
  format: string | null
  market: string | null
  mime: string
  bytes: Uint8Array
  createdBy?: string | null
}

function extFor(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

// Recent exemplar layouts for this workspace + format. format-null rows
// (apply-to-any) are included as a fallback so a workspace with only generic
// references still gets guidance.
export async function getExemplars(
  workspaceId: string,
  formatKey: string,
  limit = MAX_REFERENCES,
): Promise<BrandMaterial[]> {
  const { data, error } = await createAdminClient()
    .from('brand_materials')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('kind', 'exemplar')
    .or(`format.eq.${formatKey},format.is.null`)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`load exemplars: ${error.message}`)
  return data ?? []
}

// Download the given materials from storage into inline base64. Broken or
// oversized assets are skipped rather than failing the whole generation —
// references are an enhancement, never a hard dependency.
export async function loadReferenceImages(
  materials: BrandMaterial[],
): Promise<ReferenceImage[]> {
  const admin = createAdminClient()
  const out: ReferenceImage[] = []
  for (const material of materials) {
    const { data, error } = await admin.storage
      .from(MATERIALS_BUCKET)
      .download(material.storage_path)
    if (error || !data) continue
    const bytes = new Uint8Array(await data.arrayBuffer())
    if (bytes.byteLength > MAX_REFERENCE_BYTES) continue
    out.push({
      mime: material.mime_type,
      base64: Buffer.from(bytes).toString('base64'),
      title: material.title,
    })
  }
  return out
}

export async function listMaterials(workspaceId: string): Promise<BrandMaterial[]> {
  const { data } = await createAdminClient()
    .from('brand_materials')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function signedThumbUrl(path: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .storage.from(MATERIALS_BUCKET)
    .createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

// Upload one material file to storage and record its row. Rolls back the
// uploaded object if the row insert fails so storage never accumulates
// orphaned files. Always scoped to the given workspace by the caller.
export async function saveMaterial(
  workspaceId: string,
  input: SaveMaterialInput,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const path = `${workspaceId}/${crypto.randomUUID()}.${extFor(input.mime)}`

  const { error: uploadError } = await admin.storage
    .from(MATERIALS_BUCKET)
    .upload(path, Buffer.from(input.bytes), { contentType: input.mime, upsert: false })
  if (uploadError) return { ok: false, error: uploadError.message }

  const { error: insertError } = await admin.from('brand_materials').insert({
    workspace_id: workspaceId,
    title: input.title,
    kind: input.kind,
    format: input.format,
    market: input.market,
    storage_path: path,
    mime_type: input.mime,
    source: 'upload',
    created_by: input.createdBy ?? null,
  })
  if (insertError) {
    await admin.storage.from(MATERIALS_BUCKET).remove([path])
    return { ok: false, error: insertError.message }
  }
  return { ok: true }
}

export async function deleteMaterial(workspaceId: string, id: string): Promise<void> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('brand_materials')
    .select('storage_path')
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .maybeSingle()
  if (!data) return
  await admin.storage.from(MATERIALS_BUCKET).remove([data.storage_path])
  await admin.from('brand_materials').delete().eq('workspace_id', workspaceId).eq('id', id)
}
