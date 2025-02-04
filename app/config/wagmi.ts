import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

// Create wagmi config
export const config = createConfig({
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
}) 