'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSuperfluid } from '@/app/hooks/useSuperfluid'
import { toast } from 'sonner'
import { formatEther } from 'viem'

interface Fund {
  address: `0x${string}`
  name: string
  manager: `0x${string}`
  minInvestmentAmount: bigint
  profitSharingFormatted: string
}

interface CreateStreamModalProps {
  isOpen: boolean
  onClose: () => void
  funds: Fund[]
}

export function CreateStreamModal({ isOpen, onClose, funds }: CreateStreamModalProps) {
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null)
  const [streamAmount, setStreamAmount] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const { createStream } = useSuperfluid()

  // Add debug logging
  console.log('Available funds:', funds)

  const handleCreateStream = async () => {
    if (!selectedFund) {
      toast.error('Please select a fund')
      return
    }

    if (!streamAmount) {
      toast.error('Please enter a stream amount')
      return
    }

    // Check if amount meets minimum investment
    const monthlyAmount = parseFloat(streamAmount)
    if (monthlyAmount < Number(formatEther(selectedFund.minInvestmentAmount))) {
      toast.error(`Minimum investment is ${formatEther(selectedFund.minInvestmentAmount)} USDC`)
      return
    }

    setIsStreaming(true)
    try {
      const hash = await createStream(selectedFund.address, streamAmount)
      console.log('Stream created with hash:', hash)
      toast.success('Stream created successfully!')
      setStreamAmount('')
      setSelectedFund(null)
      onClose()
    } catch (error) {
      console.error('Error creating stream:', error)
      toast.error('Failed to create stream. Please ensure you have enough USDCx balance.')
    } finally {
      setIsStreaming(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg p-6 rounded-xl bg-[#0A0A0A] border border-white/[0.08]"
      >
        <h2 className="text-xl font-medium mb-6">Create New Stream</h2>
        
        {/* Fund Selection */}
        <div className="mb-6">
          <label className="block text-sm text-white/60 mb-2">
            Select Fund ({funds.length} available)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {funds.length > 0 ? (
              funds.map((fund) => (
                <div
                  key={fund.address}
                  onClick={() => setSelectedFund(fund)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedFund?.address === fund.address
                      ? 'bg-fluid-primary/20 border-fluid-primary'
                      : 'bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08]'
                  } border`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{fund.name}</div>
                      <div className="text-sm text-white/60">
                        {fund.address.slice(0, 6)}...{fund.address.slice(-4)}
                      </div>
                    </div>
                    <div className="text-sm text-white/60">
                      Min: {formatEther(fund.minInvestmentAmount)} USDC
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-white/60 py-4">
                No funds available
              </div>
            )}
          </div>
        </div>

        {/* Stream Amount Input */}
        <div className="mb-6">
          <label className="block text-sm text-white/60 mb-2">Monthly Stream Amount (USDC)</label>
          <input
            type="number"
            value={streamAmount}
            onChange={(e) => setStreamAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/[0.08]
                     focus:border-fluid-primary transition-colors"
          />
          {selectedFund && (
            <div className="mt-2 text-sm text-white/60">
              Minimum investment: {formatEther(selectedFund.minInvestmentAmount)} USDC
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateStream}
            disabled={isStreaming || !selectedFund || !streamAmount}
            className="flex-1 px-4 py-3 rounded-lg bg-fluid-primary text-white font-medium
                     hover:bg-fluid-primary/90 transition-colors disabled:opacity-50"
          >
            {isStreaming ? 'Creating Stream...' : 'Create Stream'}
          </button>
        </div>
      </motion.div>
    </div>
  )
} 