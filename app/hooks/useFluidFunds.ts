import { useCallback, useState } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { FLUID_FUNDS_ABI, FLUID_FUNDS_ADDRESS } from '@/app/config/contracts'
import { parseEther, getAddress } from 'viem'
import { getFundMetadata } from '@/app/services/ipfs'
import type { FundMetadata } from '@/app/types/fund'
import { 
  getFundMetadataUri, 
  setFundMetadataUri 
} from '@/app/utils/fundMetadataMap'

// Helper function for default metadata
const getDefaultMetadata = (fundAddress?: string): FundMetadata => ({
  name: fundAddress ? `Fund ${fundAddress.slice(0, 6)}...${fundAddress.slice(-4)}` : 'Untitled Fund',
  description: 'Fund details loading...',
  image: '',
  manager: fundAddress || '',
  strategy: '',
  socialLinks: {},
  performanceMetrics: {
    tvl: '0',
    returns: '0',
    investors: 0
  },
  updatedAt: Date.now()
})

export function useFluidFunds() {
  const [loading, setLoading] = useState(false)
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // Check if address is a fund
  const checkIsFund = useCallback(async (address: string) => {
    try {
      return await publicClient.readContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'isFund',
        args: [getAddress(address)]
      })
    } catch (error) {
      console.error('Error checking fund status:', error)
      return false
    }
  }, [publicClient])

  // Check if token is whitelisted
  const checkIsTokenWhitelisted = useCallback(async (tokenAddress: string) => {
    try {
      return await publicClient.readContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'isTokenWhitelisted',
        args: [getAddress(tokenAddress)]
      })
    } catch (error) {
      console.error('Error checking token whitelist:', error)
      return false
    }
  }, [publicClient])

  // Set token whitelist status
  const setTokenWhitelisted = useCallback(async (tokenAddress: string, status: boolean) => {
    if (!walletClient) throw new Error('Wallet not connected')

    try {
      const { request } = await publicClient.simulateContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'setTokenWhitelisted',
        args: [getAddress(tokenAddress), status],
        account: walletClient.account
      })

      const hash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash })

      return true
    } catch (error) {
      console.error('Error setting token whitelist:', error)
      throw error
    }
  }, [publicClient, walletClient])

  // Get USDCx address
  const getUSDCxAddress = useCallback(async () => {
    try {
      return await publicClient.readContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'usdcx'
      })
    } catch (error) {
      console.error('Error getting USDCx address:', error)
      throw error
    }
  }, [publicClient])

  const createFund = useCallback(async ({
    name,
    profitSharingPercentage,
    subscriptionEndTime,
    minInvestmentAmount
  }: {
    name: string
    profitSharingPercentage: number
    subscriptionEndTime: number
    minInvestmentAmount: string
  }) => {
    if (!walletClient) throw new Error('Wallet not connected')

    try {
      // Validate inputs
      if (name.length === 0) throw new Error('Fund name cannot be empty')
      if (profitSharingPercentage <= 0 || profitSharingPercentage > 100) {
        throw new Error('Profit sharing percentage must be between 0 and 100')
      }
      if (subscriptionEndTime <= Math.floor(Date.now() / 1000)) {
        throw new Error('Subscription end time must be in the future')
      }
      if (parseFloat(minInvestmentAmount) <= 0) {
        throw new Error('Minimum investment amount must be greater than 0')
      }

      // Convert values to correct format for contract
      const params = {
        name: name.trim(),
        profitSharingPercentage: BigInt(Math.floor(profitSharingPercentage * 100)), // Convert to basis points
        subscriptionEndTime: BigInt(subscriptionEndTime),
        minInvestmentAmount: parseEther(minInvestmentAmount)
      }

      console.log('Contract call params:', {
        name: params.name,
        profitSharingPercentage: Number(params.profitSharingPercentage),
        subscriptionEndTime: Number(params.subscriptionEndTime),
        minInvestmentAmount: params.minInvestmentAmount.toString(),
        currentTime: Math.floor(Date.now() / 1000)
      })

      // Simulate the transaction first
      const { request } = await publicClient.simulateContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'createFund',
        args: [
          params.name,                    // string name
          params.profitSharingPercentage, // uint256 profitSharingPercentage
          params.subscriptionEndTime,     // uint256 subscriptionEndTime
          params.minInvestmentAmount      // uint256 minInvestmentAmount
        ],
        account: walletClient.account
      })

      console.log('Contract request:', request)
      const tx = await walletClient.writeContract(request)
      console.log('Transaction hash:', tx)
      return tx
    } catch (error) {
      console.error('Error creating fund:', error)
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (errorMessage.includes('profit sharing')) {
          throw new Error('Invalid profit sharing percentage (must be between 0-100%)')
        }
        if (errorMessage.includes('subscription')) {
          throw new Error('Invalid subscription end time (must be in the future)')
        }
        if (errorMessage.includes('investment')) {
          throw new Error('Invalid minimum investment amount')
        }
        if (errorMessage.includes('revert')) {
          throw new Error('Transaction reverted. Please check your input values.')
        }
      }
      throw error
    }
  }, [publicClient, walletClient])

  // Add function to get fund address from transaction receipt
  const getFundAddressFromReceipt = useCallback(async (hash: `0x${string}`) => {
    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Transaction receipt:', receipt)

      // Log all events for debugging
      receipt.logs.forEach((log: Log, index) => {
        console.log(`Log ${index}:`, {
          address: log.address,
          topics: log.topics,
          data: log.data
        })
      })

      // Generate event signature hash
      const FundCreatedEventSignature = 'FundCreated(address,address,string)'
      const eventTopic = keccak256(toHex(FundCreatedEventSignature))
      console.log('Looking for event with topic:', eventTopic)

      const event = receipt.logs.find(log => {
        // Match the event by first topic (event signature)
        return log.topics[0] === eventTopic
      })

      if (!event) {
        console.error('Fund creation event not found in logs:', receipt.logs)
        
        // Try to get the fund address from the return data
        try {
          const returnData = receipt.logs[0].topics[1] // Often the created contract address is in the first log
          if (returnData) {
            const fundAddress = `0x${returnData.slice(26)}`
            console.log('Found potential fund address from return data:', fundAddress)
            return fundAddress
          }
        } catch (error) {
          console.error('Error extracting address from return data:', error)
        }
        
        throw new Error('Fund creation event not found')
      }

      // Decode the event data
      try {
        const decoded = decodeEventLog({
          abi: FLUID_FUNDS_ABI,
          data: event.data,
          topics: event.topics as any,
        })
        console.log('Decoded FundCreated event:', decoded)

        // The fund address should be the first indexed parameter
        const fundAddress = decoded.args.fundAddress
        if (!fundAddress) throw new Error('Fund address not found in event')

        return fundAddress as string
      } catch (error) {
        console.error('Error decoding event:', error)
        
        // Fallback: try to get the address from the topics
        const fundAddress = `0x${event.topics[1].slice(26)}`
        console.log('Using fallback fund address from topics:', fundAddress)
        return fundAddress
      }
    } catch (error) {
      console.error('Error getting fund address from receipt:', error)
      throw error
    }
  }, [publicClient])

  const getAllFunds = useCallback(async () => {
    try {
      // Get all funds by iterating through indices until we get an error
      const funds = []
      let index = 0
      
      while (true) {
        try {
          const fund = await publicClient.readContract({
            address: FLUID_FUNDS_ADDRESS,
            abi: FLUID_FUNDS_ABI,
            functionName: 'allFunds',
            args: [BigInt(index)]
          })
          if (fund === '0x0000000000000000000000000000000000000000') break
          funds.push(fund)
          index++
        } catch (error) {
          break
        }
      }
      
      // Return funds in reverse order (newest first)
      return funds.reverse()
    } catch (error) {
      console.error('Error getting funds:', error)
      return []
    }
  }, [publicClient])

  const getAllFundsWithMetadata = useCallback(async () => {
    try {
      const fundsList = await getAllFunds()
      console.log('Found funds:', fundsList)

      const fundsWithMetadata = await Promise.all(
        fundsList.map(async (fundAddress) => {
          try {
            const isVerified = await checkIsFund(fundAddress)
            console.log(`Fund ${fundAddress} verified:`, isVerified)
            if (!isVerified) return null

            let metadata: FundMetadata
            try {
              // Get metadata URI without requiring wallet connection
              const metadataUri = getFundMetadataUri(fundAddress)
              console.log(`Fund ${fundAddress} metadata URI:`, metadataUri)
              
              if (metadataUri) {
                // Fetch metadata from IPFS
                metadata = await getFundMetadata(metadataUri)
                console.log(`Fund ${fundAddress} metadata:`, metadata)
              } else {
                console.log(`No metadata URI found for fund ${fundAddress}`)
                metadata = getDefaultMetadata(fundAddress)
              }
            } catch (error) {
              console.error(`Error getting metadata for fund ${fundAddress}:`, error)
              metadata = getDefaultMetadata(fundAddress)
            }

            return {
              ...metadata,
              address: fundAddress,
              verified: isVerified,
              metadataUri: metadata.image || ''
            }
          } catch (error) {
            console.error(`Error processing fund ${fundAddress}:`, error)
            return null
          }
        })
      )

      const filteredFunds = fundsWithMetadata.filter((fund): fund is NonNullable<typeof fund> => fund !== null)
      console.log('Final filtered funds:', filteredFunds)

      return filteredFunds
    } catch (error) {
      console.error('Error getting funds with metadata:', error)
      return []
    }
  }, [getAllFunds, checkIsFund])

  const getAllWhitelistedTokens = useCallback(async () => {
    try {
      // Get whitelisted tokens from events or state
      const tokens = await publicClient.readContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'getWhitelistedTokens'
      })
      
      return tokens
    } catch (error) {
      console.error('Error getting whitelisted tokens:', error)
      return []
    }
  }, [publicClient])

  return {
    createFund,
    checkIsFund,
    loading,
    getAllFunds,
    getAllFundsWithMetadata,
    getAllWhitelistedTokens,
    setTokenWhitelisted,
    getUSDCxAddress,
    getFundAddressFromReceipt
  }
} 