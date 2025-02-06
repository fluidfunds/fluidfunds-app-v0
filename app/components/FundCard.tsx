import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatEther } from 'viem'
import { useState } from 'react'
import { useSuperfluid } from '@/app/hooks/useSuperfluid'
import { toast } from 'sonner'

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
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.05] 
                backdrop-blur-sm border border-white/[0.05] hover:border-fluid-primary/30 
                transition-all duration-300 shadow-lg hover:shadow-fluid-primary/5"
    >
      {/* Content Container */}
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1 text-white group-hover:text-fluid-primary transition-colors">
              {fund.name}
            </h3>
            <p className="text-sm text-white/60 font-mono">
              {fund.address.slice(0, 6)}...{fund.address.slice(-4)}
            </p>
          </div>
        </div>

        {/* Fund Details */}
        <div className="space-y-3 mb-6">
          {/* Manager Info */}
          <div className="flex items-center text-sm">
            <span className="text-white/50">Manager:</span>
            <span className="ml-2 text-white font-medium">
              {fund.manager.slice(0, 6)}...{fund.manager.slice(-4)}
            </span>
          </div>

          {/* Profit Sharing */}
          <div className="flex items-center text-sm">
            <span className="text-white/50">Profit Sharing:</span>
            <span className="ml-2 text-white font-medium">
              {fund.profitSharingFormatted}
            </span>
          </div>

          {/* Minimum Investment - Updated */}
          <div className="flex items-center text-sm">
            <span className="text-white/50">Min Investment:</span>
            <span className="ml-2 text-white font-medium">
              {formatInvestmentAmount(fund.minInvestmentAmount)}
            </span>
          </div>

          {/* Subscription Status */}
          <div className="flex items-center text-sm">
            <span className="text-white/50">Subscription:</span>
            <span className={`ml-2 font-medium ${isSubscriptionOpen ? 'text-green-400' : 'text-red-400'}`}>
              {isSubscriptionOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          {/* Subscription End Date */}
          <div className="flex items-center text-sm">
            <span className="text-white/50">Ends:</span>
            <span className="ml-2 text-white font-medium">
              {subscriptionEndDate}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <div className="flex-1 flex gap-2">
            <input
              type="number"
              placeholder="Monthly USDC"
              value={streamAmount}
              onChange={(e) => setStreamAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
            />
            <button
              onClick={handleCreateStream}
              disabled={isStreaming}
              className="px-4 py-2 rounded-lg bg-fluid-primary text-white font-medium
                       hover:bg-fluid-primary/90 transition-colors disabled:opacity-50"
            >
              {isStreaming ? 'Creating...' : 'Stream'}
            </button>
          </div>
          <Link
            href={`/fund/${fund.address}`}
            className="px-4 py-2 rounded-lg bg-white/[0.05] text-white font-medium
                     hover:bg-white/[0.08] transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default FundCard 