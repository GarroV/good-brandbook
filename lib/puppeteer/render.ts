import puppeteer, { type Browser } from 'puppeteer'

export interface RenderSize {
  width: number
  height: number
}

const RENDER_TIMEOUT_MS = 15000
const SETTLE_MS = 250

// One shared browser reused across renders (screenshot-to-code pattern) — much
// cheaper than launching Chromium per request. On Railway/Docker,
// PUPPETEER_EXECUTABLE_PATH points at the system Chromium installed in the image;
// locally it is unset and Puppeteer uses its own bundled Chromium.
let browserPromise: Promise<Browser> | null = null

function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    // --no-sandbox is required because the Docker image runs as root. Hardening
    // follow-up (BACKLOG): run Chromium as a non-root user with the setuid
    // sandbox instead, and deny egress to 169.254.169.254 / RFC1918 at the
    // network layer as defense-in-depth.
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  })
}

async function getBrowser(): Promise<Browser> {
  // Reuse the shared browser, but relaunch it if it crashed or disconnected —
  // otherwise one bad render would poison every subsequent request.
  if (browserPromise) {
    try {
      const existing = await browserPromise
      if (existing.connected) return existing
    } catch {
      // previous launch failed — fall through and relaunch
    }
    browserPromise = null
  }
  browserPromise = launchBrowser()
  return browserPromise
}

export type RenderOutput = 'jpeg' | 'png' | 'pdf'

// Renders a self-contained HTML document at the exact format size to the given
// output. On render timeout it captures whatever rendered rather than failing.
async function renderOnce(
  html: string,
  size: RenderSize,
  output: RenderOutput = 'jpeg',
): Promise<Uint8Array> {
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    // SECURITY BOUNDARY. validateHtml() is only a fast pre-filter (regex
    // denylists leak); the real guarantee is here. Disable JS so no script,
    // event handler, fetch/XHR/WebSocket or beacon can run, and abort every
    // network request except the inline document — so nothing the model (or a
    // prompt-injected brand context) emits can reach an internal/metadata URL
    // (SSRF) or exfiltrate data. A self-contained brand layout needs neither.
    await page.setJavaScriptEnabled(false)
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const url = req.url()
      if (url.startsWith('data:') || url.startsWith('about:')) {
        void req.continue()
      } else {
        void req.abort()
      }
    })
    await page.setViewport({ ...size, deviceScaleFactor: 1 })
    await page
      .setContent(html, { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS })
      .catch(() => undefined)
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
    if (output === 'pdf') {
      await page.emulateMediaType('screen')
      return await page.pdf({
        width: `${size.width}px`,
        height: `${size.height}px`,
        printBackground: true,
        pageRanges: '1',
      })
    }
    return await page.screenshot({
      type: output,
      ...(output === 'jpeg' ? { quality: 82 } : {}),
      clip: { x: 0, y: 0, width: size.width, height: size.height },
    })
  } finally {
    await page.close().catch(() => undefined)
  }
}

export async function renderPreview(html: string, size: RenderSize): Promise<Uint8Array> {
  try {
    return await renderOnce(html, size, 'jpeg')
  } catch {
    // The shared browser may have crashed mid-render — drop it and retry once.
    browserPromise = null
    return await renderOnce(html, size, 'jpeg')
  }
}

// Final export: PNG for digital formats, PDF for print. Same security boundary
// (JS off + network intercept) as the preview.
export async function renderFinal(
  html: string,
  size: RenderSize,
  output: 'png' | 'pdf',
): Promise<Uint8Array> {
  try {
    return await renderOnce(html, size, output)
  } catch {
    browserPromise = null
    return await renderOnce(html, size, output)
  }
}
