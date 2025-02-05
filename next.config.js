/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other config options
  
  env: {
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  },

  // Optional: Add runtime checks
  onDemandEntries: {
    // Add warning if key is missing
    webpack(config, { dev }) {
      if (dev && !process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
        console.warn('\x1b[33m%s\x1b[0m', 
          'Warning: NEXT_PUBLIC_ALCHEMY_API_KEY is not set in .env.local'
        )
      }
      return config
    }
  }
}

module.exports = nextConfig 