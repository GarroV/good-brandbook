import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function GalleryPage() {
  const t = await getTranslations('gallery')

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground">{t('empty')}</p>
      <Link href="/new">
        <Button>{t('create_first')}</Button>
      </Link>
    </div>
  )
}
