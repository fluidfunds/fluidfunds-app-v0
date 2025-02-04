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
    console.log('Loading stored metadata:', storedData)
    return storedData
  } catch (error) {
    console.error('Error loading initial metadata:', error)
    return {}
  }
}

export const setFundMetadataUri = (fundAddress: string, uri: string, manager: string) => {
  if (typeof window === 'undefined') return

  const key = fundAddress.toLowerCase()
  const data = { uri, manager: manager.toLowerCase() }
  
  fundMetadataMap.set(key, data)
  
  try {
    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    storedData[key] = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData))
  } catch (error) {
    console.error('Error saving metadata:', error)
  }
}

export const getFundMetadataUri = (fundAddress: string, currentWallet?: string): string | undefined => {
  if (typeof window === 'undefined') return undefined // Skip if running on server

  const key = fundAddress.toLowerCase()
  console.log('Getting metadata for:', { fundAddress: key, currentWallet })
  
  // Try memory map first
  const stored = fundMetadataMap.get(key)
  console.log('Found in memory:', stored)
  
  if (stored) {
    // For debugging
    if (currentWallet) {
      console.log('Comparing wallet addresses:', {
        storedManager: stored.manager.toLowerCase(),
        currentWallet: currentWallet.toLowerCase(),
        matches: stored.manager.toLowerCase() === currentWallet.toLowerCase()
      })
    }

    if (!currentWallet || stored.manager.toLowerCase() === currentWallet.toLowerCase()) {
      return stored.uri
    }
  }

  // Try localStorage as fallback
  try {
    const storedData = JSON.parse(localStorage.getItem('fundMetadataMap') || '{}')
    console.log('Found in localStorage:', storedData)
    const metadata = storedData[key]
    if (metadata) {
      // For debugging
      if (currentWallet) {
        console.log('Comparing wallet addresses from localStorage:', {
          storedManager: metadata.manager.toLowerCase(),
          currentWallet: currentWallet.toLowerCase(),
          matches: metadata.manager.toLowerCase() === currentWallet.toLowerCase()
        })
      }

      if (!currentWallet || metadata.manager.toLowerCase() === currentWallet.toLowerCase()) {
        // Also update the in-memory map
        fundMetadataMap.set(key, metadata)
        return metadata.uri
      }
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error)
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
  metadataUri: string, 
  manager: string
) => {
  if (typeof window === 'undefined') return

  const key = fundAddress.toLowerCase()
  const data = { 
    uri: metadataUri,
    manager: manager.toLowerCase()
  }

  // Update both memory and localStorage
  fundMetadataMap.set(key, data)
  try {
    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    storedData[key] = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData))
    console.log('Added existing fund metadata:', {
      fundAddress: key,
      manager: data.manager,
      uri: data.uri
    })
  } catch (error) {
    console.error('Error adding existing fund:', error)
  }
}

export const getFundMetadataFromStorage = (fundAddress: string) => {
  try {
    // Get from map first
    const lowercaseAddress = fundAddress.toLowerCase()
    const metadata = fundMetadataMap.get(lowercaseAddress)
    if (metadata) {
      return metadata
    }

    // Try local storage as fallback
    const stored = localStorage.getItem('fundMetadata')
    if (stored) {
      const allMetadata = JSON.parse(stored)
      return allMetadata[lowercaseAddress]
    }

    return null
  } catch (error) {
    console.error('Error getting metadata from storage:', error)
    return null
  }
} 