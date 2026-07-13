import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['localhost:3000'],
  // Puppeteer must not be bundled by the server compiler — keep it external.
  serverExternalPackages: ['puppeteer']
}

export default withNextIntl(nextConfig)
