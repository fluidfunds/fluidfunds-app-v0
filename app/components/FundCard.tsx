/* eslint-disable @typescript-eslint/no-unused-vars */
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
  pnl?: {
    percentage: number
    value: number
    isPositive: boolean
  }
}

interface FundCardProps {
  fund: FundInfo
}

const FundCard = ({ fund }: FundCardProps) => {
  const streamData = useStreamData(fund.address)

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

  // Add default PNL values
  const defaultPnl = {
    percentage: 0,
    value: 0,
    isPositive: true
  }

  // Use nullish coalescing to provide default values
  const pnl = fund.pnl ?? defaultPnl

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/95 to-gray-900 
                border border-white/[0.08] hover:border-fluid-primary/30 
                transition-all duration-300 shadow-xl hover:shadow-fluid-primary/20 min-h-[600px] w-full"
    >
      <div className="p-6 flex flex-col h-full"> {/* Reduced padding */}
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6"> {/* Changed to flex-col */}
          <div className="flex items-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fluid-primary to-fluid-primary/60 
                          flex items-center justify-center shadow-lg shadow-fluid-primary/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-xl font-bold text-white group-hover:text-fluid-primary transition-colors">
                {fund.name}
              </h3>
              <div className="flex items-center text-white/60 text-sm gap-2">
                <span>Pro Trader</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>Since {new Date(fund.createdAt * 1000).getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Performance Badge as separate row */}
          <div className="flex items-center gap-2 bg-green-500/10 text-green-400 
                       px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm 
                       border border-green-500/20 self-start">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            +24.5% Past Month
          </div>
        </div>

        {/* Metrics Grid - Reduced spacing */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/[0.03] rounded-xl p-5 backdrop-blur-sm border border-white/[0.05]
                        hover:border-fluid-primary/20 transition-colors group/card">
            <div className="flex items-center text-white/70 mb-3">
              <TrendingUp className="w-5 h-5 mr-2 text-fluid-primary group-hover/card:scale-110 transition-transform" />
              Current PNL
            </div>
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                <span className={`${pnl.isPositive ? "text-green-400" : "text-red-400"} flex items-center gap-1`}>
                  {pnl.isPositive ? "+" : "-"}{pnl.percentage.toFixed(2)}%
                  <span className="text-sm font-normal">30d</span>
                </span>
              </div>
              <div className="text-sm text-white/60 mt-1">
                {pnl.isPositive ? "+" : "-"}${Math.abs(pnl.value).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="bg-white/[0.03] rounded-xl p-5 backdrop-blur-sm border border-white/[0.05]
                        hover:border-fluid-primary/20 transition-colors group/card">
            <div className="flex items-center text-white/70 mb-3">
              <DollarSign className="w-5 h-5 mr-2 text-fluid-primary group-hover/card:scale-110 transition-transform" />
              Profit Share
            </div>
            <div className="text-2xl font-bold text-white">
              {fund.profitSharingFormatted}
            </div>
            <div className="text-sm text-white/60 mt-1">
              of total profits
            </div>
          </div>
        </div>

        {/* Active Streams Section - Adjusted spacing */}
        {streamData.activeStreams.length > 0 ? (
          <div className="flex-1 mb-4 bg-fluid-primary/5 rounded-xl p-3 backdrop-blur-sm 
                       border border-fluid-primary/20">
            <div className="flex justify-between items-center mb-3">
              <div className="text-fluid-primary font-medium text-sm">Active Investment Flows</div>
              <div className="text-xs bg-fluid-primary/10 px-2.5 py-1 rounded-full text-fluid-primary">
                {streamData.activeStreams.length} active {streamData.activeStreams.length === 1 ? 'stream' : 'streams'}
              </div>
            </div>

            <div className="space-y-3">
              {streamData.activeStreams.map(stream => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.08]"
                >
                  {/* Top Row: Token and Flow Rate */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-fluid-primary/10 flex-shrink-0 flex items-center justify-center 
                                  border border-fluid-primary/20">
                        <DollarSign className="w-5 h-5 text-fluid-primary" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {stream.token.symbol.replace('fUSDCx', 'USDCx')}
                        </div>
                        <div className="text-sm text-white/60 mt-0.5">
                          From: {stream.sender.id.slice(0, 6)}...{stream.sender.id.slice(-4)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-fluid-primary/80 font-medium">
                      {(Number(stream.currentFlowRate) / (10 ** Number(stream.token.decimals)) * 86400).toFixed(2)}/day
                    </div>
                  </div>

                  {/* Bottom Row: Flowing Balance */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-white/60">Current Stream</div>
                    <motion.div
                      animate={{ opacity: [0.5, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear"
                      }}
                      className="text-lg font-bold text-fluid-primary"
                    >
                      <FlowingBalance
                        startingBalance={BigInt(0)}
                        startingBalanceDate={new Date(Number(stream.updatedAtTimestamp) * 1000)}
                        flowRate={BigInt(stream.currentFlowRate)}
                        formatValue={(value) => {
                          const formatted = Number(value) / (10 ** Number(stream.token.decimals))
                          return formatted.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4
                          }) + ' USDCx'
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-0.5 bg-fluid-primary/5 rounded-full overflow-hidden mt-3">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-fluid-primary/30 to-fluid-primary/50"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear"
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 mb-4 bg-fluid-primary/5 rounded-2xl p-5 backdrop-blur-sm border border-fluid-primary/20">
            <div className="text-fluid-primary font-medium">No active investments</div>
          </div>
        )}

        {/* Actions Section */}
        <div className="mt-auto space-y-2">
          <Link
            href={`/fund/${fund.address}`}
            className="block w-full py-2.5 rounded-xl border border-fluid-primary/30 
                     text-center text-fluid-primary font-medium hover:bg-fluid-primary/10 
                     transition-all duration-300"
          >
            View Detailed Analytics
          </Link>
        </div>

        {/* Enhanced Subscription Timer */}
        {isSubscriptionOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60 
                     bg-white/[0.02] rounded-full px-4 py-2 border border-white/[0.05]"
          >
            <Clock className="w-4 h-4 text-fluid-primary" />
            Investment Window Closes: {subscriptionEndDate}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default FundCard