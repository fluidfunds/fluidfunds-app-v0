import { type NextConfig } from 'next'

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
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    turbo: {
      resolveAlias: {
        // Add any Turbopack-specific aliases here if needed
      },
      // Add any other Turbopack configurations if needed
    },
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/subgraph/:path*',
        destination: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-base-sepolia/:path*'
      }
    ]
  }
}

export default nextConfig
