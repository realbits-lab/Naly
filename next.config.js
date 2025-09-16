/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['postgres', 'drizzle-orm']
  },
  env: {
    FINANCIAL_DATASETS_API_KEY: process.env.FINANCIAL_DATASETS_API_KEY,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  }
}

module.exports = nextConfig