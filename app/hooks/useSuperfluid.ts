import { useCallback, useState, useEffect } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { SUPERFLUID_ADDRESSES, CFAv1ForwarderABI, ERC20ABI } from '@/app/config/superfluid'
import { formatEther, parseEther, getAddress } from 'viem'

interface Stream {
  receiver: string
  flowRate: string
  token: string
  timestamp: string
}

export function useSuperfluid() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [activeStreams, setActiveStreams] = useState<Stream[]>([])
  const [usdcxBalance, setUsdcxBalance] = useState('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (!walletClient?.account) {
        setLoading(false)
        return
      }

      try {
        await Promise.all([
          fetchBalance(),
          fetchFlowInfo()
        ])
      } catch (err) {
        console.error('Failed to initialize:', err)
        if (mounted) {
          setError('Failed to load data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [walletClient?.account])

  const fetchBalance = async () => {
    if (!walletClient?.account) return

    try {
      setLoading(true)
      setError(null)
      
      const userAddress = getAddress(walletClient.account.address)
      const usdcxAddress = getAddress(SUPERFLUID_ADDRESSES.USDCx)

      // First get decimals
      const decimals = await publicClient.readContract({
        address: usdcxAddress,
        abi: ERC20ABI,
        functionName: 'decimals'
      }).catch(() => 18) // Default to 18 decimals if call fails

      // Then get balance
      const balance = await publicClient.readContract({
        address: usdcxAddress,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [userAddress]
      }).catch(() => 0n) // Default to 0 if call fails
      
      // Format based on decimals
      const formattedBalance = Number(balance) / Math.pow(10, decimals)
      setUsdcxBalance(formattedBalance.toString())
    } catch (error) {
      console.error('Error fetching USDCx balance:', error)
      setError('Failed to fetch balance')
      setUsdcxBalance('0')
    } finally {
      setLoading(false)
    }
  }

  const fetchFlowInfo = async () => {
    if (!walletClient?.account) return

    try {
      const userAddress = getAddress(walletClient.account.address)
      const forwarderAddress = getAddress(SUPERFLUID_ADDRESSES.CFAv1Forwarder)
      const usdcxAddress = getAddress(SUPERFLUID_ADDRESSES.USDCx)

      // Get flow info for the user's own stream
      const flowInfo = await publicClient.readContract({
        address: forwarderAddress,
        abi: CFAv1ForwarderABI,
        functionName: 'getFlow',
        args: [
          usdcxAddress,
          userAddress,
          userAddress // For now, checking self-streams
        ]
      }).catch(() => null)

      if (flowInfo && flowInfo.flowrate > 0n) {
        setActiveStreams([{
          receiver: userAddress,
          flowRate: flowInfo.flowrate.toString(),
          token: usdcxAddress,
          timestamp: flowInfo.lastUpdated.toString()
        }])
      } else {
        setActiveStreams([])
      }
    } catch (error) {
      console.error('Error fetching flow info:', error)
      setActiveStreams([])
    }
  }

  const createStream = useCallback(async ({
    receiver,
    flowRate
  }: {
    receiver: string
    flowRate: string
  }) => {
    if (!walletClient) throw new Error('Wallet not connected')

    try {
      const userAddress = getAddress(walletClient.account.address)
      const forwarderAddress = getAddress(SUPERFLUID_ADDRESSES.CFAv1Forwarder)
      const usdcxAddress = getAddress(SUPERFLUID_ADDRESSES.USDCx)
      const receiverAddress = getAddress(receiver)

      const { request } = await publicClient.simulateContract({
        address: forwarderAddress,
        abi: CFAv1ForwarderABI,
        functionName: 'createFlow',
        args: [
          usdcxAddress,
          userAddress,
          receiverAddress,
          BigInt(flowRate),
          '0x'
        ],
        account: userAddress
      })

      const hash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash })

      await Promise.all([fetchBalance(), fetchFlowInfo()])
    } catch (error) {
      console.error('Error creating stream:', error)
      throw error
    }
  }, [publicClient, walletClient, fetchBalance, fetchFlowInfo])

  const deleteStream = useCallback(async (receiver: string) => {
    if (!walletClient) throw new Error('Wallet not connected')

    try {
      const userAddress = getAddress(walletClient.account.address)
      const forwarderAddress = getAddress(SUPERFLUID_ADDRESSES.CFAv1Forwarder)
      const usdcxAddress = getAddress(SUPERFLUID_ADDRESSES.USDCx)
      const receiverAddress = getAddress(receiver)

      const { request } = await publicClient.simulateContract({
        address: forwarderAddress,
        abi: CFAv1ForwarderABI,
        functionName: 'createFlow', // Set flowRate to 0 to delete
        args: [
          usdcxAddress,
          userAddress,
          receiverAddress,
          0n,
          '0x'
        ],
        account: userAddress
      })

      const hash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash })

      setActiveStreams(prev => prev.filter(stream => stream.receiver !== receiverAddress))
      await Promise.all([fetchBalance(), fetchFlowInfo()])
    } catch (error) {
      console.error('Error deleting stream:', error)
      throw error
    }
  }, [publicClient, walletClient, fetchBalance, fetchFlowInfo])

  return {
    createStream,
    deleteStream,
    activeStreams,
    usdcxBalance,
    loading,
    error,
    retry: useCallback(async () => {
      await Promise.all([fetchBalance(), fetchFlowInfo()])
    }, [fetchBalance, fetchFlowInfo])
  }
} 