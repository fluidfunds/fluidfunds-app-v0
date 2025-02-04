import { useCallback, useState } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { FLUID_FUNDS_ABI, FLUID_FUNDS_ADDRESS } from '@/app/config/contracts'
import { parseEther, getAddress, type PublicClient } from 'viem'
import { getFundMetadata } from '@/app/services/ipfs'
import type { FundMetadata } from '@/app/types/fund'

interface CreateFundParams {
  name: string
  profitSharingPercentage: number
  subscriptionEndTime: number
  minInvestmentAmount: string
}

interface FundWithMetadata {
  address: string
  verified: boolean
  metadataUri: string
  metadata: FundMetadata
}

export function useFluidFunds() {
  const [loading] = useState(false)
  const { data: walletClient } = useWalletClient()
  const client = usePublicClient()
  const publicClient = client as PublicClient

  const checkIsFund = useCallback(async (address: string): Promise<boolean> => {
    if (!publicClient || !address) return false

    try {
      const result = await publicClient.readContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'isFund',
        args: [getAddress(address)]
      })
      return Boolean(result)
    } catch (error) {
      console.error('Error checking fund status:', error)
      return false
    }
  }, [publicClient])

  // Set token whitelist status
  const setTokenWhitelisted = useCallback(async (tokenAddress: string, status: boolean): Promise<boolean> => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected')

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
  const getUSDCxAddress = useCallback(async (): Promise<`0x${string}`> => {
    if (!publicClient) throw new Error('Public client not initialized')

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

  // Check if address is owner
  const isOwner = useCallback(async (fundAddress: string): Promise<boolean> => {
    if (!walletClient?.account || !publicClient) return false
    
    try {
      const owner = await publicClient.readContract({
        address: getAddress(fundAddress),
        abi: FLUID_FUNDS_ABI,
        functionName: 'owner'
      })
      
      return owner.toLowerCase() === walletClient.account.address.toLowerCase()
    } catch (error) {
      console.error('Error checking ownership:', error)
      return false
    }
  }, [publicClient, walletClient?.account])

  const createFund = useCallback(async ({
    name,
    profitSharingPercentage,
    subscriptionEndTime,
    minInvestmentAmount
  }: CreateFundParams): Promise<`0x${string}`> => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected')

    try {
      const params = {
        name: name.trim(),
        profitSharingPercentage: BigInt(Math.floor(profitSharingPercentage * 100)),
        subscriptionEndTime: BigInt(subscriptionEndTime),
        minInvestmentAmount: parseEther(minInvestmentAmount)
      }

      const { request } = await publicClient.simulateContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'createFund',
        args: [
          params.name,
          params.profitSharingPercentage,
          params.subscriptionEndTime,
          params.minInvestmentAmount
        ],
        account: walletClient.account
      })

      return await walletClient.writeContract(request)
    } catch (error) {
      console.error('Error creating fund:', error)
      throw error
    }
  }, [publicClient, walletClient])

  // Get fund address from transaction receipt
  const getFundAddressFromReceipt = useCallback(async (hash: `0x${string}`): Promise<string> => {
    if (!publicClient) throw new Error('Public client not initialized')

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const event = receipt.logs[0] // Assuming FundCreated is first event
      if (!event) throw new Error('No event found in transaction')
      return event.address
    } catch (error) {
      console.error('Error getting fund address from receipt:', error)
      throw error
    }
  }, [publicClient])

  const getAllWhitelistedTokens = useCallback(async (): Promise<readonly `0x${string}`[]> => {
    if (!publicClient) return []

    try {
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

  const getAllFundsWithMetadata = useCallback(async (): Promise<FundWithMetadata[]> => {
    if (!publicClient) return []

    try {
      const fundsCount = await publicClient.readContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'getFundsCount'
      })

      const fundAddresses = await Promise.all(
        Array.from({ length: Number(fundsCount) }, (_, i) => 
          publicClient.readContract({
            address: FLUID_FUNDS_ADDRESS,
            abi: FLUID_FUNDS_ABI,
            functionName: 'funds',
            args: [BigInt(i)]
          })
        )
      )

      const fundsWithMetadata = await Promise.all(
        fundAddresses.map(async (address) => {
          const verified = await checkIsFund(address)
          const metadataUri = await publicClient.readContract({
            address: FLUID_FUNDS_ADDRESS,
            abi: FLUID_FUNDS_ABI,
            functionName: 'getFundMetadataUri',
            args: [address]
          }) as string

          let metadata: FundMetadata
          try {
            metadata = await getFundMetadata(metadataUri)
          } catch (error) {
            console.error('Error fetching metadata:', error)
            metadata = {
              name: `Fund ${address.slice(0, 6)}...${address.slice(-4)}`,
              description: 'Fund details temporarily unavailable',
              image: '',
              manager: address,
              strategy: '',
              socialLinks: {},
              performanceMetrics: {
                tvl: '0',
                returns: '0',
                investors: 0
              },
              updatedAt: Date.now()
            }
          }

          return {
            address,
            verified,
            metadataUri,
            metadata
          }
        })
      )

      return fundsWithMetadata
    } catch (error) {
      console.error('Error getting all funds with metadata:', error)
      return []
    }
  }, [publicClient, checkIsFund])

  return {
    createFund,
    checkIsFund,
    loading,
    getAllFundsWithMetadata,
    getAllWhitelistedTokens,
    setTokenWhitelisted,
    getUSDCxAddress,
    getFundAddressFromReceipt,
    isOwner
  }
}