// Store metadata with manager address for security
export interface StoredMetadata {
  uri: string
  manager: string
}

export const fundMetadataMap = new Map<string, StoredMetadata>()

const STORAGE_KEY = 'fluidFunds_metadata_base_sepolia' // Specific to Base Sepolia network

// Initialize function to be called on client side
export const initializeMetadataMap = () => {
  if (typeof window === 'undefined') return

  try {
    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    console.log('Initializing metadata map with stored data:', storedData)
    
    // Populate the Map with stored data
    Object.entries(storedData).forEach(([address, data]) => {
      fundMetadataMap.set(address.toLowerCase(), data as StoredMetadata)
    })
    
    return storedData
  } catch (error) {
    console.error('Error initializing metadata map:', error)
    return {}
  }
}

export const setFundMetadataUri = (
  fundAddress: string,
  uri: string,
  manager: string
) => {
  try {
    const key = fundAddress.toLowerCase()
    const data = { uri, manager }
    
    // Update in-memory map
    fundMetadataMap.set(key, data)
    
    // Update localStorage with correct storage key
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedData = stored ? JSON.parse(stored) : {}
    storedData[key] = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData))
    
    console.log('Metadata stored successfully:', {
      fundAddress: key,
      uri,
      manager,
      currentMap: Object.fromEntries(fundMetadataMap),
      localStorage: storedData
    })
  } catch (error) {
    console.error('Error storing fund metadata:', error)
  }
}

export const getFundMetadataFromStorage = (fundAddress: string): StoredMetadata | null => {
  if (typeof window === 'undefined') return null

  const key = fundAddress.toLowerCase()
  
  // Try memory map first
  const memoryData = fundMetadataMap.get(key)
  if (memoryData) return memoryData

  // Try localStorage with correct storage key
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const storedData = JSON.parse(stored)
    const metadata = storedData[key]
    
    if (metadata) {
      // Update memory map
      fundMetadataMap.set(key, metadata)
      return metadata
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error)
  }
  
  return null
}

export const getFundMetadataUri = (fundAddress: string, currentWallet?: string): string | undefined => {
  const metadata = getFundMetadataFromStorage(fundAddress)
  if (!metadata) return undefined

  if (!currentWallet || metadata.manager.toLowerCase() === currentWallet.toLowerCase()) {
    return metadata.uri
  }

  return undefined
}

export const checkFundOwnership = (fundAddress: string, walletAddress: string): boolean => {
  if (typeof window === 'undefined') return false

  const key = fundAddress.toLowerCase()
  const walletLower = walletAddress.toLowerCase()

  // Check in-memory map
  const stored = fundMetadataMap.get(key)
  if (stored && stored.manager.toLowerCase() === walletLower) {
    return true
  }

  // Check localStorage
  try {
    const storedData = JSON.parse(localStorage.getItem('fundMetadataMap') || '{}')
    const metadata = storedData[key]
    if (metadata && metadata.manager.toLowerCase() === walletLower) {
      return true
    }
  } catch (error) {
    console.error('Error checking fund ownership:', error)
  }

  return false
}

// Add a function to list all funds for a wallet
export const listFundsForWallet = (walletAddress: string): string[] => {
  if (typeof window === 'undefined') return []

  const walletLower = walletAddress.toLowerCase()
  const funds: string[] = []

  // Check in-memory map
  fundMetadataMap.forEach((value, key) => {
    if (value.manager.toLowerCase() === walletLower) {
      funds.push(key)
    }
  })

  // Check localStorage
  try {
    const storedData = JSON.parse(localStorage.getItem('fundMetadataMap') || '{}')
    Object.entries(storedData).forEach(([key, value]) => {
      if ((value as StoredMetadata).manager.toLowerCase() === walletLower && !funds.includes(key)) {
        funds.push(key)
      }
    })
  } catch (error) {
    console.error('Error listing funds for wallet:', error)
  }

  return funds
}

export const addExistingFundMetadata = (
  fundAddress: string, 
  metadata: StoredMetadata
) => {
  if (typeof window === 'undefined') return

  const key = fundAddress.toLowerCase()
  
  // Update both memory and localStorage
  fundMetadataMap.set(key, metadata)
  try {
    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    storedData[key] = metadata
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData))
    console.log('Added existing fund metadata:', {
      fundAddress: key,
      metadata
    })
  } catch (error) {
    console.error('Error adding existing fund:', error)
  }
} 