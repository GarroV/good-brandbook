import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function MyLayoutsPage() {
  const t = await getTranslations('my')

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground">{t('empty')}</p>
      <Link href="/new">
        <Button>{t('create_first')}</Button>
      </Link>
    </div>
  )
}
