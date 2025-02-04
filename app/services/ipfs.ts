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
    // Clean the hash
    const hash = metadataUri.replace(/^ipfs:\/\//, '').trim()
    if (!hash) {
      console.warn('Invalid metadata URI')
      return DEFAULT_METADATA
    }

    // Log the hash and URL for debugging
    console.log('Clean hash:', hash)
    const url = `${PINATA_GATEWAY}/${hash}`
    console.log('Fetching from URL:', url)

    try {
      const response = await axios({
        method: 'get',
        url: url,
        headers: {
          'Accept': '*/*'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      })

      if (response.status === 200 && response.data) {
        // Transform image URLs to use Pinata gateway
        const transformedData = {
          ...response.data,
          image: response.data.image ? getIPFSUrl(response.data.image) : '',
          name: response.data.name || DEFAULT_METADATA.name,
          description: response.data.description || DEFAULT_METADATA.description,
          strategy: response.data.strategy || DEFAULT_METADATA.strategy,
          socialLinks: response.data.socialLinks || DEFAULT_METADATA.socialLinks,
          performanceMetrics: response.data.performanceMetrics || DEFAULT_METADATA.performanceMetrics,
          updatedAt: response.data.updatedAt || Date.now()
        }

        return transformedData
      } else {
        console.warn(`Failed to fetch metadata: ${response.status}`)
        return DEFAULT_METADATA
      }
    } catch (fetchError) {
      console.error('Error fetching from Pinata:', fetchError)
      return DEFAULT_METADATA
    }
  } catch (error) {
    console.error('Error in getFundMetadata:', error)
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