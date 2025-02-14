import { useCallback, useState, useEffect } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { SUPERFLUID_ADDRESSES } from '@/app/config/contracts'
import { type PublicClient, formatEther } from 'viem'

// Update the SUPERFLUID_SUBGRAPH_URL constant

// Remove the unused constant
const CFAv1ForwarderAddress = '0xcfA132E353cB4E398080B9700609bb008eceB125'

const CFAv1ForwarderABI = [
  {
    name: "createFlow",
    inputs: [
      { name: "token", type: "address" },
      { name: "sender", type: "address" },
      { name: "receiver", type: "address" },
      { name: "flowRate", type: "int96" },
      { name: "userData", type: "bytes" }
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

// Add USDCx ABI for balance checking
const USDCxABI = [
  {
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "realtimeBalanceOf",
    inputs: [
      { name: "account", type: "address" },
      { name: "timestamp", type: "uint256" }
    ],
    outputs: [
      { name: "availableBalance", type: "int256" },
      { name: "deposit", type: "uint256" },
      { name: "owedDeposit", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const

// Add proper types for stream data
interface StreamData {
  sender: {
    id: string
  }
  receiver: {
    id: string
  }
  currentFlowRate: string
  token: {
    id: string
    symbol: string
  }
  streamedUntilUpdatedAt: string
  updatedAtTimestamp: string
}

// Add this interface near your other interfaces
interface IncomingFlow {
  sender: {
    id: string
  }
  currentFlowRate: string
  token: {
    id: string
    symbol: string
  }
  streamedUntilUpdatedAt: string
  updatedAtTimestamp: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface GraphQLResponse {
  data?: {
    streams: StreamData[]
  }
}

interface Stream {
  receiver: string
  flowRate: string
  token: string
  streamedUntilUpdatedAt?: string
  updatedAtTimestamp?: string
  monthlyFlow?: number
}

// Update the hook definition to accept fundAddress
export function useSuperfluid(fundAddress?: `0x${string}`) {
  const { data: walletClient } = useWalletClient()
  const client = usePublicClient()
  const publicClient = client as PublicClient
   
  const [activeStreams, setActiveStreams] = useState<Stream[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false)
  const [usdcxBalance, setUsdcxBalance] = useState('0')

  const calculateFlowRate = (monthlyAmount: number): string => {
    // Convert monthly amount to flow rate per second
    // monthlyAmount * 10^18 / (30 * 24 * 60 * 60)
    const monthlyAmountInWei = BigInt(Math.floor(monthlyAmount * 1e18))
    const secondsInMonth = BigInt(30 * 24 * 60 * 60)
    return (monthlyAmountInWei / secondsInMonth).toString()
  }

  // Add function to fetch USDCx balance
  const fetchUSDCxBalance = useCallback(async () => {
    if (!walletClient?.account || !publicClient) return

    try {
      const balance = await publicClient.readContract({
        address: SUPERFLUID_ADDRESSES.usdcx,
        abi: USDCxABI,
        functionName: 'realtimeBalanceOf',
        args: [walletClient.account.address, BigInt(Math.floor(Date.now() / 1000))]
      })

      // Convert balance to string with proper formatting
      const formattedBalance = formatEther(balance[0] >= 0 ? BigInt(balance[0]) : BigInt(0))
      setUsdcxBalance(formattedBalance)
    } catch (error) {
      console.error('Error fetching USDCx balance:', error)
    }
  }, [walletClient?.account, publicClient])

  // Update fetchActiveStreams to only run if fundAddress is provided
  const fetchActiveStreams = useCallback(async () => {
    if (!fundAddress) return

    try {
      const query = `
        query FlowingStreams($fund: String!) {
          account(id: $fund) {
            inflows {
              currentFlowRate
              token {
                id
                symbol
              }
              sender {
                id
              }
              streamedUntilUpdatedAt
              updatedAtTimestamp
            }
          }
        }
      `

      const response = await fetch('/api/superfluid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            fund: fundAddress.toLowerCase()
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        console.error('GraphQL Errors:', data.errors)
        return []
      }

      // Map inflows to our StreamData format
      const streams = data.data?.account?.inflows?.map((flow: IncomingFlow) => ({
        sender: flow.sender,
        receiver: { id: fundAddress.toLowerCase() },
        currentFlowRate: flow.currentFlowRate,
        token: flow.token,
        streamedUntilUpdatedAt: flow.streamedUntilUpdatedAt,
        updatedAtTimestamp: flow.updatedAtTimestamp
      })) || []

      setActiveStreams(streams)
      return streams
    } catch (error) {
      console.error('Error fetching stream data:', error)
      return []
    }
  }, [fundAddress])

  const createStream = useCallback(async (
    receiverAddress: `0x${string}`,
    monthlyAmount: string
  ): Promise<`0x${string}`> => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected')

    try {
      const flowRate = calculateFlowRate(parseFloat(monthlyAmount))
      console.log('Creating stream with params:', {
        token: SUPERFLUID_ADDRESSES.usdcx,
        sender: walletClient.account.address,
        receiver: receiverAddress,
        flowRate,
      })

      const { request } = await publicClient.simulateContract({
        address: CFAv1ForwarderAddress,
        abi: CFAv1ForwarderABI,
        functionName: 'createFlow',
        args: [
          SUPERFLUID_ADDRESSES.usdcx,
          walletClient.account.address,
          receiverAddress,
          BigInt(flowRate),
          '0x'
        ],
        account: walletClient.account
      })

      console.log('Simulated contract call:', request)
      const hash = await walletClient.writeContract(request)
      console.log('Stream creation transaction hash:', hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Stream creation receipt:', receipt)
      
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      console.log('Fetching streams after creation...')
      await fetchActiveStreams()
      console.log('Current active streams:', activeStreams)
      
      return hash
    } catch (error) {
      console.error('Error creating stream:', error)
      throw error
    }
  }, [publicClient, walletClient, fetchActiveStreams, activeStreams])

  const deleteStream = useCallback(async (receiverAddress: `0x${string}`): Promise<`0x${string}`> => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected')

    try {
      const flowRate = '0' // Setting flow rate to 0 deletes the stream
      
      const { request } = await publicClient.simulateContract({
        address: CFAv1ForwarderAddress,
        abi: CFAv1ForwarderABI,
        functionName: 'createFlow',
        args: [
          SUPERFLUID_ADDRESSES.usdcx,
          walletClient.account.address,
          receiverAddress,
          BigInt(flowRate),
          '0x'
        ],
        account: walletClient.account
      })

      const hash = await walletClient.writeContract(request)
      
      // Wait for transaction confirmation but don't store the receipt
      await publicClient.waitForTransactionReceipt({ hash })
      
      // Wait a bit before refreshing streams
      await new Promise(resolve => setTimeout(resolve, 5000))
      await fetchActiveStreams()
      
      return hash
    } catch (error) {
      console.error('Error deleting stream:', error)
      throw error
    }
  }, [publicClient, walletClient, fetchActiveStreams])

  // Update the polling effect to check for fundAddress
  useEffect(() => {
    if (walletClient?.account && fundAddress) {
      // Initial fetch
      fetchUSDCxBalance()
      fetchActiveStreams()

      // Update every 10 seconds instead of 30
      const interval = setInterval(() => {
        fetchUSDCxBalance()
        fetchActiveStreams()
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [walletClient?.account, fundAddress, fetchUSDCxBalance, fetchActiveStreams])

  return {
    createStream,
    deleteStream,
    activeStreams,
    loading,
    fetchActiveStreams,
    usdcxBalance,
    fetchUSDCxBalance
  }
}