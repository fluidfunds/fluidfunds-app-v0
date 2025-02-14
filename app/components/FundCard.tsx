import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatEther } from 'viem'
import { useState } from 'react'
import { useSuperfluid } from '@/app/hooks/useSuperfluid'
import { toast } from 'sonner'
import FlowingBalance from './FlowingBalance'
import { useStreamData } from '../hooks/useStreamData'
import { useAccount } from 'wagmi'
import { TrendingUp, Trophy, Clock, DollarSign } from 'lucide-react' // Add icons

// Update FundInfo interface with proper types
interface FundInfo {
  address: `0x${string}` // Make address hex string
  name: string
  manager: `0x${string}` // Make manager hex string
  createdAt: number
  blockNumber: number
  profitSharingPercentage: number
  subscriptionEndTime: number
  minInvestmentAmount: bigint // Change to bigint for wei values
  formattedDate: string
  profitSharingFormatted: string
  minInvestmentFormatted: string
}

interface FundCardProps {
  fund: FundInfo
}

const FundCard = ({ fund }: FundCardProps) => {
  const [streamAmount, setStreamAmount] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const { createStream } = useSuperfluid()
  const { address: userAddress } = useAccount();
  const streamData = useStreamData(
    userAddress as `0x${string}`, 
    fund.address
  );

  // Format the subscription end time
  const subscriptionEndDate = new Date(fund.subscriptionEndTime * 1000).toLocaleDateString()
  const isSubscriptionOpen = fund.subscriptionEndTime > Date.now() / 1000

  // Update formatting function to handle bigint
  const formatInvestmentAmount = (amount: bigint) => {
    try {
      // Convert from wei to ETH (amount is already bigint)
      const inEth = formatEther(amount)
      
      // Format the number
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(Number(inEth))

      return `${formatted} USDC`
    } catch (error) {
      console.error('Error formatting investment amount:', error)
      return `${amount.toString()} wei`
    }
  }

  const handleCreateStream = async () => {
    if (!streamAmount) {
      toast.error('Please enter a stream amount')
      return
    }

    setIsStreaming(true)
    try {
      const hash = await createStream(fund.address, streamAmount)
      console.log('Stream created with hash:', hash)
      toast.success('Stream created successfully!')
      setStreamAmount('') // Clear input after success
    } catch (error) {
      console.error('Error creating stream:', error)
      toast.error('Failed to create stream. Please ensure you have enough USDCx balance.')
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800
                border border-white/[0.08] hover:border-fluid-primary/30 
                transition-all duration-300 shadow-xl hover:shadow-fluid-primary/20"
    >
      {/* Performance Badge */}
      <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
        +24.5% Past Month
      </div>

      <div className="p-8">
        {/* Trader Profile Section */}
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-fluid-primary to-blue-600 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-2xl font-bold text-white group-hover:text-fluid-primary transition-colors">
              {fund.name}
            </h3>
            <p className="text-white/60 font-medium">
              Pro Trader since {new Date(fund.createdAt * 1000).getFullYear()}
            </p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center text-white/70 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Min Investment
            </div>
            <div className="text-xl font-bold text-white">
              {formatInvestmentAmount(fund.minInvestmentAmount)}
            </div>
          </div>
          
          <div className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center text-white/70 mb-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              Profit Share
            </div>
            <div className="text-xl font-bold text-white">
              {fund.profitSharingFormatted}
            </div>
          </div>
        </div>

        {/* Current Investment Status */}
        {streamData.isActive && (
          <div className="mb-6 bg-fluid-primary/10 rounded-2xl p-4">
            <div className="text-fluid-primary font-medium mb-2">Your Current Investment</div>
            <FlowingBalance
              startingBalance={BigInt(0)}
              startingBalanceDate={new Date(streamData.timestamp * 1000)}
              flowRate={streamData.flowRate}
              className="text-2xl font-bold text-fluid-primary"
            />
          </div>
        )}

        {/* Investment Form */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <DollarSign className="w-5 h-5 text-white/40" />
            </div>
            <input
              type="number"
              placeholder="Monthly Investment Amount"
              value={streamAmount}
              onChange={(e) => setStreamAmount(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.05] border border-white/[0.08]
                       text-white placeholder-white/40 focus:border-fluid-primary focus:ring-1 focus:ring-fluid-primary
                       transition-all duration-200"
            />
          </div>

          <button
            onClick={handleCreateStream}
            disabled={isStreaming}
            className="w-full py-4 rounded-xl bg-fluid-primary text-white font-bold text-lg
                     hover:bg-fluid-primary/90 transition-colors disabled:opacity-50
                     shadow-lg shadow-fluid-primary/20"
          >
            {isStreaming ? 'Setting up your investment...' : 'Start Investing Now'}
          </button>

          <Link
            href={`/fund/${fund.address}`}
            className="block w-full text-center py-3 text-white/70 hover:text-fluid-primary
                     font-medium transition-colors"
          >
            View Detailed Performance →
          </Link>
        </div>

        {/* Subscription Timer */}
        {isSubscriptionOpen && (
          <div className="mt-6 flex items-center justify-center text-sm text-white/60">
            <Clock className="w-4 h-4 mr-2" />
            Limited time offer - Ends {subscriptionEndDate}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default FundCard