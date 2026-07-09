import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { FORMATS, FORMAT_KEYS, type FormatKey } from '@/lib/formats'
import { buildPrompt, buildMockHtml, type BrandTokens } from '@/lib/claude/prompt'
import { generateHtml } from '@/lib/claude/client'
import { generateHtmlOpenAI } from '@/lib/openai/client'
import { extractHtml, validateHtml } from '@/lib/validation/html'
import { renderPreview } from '@/lib/puppeteer/render'
import { isAuthDisabled } from '@/lib/dev-auth'
import { getExemplars, loadReferenceImages, type ReferenceImage } from '@/lib/materials/repository'

// Puppeteer needs the Node.js runtime, and a single-format batch can take a while.
export const runtime = 'nodejs'
export const maxDuration = 300

function isFormatKey(value: unknown): value is FormatKey {
  return typeof value === 'string' && (FORMAT_KEYS as readonly string[]).includes(value)
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(request: NextRequest) {
  const authDisabled = isAuthDisabled()
  const supabase = await createClient()

  let userId: string | null = null
  if (!authDisabled) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    userId = user.id
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { format, prompt } = (body ?? {}) as { format?: unknown; prompt?: unknown }
  if (!isFormatKey(format)) {
    return NextResponse.json({ error: 'unknown format' }, { status: 400 })
  }
  if (typeof prompt !== 'string' || prompt.trim().length < 3) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  // Load the workspace brandbook. With auth off (dev), read the single seeded
  // brandbook via the admin client; otherwise scope to the user's workspace.
  let tokens: BrandTokens | null = null
  let context: string | null = null
  let workspaceId: string | null = null
  if (authDisabled) {
    const { data: brand } = await createAdminClient()
      .from('brandbook')
      .select('tokens, context, workspace_id')
      .limit(1)
      .maybeSingle()
    tokens = (brand?.tokens as BrandTokens | null) ?? null
    context = brand?.context ?? null
    workspaceId = brand?.workspace_id ?? null
  } else {
    const { data: profile } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('id', userId!)
      .single()
    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'no workspace for user' }, { status: 403 })
    }
    workspaceId = profile.workspace_id
    const { data: brand } = await supabase
      .from('brandbook')
      .select('tokens, context')
      .eq('workspace_id', profile.workspace_id)
      .maybeSingle()
    tokens = (brand?.tokens as BrandTokens | null) ?? null
    context = brand?.context ?? null
  }

  const promptInput = {
    format: FORMATS[format],
    formatKey: format,
    tokens,
    context,
    prompt: prompt.trim(),
  }

  let raw: string
  if (process.env.MOCK_GENERATION === '1') {
    // Dev-only: exercise the full flow without a Claude credential.
    raw = buildMockHtml(promptInput)
  } else {
    // Reference exemplars are best-effort: a missing/broken library must never
    // fail generation — we just fall back to text-only.
    let references: ReferenceImage[] = []
    if (workspaceId) {
      try {
        references = await loadReferenceImages(await getExemplars(workspaceId, format))
      } catch {
        references = []
      }
    }
    try {
      const assembled = buildPrompt(promptInput)
      raw =
        process.env.GENERATION_PROVIDER === 'openai'
          ? await generateHtmlOpenAI(assembled, references)
          : await generateHtml(assembled, references)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      return NextResponse.json({ error: `generation failed: ${message}` }, { status: 502 })
    }
  }

  const html = extractHtml(raw)
  const validation = validateHtml(html)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error, html }, { status: 422 })
  }

  // Legal is a per-workspace field, stamped in only at render/export time. The
  // returned/stored HTML keeps the {{LEGAL}} placeholder so layouts stay clean
  // and portable (a "use as base" in another market gets its own legal).
  const legal = typeof promptInput.tokens?.legal === 'string' ? promptInput.tokens.legal : ''
  const htmlForRender = html.replaceAll('{{LEGAL}}', escapeHtmlText(legal))

  let image: Uint8Array
  try {
    image = await renderPreview(htmlForRender, FORMATS[format])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return NextResponse.json({ error: `render failed: ${message}`, html }, { status: 500 })
  }

  const preview = `data:image/jpeg;base64,${Buffer.from(image).toString('base64')}`
  return NextResponse.json({ preview, html })
}
