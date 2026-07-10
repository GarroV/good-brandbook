import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAuthDisabled } from '@/lib/dev-auth'
import { getActiveWorkspaceId } from '@/lib/workspace'
import { getGenerationForExport } from '@/lib/generations/repository'
import { FORMATS, type FormatKey } from '@/lib/formats'
import { renderFinal } from '@/lib/puppeteer/render'
import { saveDownloadToLocalLibrary } from '@/lib/library/local'
import type { BrandTokens } from '@/lib/claude/prompt'

// Puppeteer needs the Node.js runtime; a final render can take a while.
export const runtime = 'nodejs'
export const maxDuration = 120

function isFormatKey(value: string): value is FormatKey {
  return Object.prototype.hasOwnProperty.call(FORMATS, value)
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const workspaceId = await getActiveWorkspaceId()
  if (!workspaceId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const gen = await getGenerationForExport(id, workspaceId)
  if (!gen) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!isFormatKey(gen.format)) {
    return NextResponse.json({ error: 'unknown format' }, { status: 400 })
  }
  const format = FORMATS[gen.format]

  // Re-stamp the current workspace legal into the clean stored HTML.
  const reader = isAuthDisabled() ? createAdminClient() : await createClient()
  const { data: brand } = await reader
    .from('brandbook')
    .select('tokens')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  const legal = (brand?.tokens as BrandTokens | null)?.legal
  const html = gen.html.replaceAll('{{LEGAL}}', escapeHtmlText(typeof legal === 'string' ? legal : ''))

  const output = format.output === 'pdf' ? 'pdf' : 'png'
  let bytes: Uint8Array
  try {
    bytes = await renderFinal(html, format, output)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return NextResponse.json({ error: `render failed: ${message}` }, { status: 500 })
  }

  const contentType = output === 'pdf' ? 'application/pdf' : 'image/png'
  const filename = `${gen.format}-${id.slice(0, 8)}.${output}`

  // Also mirror the downloaded file into the local library folder (dev only;
  // no-op when LOCAL_LIBRARY_DIR is unset or in production). Best-effort.
  await saveDownloadToLocalLibrary(gen.format, filename, bytes)

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
