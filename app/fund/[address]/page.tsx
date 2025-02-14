'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, LineChart } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useStreamData } from '@/app/hooks/useStreamData'
import ParticleBackground from '@/app/components/ParticleBackground'
import { useContractRead } from 'wagmi'
import { formatEther } from 'viem'
import { FLUID_FUNDS_ABI } from '@/app/config/contracts'
import FlowingBalance from '@/app/components/FlowingBalance'

interface FundDetails {
  name: string
  manager: string
  profitSharingPercentage: number
  subscriptionEndTime: number
  minInvestmentAmount: bigint
}

interface FundData {
  name: string
  manager: `0x${string}`
  profitSharingPercentage: bigint
  subscriptionEndTime: bigint
  minInvestmentAmount: bigint
  isActive: boolean
}

// Trading View Chart Component
const TradingViewChart = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      "width": "100%",
      "height": "600",
      "symbol": "UNISWAP:ETHUSDT",
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "backgroundColor": "rgba(0, 0, 0, 0)",
      "gridColor": "rgba(255, 255, 255, 0.06)",
      "hide_top_toolbar": true,
      "hide_legend": true,
    })

    const container = document.getElementById('trading-chart')
    if (container) container.appendChild(script)

    return () => {
      if (container && script) container.removeChild(script)
    }
  }, [])

  return (
    <div id="trading-chart" className="w-full h-[600px] rounded-xl overflow-hidden bg-fluid-white/[0.02]" />
  )
}

export default function FundDetailPage() {
  const params = useParams()
  const fundAddress = params.address as `0x${string}`
  const streamData = useStreamData(fundAddress)
  const [fundDetails, setFundDetails] = useState<FundDetails | null>(null)

  // Get the fund index first
  const { data: fundIndex } = useContractRead({
    address: fundAddress,
    abi: FLUID_FUNDS_ABI,
    functionName: 'isFund',
    args: [fundAddress],
    query: {
      enabled: Boolean(fundAddress)
    }
  })

  // Then read fund details using the index
  const { data: fundData } = useContractRead({
    address: fundAddress,
    abi: FLUID_FUNDS_ABI,
    functionName: 'allFunds',
    args: [BigInt(0)], // Use index instead of address
    query: {
      enabled: Boolean(fundAddress) && fundIndex !== undefined
    }
  }) as { data: FundData | undefined }

  useEffect(() => {
    if (fundData && fundIndex) {
      setFundDetails({
        name: fundData.name || 'Unknown Fund',
        manager: fundData.manager,
        profitSharingPercentage: Number(fundData.profitSharingPercentage),
        subscriptionEndTime: Number(fundData.subscriptionEndTime),
        minInvestmentAmount: fundData.minInvestmentAmount
      })
    }
  }, [fundData, fundIndex])

  return (
    <>
      <ParticleBackground />
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href="/funds"
              className="inline-flex items-center gap-2 text-fluid-white-70 hover:text-fluid-white 
                       transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Funds</span>
            </Link>
          </motion.div>

          {/* Fund Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-fluid-white mb-4">
              {fundDetails?.name || 'Loading...'}
            </h1>
            <div className="flex items-center gap-4 text-fluid-white-70">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span>Managed by {fundDetails?.manager?.slice(0, 6)}...{fundDetails?.manager?.slice(-4)}</span>
              </div>
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4" />
                <span>+24.5% Past Month</span>
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Chart Section */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-fluid-white/[0.02] backdrop-blur-lg rounded-xl border border-fluid-white/[0.03] p-6"
              >
                <h2 className="text-xl font-bold text-fluid-white mb-6">Performance Chart</h2>
                <TradingViewChart />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-fluid-white/[0.02] backdrop-blur-lg rounded-xl border border-fluid-white/[0.03] p-6"
              >
                <h2 className="text-xl font-bold text-fluid-white mb-6">Trading Activity</h2>
                <div className="space-y-4">
                  {/* Trading activity will be implemented here */}
                  <div className="text-fluid-white-70 text-center py-8">
                    Trading activity will be shown here
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stats & Info Section */}
            <div className="space-y-8">
              {/* Fund Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-fluid-white/[0.02] backdrop-blur-lg rounded-xl border border-fluid-white/[0.03] p-6"
              >
                <h2 className="text-xl font-bold text-fluid-white mb-6">Fund Stats</h2>
                <div className="space-y-6">
                  <div>
                    <p className="text-fluid-white-70 mb-1">Total Investment Flow</p>
                    <FlowingBalance
                      startingBalance={BigInt(0)}
                      startingBalanceDate={new Date(Number(streamData.updatedAtTimestamp) * 1000)}
                      flowRate={BigInt(streamData.currentFlowRate)}
                      className="text-2xl font-bold text-fluid-primary"
                    />
                  </div>
                  <div>
                    <p className="text-fluid-white-70 mb-1">Performance Fee</p>
                    <p className="text-2xl font-bold text-fluid-white">
                      {fundDetails?.profitSharingPercentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-fluid-white-70 mb-1">Minimum Investment</p>
                    <p className="text-2xl font-bold text-fluid-white">
                      {fundDetails ? formatEther(fundDetails.minInvestmentAmount) : '0'} USDC
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Subscription Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-fluid-white/[0.02] backdrop-blur-lg rounded-xl border border-fluid-white/[0.03] p-6"
              >
                <h2 className="text-xl font-bold text-fluid-white mb-6">Subscription Status</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-fluid-white-70 mb-1">End Date</p>
                    <p className="text-xl font-bold text-fluid-white">
                      {fundDetails 
                        ? new Date(fundDetails.subscriptionEndTime * 1000).toLocaleDateString() 
                        : 'Loading...'}
                    </p>
                  </div>
                  {fundDetails && fundDetails.subscriptionEndTime * 1000 > Date.now() && (
                    <Link
                      href={`/invest/${fundAddress}`}
                      className="block w-full py-3 px-4 rounded-xl bg-fluid-primary text-white font-medium 
                               hover:bg-fluid-primary/90 transition-all duration-200 text-center"
                    >
                      Invest Now
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}