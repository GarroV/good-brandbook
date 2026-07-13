import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { isAuthDisabled } from '@/lib/dev-auth'
import { MainNav } from './MainNav'
import { LangToggle } from './LangToggle'

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
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <MainNav isAdmin={isAdmin} />
          <div className="flex shrink-0 items-center gap-3">
            <LangToggle />
            <span className="hidden text-sm font-medium text-foreground/70 sm:inline">
              {profile.name}
            </span>
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
