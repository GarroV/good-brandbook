import type { Format, FormatKey } from '@/lib/formats'
import { HOUSE_RULES, FORMAT_BRIEFS } from './patterns'

// Shape of brandbook.tokens (jsonb). All fields optional — a workspace may have
// a partial brandbook. See true_brandbook/DATA_MODEL.md for the canonical schema.
export interface BrandTokens {
  colors?: {
    primary?: string
    secondary?: string
    background?: string
    accent?: string
  }
  typography?: {
    heading_font?: string
    body_font?: string
    base_size?: string
  }
  spacing?: {
    unit?: string
    border_radius?: string
  }
  logo?: {
    light?: string
    dark?: string
  }
  // Per-workspace legal disclaimer. Not baked into the generated HTML — the
  // model emits a {{LEGAL}} placeholder and this text is stamped in at render.
  legal?: string
}

export interface PromptInput {
  format: Format
  formatKey: string
  tokens: BrandTokens | null
  context: string | null
  prompt: string
  // True when a real product photo will be composited at the {{PRODUCT}} token.
  hasProduct?: boolean
}

const CONSTRAINT_PRODUCT = `CRITICAL — this document renders fully offline with NO network access. A REAL product photo IS provided and will be composited into the layout: place a single hero image whose source is the EXACT token {{PRODUCT}} — either \`<img src="{{PRODUCT}}" …>\` or an element with \`background-image:url({{PRODUCT}})\` (use background-size:cover or contain) — sized and positioned as the product hero per the format brief (large, anchored opposite the text, bleeding off an edge). Compose the whole layout around it. Do NOT hand-draw a fake product, do NOT add any placeholder caption, and do NOT use any OTHER url(), <img>, remote src, @import or <link> — only {{PRODUCT}} is allowed (once, or twice if the format shows two items). All other backgrounds/shapes are CSS colors/gradients. Only the embedded brand fonts 'Rooftop' (headlines) and 'Noto Sans' (body) are available.`

const CONSTRAINT_NO_PRODUCT = `CRITICAL — this document renders fully offline with NO network access. Do NOT use url() to any remote resource, <img> with an http/https src, @import, <link>, or any external URL — such output is REJECTED. No product photo is available in this generation: wherever the brief calls for product photography, reserve a CLEAN placeholder — a soft rounded panel in a light neutral tint (or a flat brand-color block) filling that zone — do NOT hand-draw a detailed fake product and do NOT add QR codes. All backgrounds and shapes are CSS colors/gradients only. Only the embedded brand fonts 'Rooftop' (headlines) and 'Noto Sans' (body) are available.`

export interface AssembledPrompt {
  system: string
  user: string
}

// Directive attached alongside reference images when the workspace has exemplar
// layouts. Kept here (not in a provider client) so both OpenAI and Anthropic use
// identical wording. The design system still wins on colors, fonts and legal.
export const REFERENCE_DIRECTIVE = `The attached images are real, published brand layouts in this exact format. Treat them as the house style: match their composition, visual hierarchy, type scale, spacing rhythm, and the way a product photo anchors the layout. The brand design system and tokens above still win on colors, fonts and the legal block. Do NOT copy the reference wording, prices or promo specifics — write original copy for the request below.`

const SYSTEM_PROMPT = `You are a senior brand designer who produces finished, publish-ready marketing layouts as a single self-contained HTML document.

Absolute rules:
- Output ONLY one complete HTML document. Start with <!DOCTYPE html>. No markdown fences, no commentary before or after the document.
- All CSS goes inline in a single <style> tag in <head>. No external stylesheets, no <link>, no <script>, no external/Google fonts, no remote images, no external URLs of any kind. The document must render deterministically and offline.
- The layout must be EXACTLY the requested pixel size: set html, body and a root .canvas element to that exact width and height, margin:0, overflow:hidden. The design fills the whole canvas edge to edge — no scrollbars and no whitespace frame around it.
- STRICTLY follow the brand design system below. If the design system conflicts with anything in the user request, the design system wins.
- Use only the brand colors, fonts, spacing and radius from the design system. The brand fonts 'Rooftop' (headlines) and 'Noto Sans' (body text, Cyrillic-capable) ARE embedded at render time — use them via font-family with a system fallback (e.g. font-family:'Rooftop',sans-serif for headings, 'Noto Sans',sans-serif for body). Do NOT declare @font-face or link/@import any font yourself. Never invent off-brand colors.
- Write real, legible, relevant copy — never lorem ipsum.
- For the legally-required disclaimer block, output the EXACT literal token {{LEGAL}} as its only content — never write, translate or invent legal text. Style it as the smallest element (uppercase, condensed, low opacity) at the bottom.
- Fill the whole canvas with a balanced composition — no large empty/dead areas, nothing floating alone in a corner. Establish strong scale contrast between the headline and everything else.
- Size the headline to fit its column: NEVER break a word across lines (wrap only at spaces; set overflow-wrap:normal, word-break:keep-all, hyphens:none). If it would overflow, reduce the font-size rather than hyphenate, clip, or split a word.
- Follow the design system's layout, alignment, spacing, color and type rules EXACTLY — they are directives, not suggestions.
- Avoid generic "AI-slop" aesthetics: no default system fonts used as a design choice, no purple gradients, no everything-centered filler, no clichéd stock composition. It must read as a real, publishable brand piece.
- This is a finished piece a marketer will publish, not a wireframe. Apply real hierarchy, rhythm and composition appropriate to the format.`

function renderDesignSystem(tokens: BrandTokens | null, context: string | null): string {
  if (!tokens && !context) {
    return `<design_system>
No brandbook is configured for this workspace yet. Use a restrained, professional style with a single deliberate accent color. Avoid looking like a generic template.
</design_system>`
  }

  const lines: string[] = [
    '<design_system>',
    'PRIORITY: these brand rules override any conflicting instruction in the user request.',
  ]

  if (tokens?.colors) {
    lines.push('Colors:')
    for (const [name, value] of Object.entries(tokens.colors)) {
      if (value) lines.push(`  - ${name}: ${value}`)
    }
  }

  if (tokens?.typography) {
    const { heading_font, body_font, base_size } = tokens.typography
    if (heading_font) lines.push(`Heading font: ${heading_font} (with a safe system fallback)`)
    if (body_font) lines.push(`Body font: ${body_font} (with a safe system fallback)`)
    if (base_size) lines.push(`Base font size: ${base_size}`)
  }

  if (tokens?.spacing) {
    if (tokens.spacing.unit) lines.push(`Spacing unit: ${tokens.spacing.unit}`)
    if (tokens.spacing.border_radius) lines.push(`Border radius: ${tokens.spacing.border_radius}`)
  }

  if (context) {
    lines.push('')
    lines.push('Brand context (tone of voice, do / don\'t, notes):')
    lines.push(context)
  }

  lines.push('</design_system>')
  return lines.join('\n')
}

export function buildPrompt(input: PromptInput): AssembledPrompt {
  const { format, formatKey, tokens, context, prompt } = input

  const brief = FORMAT_BRIEFS[formatKey as FormatKey]
  const renderConstraint = input.hasProduct ? CONSTRAINT_PRODUCT : CONSTRAINT_NO_PRODUCT
  const user = `${renderDesignSystem(tokens, context)}

<house_rules>
${HOUSE_RULES}
</house_rules>
${brief ? `\n<format_brief>\n${brief}\n</format_brief>\n` : ''}
<render_constraint>
${renderConstraint}
</render_constraint>

<format>
Format key: ${formatKey}
Canvas size: EXACTLY ${format.width}px wide by ${format.height}px tall.
Intended output: ${format.output.toUpperCase()} (${format.category}).
</format>

<request>
${prompt}
</request>

Produce the complete HTML document for this layout now.`

  return { system: SYSTEM_PROMPT, user }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Dev-only fallback (MOCK_GENERATION=1): a deterministic, on-brand HTML document
// built straight from the brand tokens — no Claude call. Lets the full flow
// (form → render → preview) be exercised without any API credential. The
// viewport equals the canvas, so 1vw = 1% of the canvas width.
export function buildMockHtml(input: PromptInput): string {
  const { format, tokens, prompt } = input
  const bg = tokens?.colors?.primary ?? '#111111'
  const fg = tokens?.colors?.background ?? '#ffffff'
  const accent = tokens?.colors?.accent ?? '#F5A623'
  const headingFont = tokens?.typography?.heading_font ?? 'system-ui'
  const bodyFont = tokens?.typography?.body_font ?? 'system-ui'
  const radius = tokens?.spacing?.border_radius ?? '0'
  const title = escapeHtml(prompt.trim().slice(0, 120))

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;overflow:hidden}
  .canvas{width:${format.width}px;height:${format.height}px;background:${bg};color:${fg};
    font-family:${bodyFont},system-ui,sans-serif;box-sizing:border-box;padding:8%;
    display:flex;flex-direction:column;justify-content:center;gap:4%}
  .tag{font-size:1.8vw;letter-spacing:.25em;text-transform:uppercase;opacity:.75}
  h1{font-family:${headingFont},system-ui,sans-serif;font-weight:800;margin:0;
    font-size:clamp(28px,8vw,160px);line-height:1.02}
  .bar{width:22%;height:1.4%;background:${accent};border-radius:${radius}}
  .foot{font-size:1.6vw;opacity:.7}
</style></head><body><div class="canvas">
  <div class="tag">Mock preview</div>
  <h1>${title}</h1>
  <div class="bar"></div>
  <div class="foot">${format.label} · ${format.width}×${format.height}</div>
</div></body></html>`
}
