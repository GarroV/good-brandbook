import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getAdminWorkspaceId } from '@/lib/workspace'
import { listMaterials, signedThumbUrl } from '@/lib/materials/repository'
import { MaterialsManager, type MaterialCard } from './MaterialsManager'

export default async function AdminMaterialsPage() {
  const t = await getTranslations('admin_materials')
  const workspaceId = await getAdminWorkspaceId()
  if (!workspaceId) notFound()
  const rows = await listMaterials(workspaceId)

  const items: MaterialCard[] = await Promise.all(
    rows.map(async (material) => ({
      id: material.id,
      title: material.title,
      kind: material.kind,
      format: material.format,
      market: material.market,
      thumbUrl: await signedThumbUrl(material.storage_path),
    })),
  )

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-8">
        <MaterialsManager items={items} />
      </div>
    </div>
  )
}
