import axios from 'axios'
import type { FundMetadata } from '@/app/types/fund'

// Use your dedicated Pinata subdomain
const PINATA_GATEWAY = 'https://amaranth-possible-meerkat-979.mypinata.cloud/ipfs'

// Get IPFS URL with gateway
export const getIPFSUrl = (ipfsUri: string): string => {
  if (!ipfsUri) return ''
  
  // Handle full gateway URLs
  if (ipfsUri.startsWith('http')) {
    return ipfsUri
  }
  
  // Clean the hash
  const hash = ipfsUri.replace(/^ipfs:\/\//, '').trim()
  return `${PINATA_GATEWAY}/${hash}`
}

const DEFAULT_METADATA: FundMetadata = {
  name: 'Untitled Fund',
  description: 'Fund details temporarily unavailable',
  image: '',
  manager: '',
  strategy: '',
  socialLinks: {},
  performanceMetrics: {
    tvl: '0',
    returns: '0',
    investors: 0
  },
  updatedAt: Date.now()
}

// Get fund metadata
export const getFundMetadata = async (metadataUri: string): Promise<FundMetadata> => {
  try {
    if (!metadataUri) {
      throw new Error('No metadata URI provided')
    }

    // Clean the hash
    const hash = metadataUri.replace(/^ipfs:\/\//, '').trim()
    if (!hash) {
      throw new Error('Invalid IPFS hash')
    }

    const url = `${PINATA_GATEWAY}/${hash}`
    console.log('Fetching metadata from:', url)

    const response = await axios({
      method: 'get',
      url: url,
      headers: {
        'Accept': 'application/json',
      },
      timeout: 10000 // 10 second timeout
    })

    if (!response.data) {
      throw new Error('No data received')
    }

    // Validate and transform the data
    return {
      ...DEFAULT_METADATA,
      ...response.data,
      // Transform image URL if needed
      image: response.data.image ? getIPFSUrl(response.data.image) : '',
      // Ensure required fields
      name: response.data.name || DEFAULT_METADATA.name,
      description: response.data.description || DEFAULT_METADATA.description,
      updatedAt: response.data.updatedAt || Date.now()
    }
  } catch (error) {
    console.warn('Failed to fetch metadata:', error)
    return DEFAULT_METADATA
  }
}

// Upload file to IPFS
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data.hash
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    throw error
  }
}

// Upload metadata to IPFS
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadFundMetadata = async (metadata: any): Promise<string> => {
  try {
    const response = await axios.post('/api/metadata', metadata)
    return response.data.hash
  } catch (error) {
    console.error('Error uploading fund metadata:', error)
    throw error
  }
}

// Helper function to validate metadata format
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function isValidMetadata(data: any): data is FundMetadata {
  return (
    typeof data === 'object' &&
    data !== null &&
    (typeof data.name === 'string' || data.name === undefined) &&
    (typeof data.description === 'string' || data.description === undefined) &&
    (typeof data.image === 'string' || data.image === undefined)
  )
}

// Helper function for default metadata
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getDefaultMetadata = (): FundMetadata => ({
  name: 'Untitled Fund',
  description: 'Metadata temporarily unavailable',
  image: '',
  manager: '',
  strategy: '',
  socialLinks: {},
  performanceMetrics: {
    tvl: '0',
    returns: '0',
    investors: 0
  },
  updatedAt: Date.now()
})

// Upload with progress tracking
export const uploadToIPFSWithProgress = async (
  file: File,
  onProgress?: (loaded: number, total: number) => void
): Promise<string> => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(progressEvent.loaded, progressEvent.total)
        }
      },
    })

    return response.data.hash
  } catch (error) {
    console.error('Error uploading to IPFS with progress:', error)
    throw error
  }
}

// Fetch metadata from IPFS
export const fetchIPFSMetadata = async (hash: string): Promise<FundMetadata> => {
  try {
    // Clean the hash - remove any gateway prefixes
    const cleanHash = hash.replace(/^.*ipfs\//, '')
    
    const response = await axios.get(`/api/ipfs/${cleanHash}`, {
      timeout: 15000
    })

    if (response.data) {
      return response.data
    }

    throw new Error('No data received from IPFS')
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    throw error
  }
} 