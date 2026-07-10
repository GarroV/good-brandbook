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

export interface ProductPhoto {
  id: string
  title: string
  tags: string[]
  storagePath: string
  mime: string
}

// All product photos for the workspace (kind='product_photo'), newest first.
export async function getProductPhotos(workspaceId: string): Promise<ProductPhoto[]> {
  const { data } = await createAdminClient()
    .from('brand_materials')
    .select('id, title, tags, storage_path, mime_type, created_at')
    .eq('workspace_id', workspaceId)
    .eq('kind', 'product_photo')
    .order('created_at', { ascending: false })
  return (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    tags: (m.tags as string[]) ?? [],
    storagePath: m.storage_path,
    mime: m.mime_type,
  }))
}

// Deterministically pick the product photo that best matches a prompt: score by
// how many of a photo's keywords (title words + tags, RU/EN) appear in the
// prompt. Falls back to the most recent photo so we always offer a real shot —
// the user steers the choice by naming the product in their request.
export function matchProductPhoto(photos: ProductPhoto[], prompt: string): ProductPhoto | null {
  if (photos.length === 0) return null
  const p = prompt.toLowerCase()
  let best = photos[0]
  let bestScore = -1
  for (const photo of photos) {
    const keywords = [
      ...photo.title.toLowerCase().split(/[^\p{L}\p{N}]+/u),
      ...photo.tags.map((t) => t.toLowerCase()),
    ].filter((w) => w.length >= 3)
    const score = keywords.reduce((n, w) => (p.includes(w) ? n + 1 : n), 0)
    if (score > bestScore) {
      bestScore = score
      best = photo
    }
  }
  return best
}

// Pick + download the best-matching product photo as a data-URI, ready to be
// composited into a layout at the {{PRODUCT}} token. Null when none exist.
export async function resolveProductPhoto(
  workspaceId: string,
  prompt: string,
): Promise<{ title: string; dataUri: string } | null> {
  const photo = matchProductPhoto(await getProductPhotos(workspaceId), prompt)
  if (!photo) return null
  const { data, error } = await createAdminClient()
    .storage.from(MATERIALS_BUCKET)
    .download(photo.storagePath)
  if (error || !data) return null
  const bytes = Buffer.from(await data.arrayBuffer())
  return { title: photo.title, dataUri: `data:${photo.mime};base64,${bytes.toString('base64')}` }
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
