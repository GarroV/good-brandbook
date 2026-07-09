import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Nunito, Geist_Mono } from 'next/font/google'
import './globals.css'

// Nunito: rounded + friendly (Dodo-adjacent) and covers Cyrillic — self-hosted
// by next/font at build time, so no runtime Google request (CSP-safe).
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin', 'cyrillic'], display: 'swap' })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Good Brandbook',
  description: 'Generate brand-compliant marketing layouts'
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={`${nunito.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
