import { readFileSync } from 'fs'
import path from 'path'

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts')

interface FontFace {
  family: string
  file: string
  weight: number
  format: 'opentype' | 'truetype'
}

// Real Dodo brand fonts. Rooftop = headlines, Noto Sans = body (Cyrillic-capable).
const FONTS: FontFace[] = [
  { family: 'Rooftop', file: 'Rooftop-Bold.otf', weight: 700, format: 'opentype' },
  { family: 'Rooftop', file: 'Rooftop-Extrabold.otf', weight: 800, format: 'opentype' },
  { family: 'Noto Sans', file: 'NotoSans-Regular.ttf', weight: 400, format: 'truetype' },
  { family: 'Noto Sans', file: 'NotoSans-Bold.ttf', weight: 700, format: 'truetype' },
]

let cached: string | null = null

// A <style> block with the brand fonts inlined as base64 data-URIs. The render
// layer blocks all network (SSRF boundary) and disables JS, so fonts must be
// data-URIs to load. Read + encoded once per process.
export function brandFontStyle(): string {
  if (cached !== null) return cached
  const faces: string[] = []
  for (const font of FONTS) {
    try {
      const b64 = readFileSync(path.join(FONTS_DIR, font.file)).toString('base64')
      const mime = font.format === 'opentype' ? 'font/otf' : 'font/ttf'
      faces.push(
        `@font-face{font-family:'${font.family}';font-style:normal;font-weight:${font.weight};` +
          `font-display:swap;src:url(data:${mime};base64,${b64}) format('${font.format}');}`,
      )
    } catch {
      // missing font file — skip it; the layout falls back to system fonts
    }
  }
  cached = faces.length ? `<style id="brand-fonts">${faces.join('')}</style>` : ''
  return cached
}

// A deterministic render guard forced on top of whatever CSS the model emitted.
// A fixed-size, designed layout must NEVER hyphenate or split a word/number
// mid-token — the "Пепперони"→"Пеппе рони", "20%"→"2 0%" defect. !important so it
// wins over any break-word/break-all the model set; wrapping happens at spaces
// only. The model still sizes text to fit the canvas (system prompt rule).
const RENDER_GUARD =
  '<style id="render-guard">' +
  '*{-webkit-hyphens:none!important;hyphens:none!important;' +
  'overflow-wrap:normal!important;word-break:keep-all!important;}' +
  '</style>'

// Prepare an HTML document for the render layer: inject the brand-font @font-face
// block (data-URIs — network is blocked, so fonts must be inline) and the render
// guard into <head>. Called for both preview and final export.
export function prepareRenderHtml(html: string): string {
  const inject = brandFontStyle() + RENDER_GUARD
  if (html.includes('</head>')) return html.replace('</head>', `${inject}</head>`)
  if (html.includes('<head>')) return html.replace('<head>', `<head>${inject}`)
  return inject + html
}
