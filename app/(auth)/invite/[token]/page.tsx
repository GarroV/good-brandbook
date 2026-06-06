'use client'

import { useEffect, useState, useTransition, use } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { acceptInvite } from './actions'

interface InviteData {
  email: string
  role: string
  workspace: string
}

export default function InvitePage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const t = useTranslations('auth.invite')
  const { token } = use(params)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((data: InviteData & { error?: string }) => {
        if (data.error) {
          setFetchError(
            data.error === 'already_accepted' ? t('already_accepted') : t('invalid')
          )
        } else {
          setInvite(data)
        }
      })
      .catch(() => setFetchError(t('invalid')))
  }, [token, t])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    startTransition(async () => {
      const result = await acceptInvite(token, name)
      if (result.error) {
        setSubmitError(
          result.error === 'already_accepted' ? t('already_accepted') : t('invalid')
        )
      } else {
        setDone(true)
      }
    })
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-destructive">{fetchError}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (done && invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{t('success_title')}</CardTitle>
            <CardDescription>{t('success_desc', { email: invite.email })}</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/login">
              <Button className="w-full">Sign in</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('subtitle', { workspace: invite.workspace, role: invite.role })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('email_label')}</Label>
              <Input value={invite.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('name_label')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('name_placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t('submitting') : t('submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
