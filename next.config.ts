import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // pdfkit lit ses polices (fichiers .afm) sur le disque : on le garde hors du bundle et on embarque ses données.
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: { '/api/fiche/[id]/pdf': ['./node_modules/pdfkit/js/data/**'] },
  experimental: {
    // Photos et fiche technique (10 Mo max chacune) passent par les formulaires.
    serverActions: { bodySizeLimit: '25mb' },
    proxyClientMaxBodySize: '25mb',
  },
}

export default withNextIntl(nextConfig)
