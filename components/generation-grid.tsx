import { getTranslations } from 'next-intl/server'
import type { GenerationCard } from '@/lib/generations/repository'
import { Badge } from '@/components/ui/badge'

export async function GenerationGrid({ cards }: { cards: GenerationCard[] }) {
  const t = await getTranslations('generations')

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <li key={card.id} className="relative overflow-hidden rounded-lg border bg-card">
          {/* Meta badges over the preview. The same Badge is reused for the
              author marker later (per product decision) — add it alongside. */}
          {card.isTest && (
            <Badge
              variant="secondary"
              className="absolute left-2 top-2 z-10 uppercase tracking-wide shadow-sm"
            >
              {t('test')}
            </Badge>
          )}
          {card.previewUrl && (
            <a href={card.previewUrl} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.previewUrl}
                alt={card.prompt}
                className="aspect-square w-full cursor-zoom-in bg-muted object-cover transition-opacity hover:opacity-90"
              />
            </a>
          )}
          <div className="p-2.5 text-xs">
            <div className="line-clamp-2 font-medium">{card.prompt}</div>
            <div className="mt-0.5 text-muted-foreground">{card.format}</div>
            <a
              href={`/api/export/${card.id}`}
              className="mt-1.5 inline-block font-semibold text-foreground hover:underline"
            >
              {t('download')}
            </a>
          </div>
        </li>
      ))}
    </ul>
  )
}
