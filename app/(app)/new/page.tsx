'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { FORMATS, FORMAT_KEYS, type FormatKey } from '@/lib/formats'

interface GenerateResult {
  preview?: string
  html?: string
  id?: string | null
  error?: string
}

export default function NewLayoutPage() {
  const t = useTranslations('new')
  const [format, setFormat] = useState<FormatKey>('instagram_post')
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [showHtml, setShowHtml] = useState(false)

  const canSubmit = prompt.trim().length >= 3 && !isGenerating

  // Elapsed-seconds counter while generating — generation can take 15–40s, so a
  // ticking timer reassures the user it isn't stuck.
  useEffect(() => {
    if (!isGenerating) return
    setElapsed(0)
    const started = Date.now()
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 250)
    return () => clearInterval(timer)
  }, [isGenerating])

  async function handleGenerate() {
    setIsGenerating(true)
    setResult(null)
    setShowHtml(false)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, prompt }),
      })
      const data: GenerateResult = await response.json()
      setResult(response.ok ? data : { error: data.error ?? t('error') })
    } catch {
      setResult({ error: t('error') })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t('format_label')}</span>
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as FormatKey)}
              disabled={isGenerating}
              className="h-10 rounded-md border bg-background px-3 text-sm disabled:opacity-50"
            >
              {FORMAT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {FORMATS[key].label} — {FORMATS[key].width}×{FORMATS[key].height}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t('prompt_label')}</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={t('prompt_placeholder')}
              rows={6}
              className="rounded-md border bg-background p-3 text-sm"
            />
          </label>

          <Button onClick={handleGenerate} disabled={!canSubmit}>
            {isGenerating ? t('generating') : t('generate')}
          </Button>

          {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-sm font-medium">
                  {t('generating')} · {elapsed}s
                </span>
                <span className="text-xs text-muted-foreground">{t('time_hint')}</span>
              </div>
            ) : result?.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.preview}
                alt={prompt}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-sm text-muted-foreground">{t('preview_empty')}</span>
            )}
          </div>

          {result?.preview && (
            <div className="flex items-center gap-2">
              {result.id && (
                <a
                  href={`/api/export/${result.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t('download')}
                </a>
              )}
              {result.html && (
                <Button variant="ghost" size="sm" onClick={() => setShowHtml((value) => !value)}>
                  {showHtml ? t('hide_html') : t('show_html')}
                </Button>
              )}
            </div>
          )}

          {showHtml && result?.html && (
            <pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
              {result.html}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
