'use server'

import { revalidatePath } from 'next/cache'
import { getAdminWorkspaceId } from '@/lib/workspace'
import { saveMaterial, deleteMaterial } from '@/lib/materials/repository'
import { FORMAT_KEYS } from '@/lib/formats'

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp']
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export interface UploadState {
  ok: boolean
  error?: string
}

export const initialUploadState: UploadState = { ok: false }

export async function uploadMaterialAction(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const workspaceId = await getAdminWorkspaceId()
  if (!workspaceId) return { ok: false, error: 'forbidden' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'no file' }
  if (!ALLOWED_MIME.includes(file.type)) return { ok: false, error: 'invalid file type' }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'file too large' }

  const title = ((formData.get('title') as string) || '').trim() || file.name
  const kind = formData.get('kind') === 'product_photo' ? 'product_photo' : 'exemplar'
  const formatRaw = (formData.get('format') as string) || ''
  const format = (FORMAT_KEYS as readonly string[]).includes(formatRaw) ? formatRaw : null
  const market = ((formData.get('market') as string) || '').trim() || null

  const bytes = new Uint8Array(await file.arrayBuffer())
  const result = await saveMaterial(workspaceId, {
    title,
    kind,
    format,
    market,
    mime: file.type,
    bytes,
  })
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath('/admin/materials')
  return { ok: true }
}

export async function deleteMaterialAction(id: string): Promise<void> {
  const workspaceId = await getAdminWorkspaceId()
  if (!workspaceId) return
  await deleteMaterial(workspaceId, id)
  revalidatePath('/admin/materials')
}
