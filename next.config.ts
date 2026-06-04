import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] }
  }
}

export default withNextIntl(nextConfig)
