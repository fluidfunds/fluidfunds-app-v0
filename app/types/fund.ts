export interface FundMetadata {
  name: string
  description: string
  image: string
  manager: string
  socialLinks?: {
    twitter?: string
    discord?: string
    telegram?: string
  }
  strategy?: string
  performanceMetrics?: {
    tvl?: string
    returns?: string
    investors?: number
  }
  updatedAt: number
}

export interface Fund extends FundMetadata {
  address: string
  verified: boolean
  metadataUri: string
}

export interface FundInfo {
  address: string
  verified: boolean
  name: string
  manager: string
  description: string
  image?: string
  strategy: string
  socialLinks: {
    twitter?: string
    discord?: string
    telegram?: string
  }
  performanceMetrics: {
    tvl: string
    returns: string
    investors: number
  }
  updatedAt: number
  metadataUri: string
  blockNumber: number
} 