import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: [
      'nftstorage.link',
      'gateway.pinata.cloud',
      'ipfs.io',
      'dweb.link'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nftstorage.link',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
        pathname: '/ipfs/**',
      }
    ],
    unoptimized: true
  },
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  }
}

export default nextConfig
