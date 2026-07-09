export interface HtmlValidation {
  ok: boolean
  error?: string
}

// Salvage a clean HTML document from noisy LLM output.
// Ported from the extract_html_content pattern in abi/screenshot-to-code (MIT):
// prefer a DOCTYPE+<html> match, fall back to a bare <html> block, then to a
// fenced code block, then to the raw text.
export function extractHtml(raw: string): string {
  const withDoctype = raw.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
  if (withDoctype) return withDoctype[0].trim()

  const htmlTag = raw.match(/<html[\s\S]*<\/html>/i)
  if (htmlTag) return htmlTag[0].trim()

  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim()

  return raw.trim()
}

// FAST PRE-FILTER — NOT the security boundary. Regex denylists inherently leak,
// so this only fails obviously-bad output early with a clear message. The real
// guarantee is the render layer (lib/puppeteer/render.ts): JavaScript is
// disabled and every non-data:/about: request is aborted, so scripts can't run
// and SSRF/exfiltration can't happen regardless of what slips past here.
// Production hardening (BACKLOG): replace this with a real sanitizer
// (DOMPurify + jsdom, whole-document mode) before storing/re-rendering HTML.
const BANNED: ReadonlyArray<readonly [RegExp, string]> = [
  [/<script[\s>]/i, 'a <script> tag'],
  [/<iframe[\s>]/i, 'an <iframe>'],
  [/<object[\s>]/i, 'an <object>'],
  [/<embed[\s>]/i, 'an <embed>'],
  [/<link[\s>]/i, 'a <link> tag'],
  [/<base[\s>]/i, 'a <base> tag'],
  [/<meta[^>]+http-equiv/i, 'a <meta http-equiv> tag'],
  [/\son\w+\s*=/i, 'an inline event handler'],
  [/(?:javascript|vbscript):/i, 'a script URI'],
  // Remote or protocol-relative resource references (data: URIs are allowed —
  // they are inline and the renderer aborts everything non-data:/about: anyway).
  [/(?:src|href)\s*=\s*["']?\s*(?:https?:)?\/\//i, 'a remote resource reference'],
  [/@import/i, 'a CSS @import'],
  [/url\(\s*["']?\s*(?:https?:)?\/\//i, 'a remote CSS url()'],
]

export function validateHtml(html: string): HtmlValidation {
  if (!/<html[\s>]/i.test(html)) {
    return { ok: false, error: 'output does not contain an <html> document' }
  }
  for (const [pattern, label] of BANNED) {
    if (pattern.test(html)) {
      return { ok: false, error: `output contains ${label}` }
    }
  }
  return { ok: true }
}
