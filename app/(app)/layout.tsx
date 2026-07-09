import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { isAuthDisabled } from '@/lib/dev-auth'

interface NavProfile {
  name: string
  role: string
  is_superadmin: boolean
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let profile: NavProfile

  if (isAuthDisabled()) {
    profile = { name: 'Dev (auth off)', role: 'admin', is_superadmin: true }
  } else {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data } = await supabase
      .from('users')
      .select('name, role, is_superadmin')
      .eq('id', user.id)
      .single()
    if (!data) redirect('/login')
    profile = data
  }

  const t = await getTranslations('nav')
  const isAdmin = profile.role === 'admin' || profile.is_superadmin

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <span className="font-semibold text-sm">Design Terminal</span>
            <Separator orientation="vertical" className="h-4" />
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('gallery')}
            </Link>
            <Link href="/new" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('new')}
            </Link>
            <Link href="/my" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('my')}
            </Link>
            {isAdmin && (
              <Link href="/admin/brandbook" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('admin')}
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/materials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('materials')}
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile.name}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                {t('sign_out')}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
