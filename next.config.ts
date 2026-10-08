import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    // Photos et fiche technique (10 Mo max chacune) passent par les formulaires.
    serverActions: { bodySizeLimit: '25mb' },
    proxyClientMaxBodySize: '25mb',
  },
}

export default withNextIntl(nextConfig)
