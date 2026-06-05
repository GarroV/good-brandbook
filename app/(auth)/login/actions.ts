'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function sendOtp(email: string): Promise<{ error?: string }> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'invalid_email' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  })

  if (error) {
    return { error: 'invalid_email' }
  }

  return {}
}

export async function verifyOtp(
  email: string,
  token: string
): Promise<{ error?: string }> {
  if (!token || token.length !== 6) {
    return { error: 'invalid_code' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  })

  if (error) {
    return { error: 'invalid_code' }
  }

  redirect('/')
}
