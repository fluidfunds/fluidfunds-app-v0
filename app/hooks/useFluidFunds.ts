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

  const setTokenWhitelisted = useCallback(async (
    tokenAddress: `0x${string}`, 
    status: boolean
  ): Promise<boolean> => {
    console.log('Token whitelist functionality temporarily disabled', { tokenAddress, status })
    return false
  }, [])

  const isOwner = useCallback(async (address?: string): Promise<boolean> => {
    if (!publicClient || !address) return false

    try {
      const owner = await publicClient.readContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'owner'
      })
      
      return owner.toLowerCase() === address.toLowerCase()
    } catch (error) {
      console.error('Error checking ownership:', error)
      return false
    }
  }, [publicClient])

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

  const getAllWhitelistedTokens = useCallback(async (): Promise<`0x${string}`[]> => {
    if (!publicClient) return []

    try {
      const tokens = await publicClient.readContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'getWhitelistedTokens'
      }) as `0x${string}`[]

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
    isOwner
  }
}