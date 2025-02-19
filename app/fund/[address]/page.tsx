'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, LineChart } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useStreamData } from '@/app/hooks/useStreamData'
import ParticleBackground from '@/app/components/ParticleBackground'
import { useContractRead } from 'wagmi'
import { formatEther } from 'viem'
import { FLUID_FUNDS_ABI } from '@/app/config/contracts'
import FlowingBalance from '@/app/components/FlowingBalance'
import { useSuperfluid } from '@/app/hooks/useSuperfluid'
import { toast } from 'sonner'

// Add interface for stream data
interface StreamData {
  currentFlowRate: string
  updatedAtTimestamp: string
  // ... other stream properties
}

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
    script.type = 'text/javascript'
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

    let chartContainer: HTMLElement | null = null

    // Create a reference to use in cleanup
    const scriptElement = script

    const initChart = () => {
      chartContainer = document.getElementById('trading-chart')
      if (chartContainer) {
        chartContainer.appendChild(scriptElement)
      }
    }

    initChart()

    // Cleanup function
    return () => {
      try {
        if (chartContainer && scriptElement && scriptElement.parentNode === chartContainer) {
          chartContainer.removeChild(scriptElement)
        }
      } catch (error) {
        console.warn('TradingView chart cleanup:', error)
      }
    }
  }, [])

  return (
    <div id="trading-chart" className="w-full h-[600px] rounded-xl overflow-hidden bg-fluid-white/[0.02]" />
  )
}

export default function FundDetailPage() {
  // Use the useParams hook instead of props
  const params = useParams()
  const fundAddress = (params?.address as string) as `0x${string}`
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [streamData, setStreamData] = useState<StreamData>({
    currentFlowRate: '0',
    updatedAtTimestamp: (Date.now() / 1000).toString(),
  })
  const [fundDetails, setFundDetails] = useState<FundDetails | null>(null)
  const [streamAmount, setStreamAmount] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const { createStream } = useSuperfluid(fundAddress)

  const handleCreateStream = async () => {
    if (!streamAmount) {
      toast.error('Please enter a stream amount')
      return
    }

    setIsStreaming(true)
    try {
      const hash = await createStream(fundAddress, streamAmount)
      console.log('Stream created with hash:', hash)
      toast.success('Stream created successfully!')
      setStreamAmount('')
    } catch (error) {
      console.error('Error creating stream:', error)
      toast.error('Failed to create stream. Please ensure you have enough USDCx balance.')
    } finally {
      setIsStreaming(false)
    }
  }

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

  // Use optional chaining and nullish coalescing for safe access
  const flowRate = streamData?.currentFlowRate ?? '0'
  const timestamp = streamData?.updatedAtTimestamp ?? (Date.now() / 1000).toString()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <ParticleBackground />
      
      {/* Hero Section with Key Metrics */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white 
                     transition-colors group mb-8"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Funds</span>
          </Link>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Fund Info */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                {fundDetails?.name || 'Loading...'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/70 mb-6">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                  <Wallet className="w-4 h-4" />
                  <span>By {fundDetails?.manager?.slice(0, 6)}...{fundDetails?.manager?.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full">
                  <LineChart className="w-4 h-4" />
                  <span>+24.5% Past Month</span>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/[0.03] rounded-xl p-4 backdrop-blur-sm border border-white/[0.08]">
                  <p className="text-white/60 text-sm mb-1">AUM</p>
                  <p className="text-2xl font-bold text-white">$1.2M</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4 backdrop-blur-sm border border-white/[0.08]">
                  <p className="text-white/60 text-sm mb-1">Performance Fee</p>
                  <p className="text-2xl font-bold text-white">{fundDetails?.profitSharingPercentage}%</p>
                </div>
              </div>

              {/* Investment Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] rounded-xl p-6 backdrop-blur-sm border border-white/[0.08]"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Start Investing</h3>
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span>Open for Investment</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="streamAmount" className="block text-sm text-white/60 mb-2">
                      Monthly Investment Amount
                    </label>
                    <div className="relative">
                      <input
                        id="streamAmount"
                        type="number"
                        value={streamAmount}
                        onChange={(e) => setStreamAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full h-12 px-4 rounded-lg bg-black/20 border border-white/10 
                                text-white placeholder-white/40 focus:outline-none focus:border-fluid-primary
                                transition-colors"
                        min="0"
                        step="0.01"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                        USDC/month
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/40">
                      Min. investment: {fundDetails ? formatEther(fundDetails.minInvestmentAmount) : '0'} USDC
                    </p>
                  </div>

                  <button
                    onClick={handleCreateStream}
                    disabled={isStreaming || !streamAmount}
                    className="w-full h-12 rounded-lg bg-fluid-primary text-white font-semibold
                            hover:bg-fluid-primary/90 transition-all duration-200 disabled:opacity-50
                            disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isStreaming ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                        />
                        <span>Processing...</span>
                      </>
                    ) : (
                      'Invest Now'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Chart Section */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Performance History</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-full text-sm bg-white/5 text-white/60 hover:text-white transition-colors">
                    1M
                  </button>
                  <button className="px-3 py-1.5 rounded-full text-sm bg-fluid-primary text-white">
                    3M
                  </button>
                  <button className="px-3 py-1.5 rounded-full text-sm bg-white/5 text-white/60 hover:text-white transition-colors">
                    1Y
                  </button>
                </div>
              </div>
              <TradingViewChart />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Fund Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Fund Stats */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Fund Statistics</h3>
            <div className="space-y-4">
              <div className="bg-white/[0.02] rounded-xl p-4 backdrop-blur-sm border border-white/[0.08]">
                <p className="text-white/60 text-sm mb-1">Total Investment Flow</p>
                <FlowingBalance
                  startingBalance={BigInt(0)}
                  startingBalanceDate={new Date(Number(timestamp) * 1000)}
                  flowRate={BigInt(flowRate)}
                  className="text-xl font-bold text-white"
                  formatValue={(value) => {
                    const formatted = Number(value) / (10 ** 18)
                    return formatted.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4
                    }) + ' USDC'
                  }}
                />
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4 backdrop-blur-sm border border-white/[0.08]">
                <p className="text-white/60 text-sm mb-1">Active Investors</p>
                <p className="text-xl font-bold text-white">127</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4 backdrop-blur-sm border border-white/[0.08]">
                <p className="text-white/60 text-sm mb-1">Investment Window</p>
                <p className="text-xl font-bold text-white">
                  {fundDetails 
                    ? new Date(fundDetails.subscriptionEndTime * 1000).toLocaleDateString() 
                    : 'Loading...'}
                </p>
              </div>
            </div>
          </div>

          {/* Trading Activity */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Trading Activity</h3>
            <div className="bg-white/[0.02] rounded-xl backdrop-blur-sm border border-white/[0.08] p-6">
              <div className="space-y-4">
                {/* Placeholder for trading activity - Replace with actual data */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-fluid-primary/10 flex items-center justify-center">
                        <LineChart className="w-5 h-5 text-fluid-primary" />
                      </div>
                      <div>
                        <p className="text-white font-medium">ETH/USDC Long</p>
                        <p className="text-sm text-white/60">2 hours ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-medium">+2.4%</p>
                      <p className="text-sm text-white/60">$25,000</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}