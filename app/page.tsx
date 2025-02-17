'use client'
import { motion } from 'framer-motion'
import Header from './components/Header'
import FAQ from './components/FAQ'
import Benefits from './components/Benefits'
import ProcessSteps from './components/ProcessSteps'
import ParticleBackground from '@/app/components/ParticleBackground'
import HeroCarousel from './components/HeroCarousel'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  createPublicClient, 
  http, 
  parseAbiItem, 
  decodeFunctionData,
  formatEther 
} from 'viem'
import { baseSepolia } from 'viem/chains'
import { FLUID_FUNDS_ADDRESS } from '@/app/config/contracts'
import { 
  fundMetadataMap,
  initializeMetadataMap,
  type StoredMetadata
} from '@/app/utils/fundMetadataMap'
import { isValidAlchemyKey } from '@/app/utils/validation'
import FundCard from '@/app/components/FundCard'

// Update FundInfo interface to include all required properties
interface FundInfo {
  address: `0x${string}`
  verified?: boolean
  metadataUri?: string
  name: string
  description?: string
  image?: string
  manager: `0x${string}`
  strategy?: string
  socialLinks?: {
    twitter?: string
    discord?: string
    telegram?: string
  }
  performanceMetrics?: {
    tvl: string
    returns: string
    investors: number
  }
  updatedAt?: number
  blockNumber: number
  createdAt: number // Add this required field
  profitSharingPercentage: number
  subscriptionEndTime: number
  minInvestmentAmount: bigint
  formattedDate: string
  profitSharingFormatted: string
  minInvestmentFormatted: string // Add this required field
}

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY

export default function Home() {
  const [trendingFunds, setTrendingFunds] = useState<FundInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [metadataInitialized, setMetadataInitialized] = useState(false)

  // Initialize metadata map
  useEffect(() => {
    const init = async () => {
      try {
        const storedData = initializeMetadataMap()
        if (storedData) {
          Object.entries(storedData).forEach(([key, value]) => {
            fundMetadataMap.set(key.toLowerCase(), value as StoredMetadata)
          })
        }
        setMetadataInitialized(true)
      } catch (error) {
        console.error('Error initializing metadata:', error)
        setMetadataInitialized(true) // Still set to true to allow app to function
      }
    }

    init()
  }, [])

  useEffect(() => {
    const fetchFunds = async () => {
      console.log('Environment check:', {
        isDevelopment: process.env.NODE_ENV === 'development',
        hasAlchemyKey: !!ALCHEMY_API_KEY,
        keyPrefix: ALCHEMY_API_KEY?.substring(0, 6),
        contractAddress: FLUID_FUNDS_ADDRESS
      })

      if (!ALCHEMY_API_KEY) {
        console.error('Alchemy API key not found. Please check your .env.local file')
        setLoading(false)
        return
      }

      if (!isValidAlchemyKey(ALCHEMY_API_KEY)) {
        console.error('Invalid Alchemy API key format:', 
          ALCHEMY_API_KEY.substring(0, 6) + '...'
        )
        setLoading(false)
        return
      }

      if (!metadataInitialized) {
        console.log('Metadata not initialized yet')
        return
      }

      try {
        setLoading(true)
        
        console.log('Starting funds fetch with API key:', 
          ALCHEMY_API_KEY.substring(0, 6) + '...'
        )

        const rpcUrl = `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        console.log('Using RPC URL:', rpcUrl.replace(ALCHEMY_API_KEY, '[HIDDEN]'))

        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(rpcUrl)
        })

        // Test the connection first
        try {
          await publicClient.getBlockNumber()
          console.log('Successfully connected to Base Sepolia')
        } catch (error) {
          console.error('Failed to connect to Base Sepolia:', error)
          throw new Error('RPC connection failed')
        }

        // Add this check before processing funds
        try {
          const code = await publicClient.getBytecode({
            address: FLUID_FUNDS_ADDRESS
          })
          
          if (!code || code === '0x') {
            console.error('No contract deployed at address:', FLUID_FUNDS_ADDRESS)
            return
          }
          
          console.log('Contract verified at address:', FLUID_FUNDS_ADDRESS)
        } catch (error) {
          console.error('Error verifying contract:', error)
          return
        }

        console.log('Fetching fund creation events...')
        
        const fundCreationEvents = await publicClient.getLogs({
          address: FLUID_FUNDS_ADDRESS,
          event: parseAbiItem('event FundCreated(address indexed fundAddress, address indexed manager, string name)'),
          fromBlock: BigInt(0)
        })

        console.log(`Found ${fundCreationEvents.length} fund creation events`)

        // Sort by block number (most recent first)
        const sortedEvents = [...fundCreationEvents].sort((a, b) => 
          Number(b.blockNumber) - Number(a.blockNumber)
        )

        // Inside the fetchFunds function
        const getFundDetailsFromEvent = async (event: typeof fundCreationEvents[0]) => {
          try {
            // Ensure the args exist and are properly typed
            if (!event.args?.fundAddress || !event.args?.manager) {
              throw new Error('Missing event arguments')
            }

            const fundAddress = event.args.fundAddress
            const manager = event.args.manager
            const name = event.args.name || ''

            // Get the block to find creation time
            const block = await publicClient.getBlock({
              blockNumber: event.blockNumber
            })

            return {
              address: fundAddress,
              manager: manager,
              name: name,
              createdAt: Number(block.timestamp),
              blockNumber: Number(event.blockNumber)
            }
          } catch (error) {
            console.error('Error getting event details:', error)
            return null
          }
        }

        const getFundCreationParams = async (event: typeof fundCreationEvents[0]) => {
          try {
            // Add type check at the start
            if (!event.args?.fundAddress || !event.args?.manager) {
              throw new Error('Missing event arguments')
            }

            // Get the transaction that created the fund
            const tx = await publicClient.getTransaction({
              hash: event.transactionHash
            })

            // Decode using the full function definition
            const createFundAbi = {
              name: 'createFund',
              inputs: [
                { name: 'name', type: 'string' },
                { name: 'profitSharingPercentage', type: 'uint256' },
                { name: 'subscriptionEndTime', type: 'uint256' },
                { name: 'minInvestmentAmount', type: 'uint256' }
              ],
              outputs: [{ type: 'address' }],
              stateMutability: 'nonpayable',
              type: 'function'
            } as const // Add const assertion

            // Decode the full function call with proper typing
            const decoded = decodeFunctionData({
              abi: [createFundAbi],
              data: tx.input
            })

            // Add type checking and assertions
            if (!decoded.args || decoded.args.length < 4) {
              throw new Error('Failed to decode function arguments')
            }

            // Type assertions for the decoded arguments
            const [name, profitShare, endTime, minAmount] = decoded.args as [string, bigint, bigint, bigint]

            const params = {
              name,
              profitSharingPercentage: Number(profitShare),
              subscriptionEndTime: Number(endTime),
              minInvestmentAmount: Number(minAmount),
              minInvestmentFormatted: `${new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }).format(Number(formatEther(BigInt(minAmount))))} USDC`
            }

            console.log('Parsed parameters:', params)
            return params

          } catch (error) {
            console.error('Error decoding fund creation params:', {
              error,
              transactionHash: event.transactionHash
            })
            return null
          }
        }

        // Combine both approaches
        const fundsWithDetails = await Promise.all(
          sortedEvents.map(async (event) => {
            const fundAddress = event.args?.fundAddress
            if (!fundAddress) return null
            
            console.log(`\nProcessing fund: ${fundAddress}`)
            
            // Get basic details from event
            const eventDetails = await getFundDetailsFromEvent(event)
            if (!eventDetails) {
              console.log(`Could not get event details for fund ${fundAddress}`)
              return null
            }
            
            // Get creation parameters from transaction
            const creationParams = await getFundCreationParams(event)
            if (!creationParams) {
              console.log(`Could not get creation params for fund ${fundAddress}`)
              return null // Change to return null instead of eventDetails
            }
            
            const fundDetails = {
              ...eventDetails,
              ...creationParams,
              minInvestmentAmount: BigInt(creationParams.minInvestmentAmount),
              formattedDate: new Date(eventDetails.createdAt * 1000).toLocaleDateString(),
              profitSharingFormatted: `${(creationParams.profitSharingPercentage / 100).toFixed(2)}%`,
              // Add required fields
              createdAt: eventDetails.createdAt,
              minInvestmentFormatted: `${new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }).format(Number(formatEther(BigInt(creationParams.minInvestmentAmount))))} USDC`,
              profitSharingPercentage: creationParams.profitSharingPercentage,
              subscriptionEndTime: creationParams.subscriptionEndTime
            } as FundInfo

            return fundDetails
          })
        )

        // Filter out null values and update state
        const validFunds = fundsWithDetails.filter((fund): fund is FundInfo => fund !== null)
        console.log(`Found ${validFunds.length} valid funds`)

        setTrendingFunds(validFunds)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching funds:', error)
        setLoading(false)
      }
    }

    if (metadataInitialized) {
      fetchFunds()
    }
  }, [metadataInitialized])

  return (
    <div className="relative min-h-screen bg-fluid-bg text-fluid-white overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Purple Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at top, rgba(55, 0, 110, 0.15), transparent 70%)',
          mixBlendMode: 'screen'
        }}
      />

      <Header />
      
      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-[180px] pb-[100px]">
        <div className="flex flex-col items-center gap-[35px] w-full max-w-7xl">
          {/* Title Section */}
          <div id="features" className="flex flex-col items-center gap-6 w-full max-w-[840px] mx-auto">
            <div className="overflow-hidden w-full">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1 
                }}
                className="text-center"
              >
                <h1 className="text-[56px] leading-[1.2] tracking-[-0.02em] font-medium mb-0 text-[rgb(37,202,172)]">
                  <span className="inline">Are You Tired of </span>
                  <span className="inline">Rug-Pulls?</span>
                </h1>
              </motion.div>
            </div>

            <div className="overflow-hidden w-full">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.2 
                }}
                className="text-center"
              >
                <h2 className="text-[56px] leading-[1] tracking-[-0.02em] font-medium text-[rgb(37,202,172)]">
                  Trade with Confidence.
                </h2>
              </motion.div>
            </div>

            <div className="overflow-hidden max-w-[620px]">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.3 
                }}
                className="text-center"
              >
                <motion.p 
                  className="text-[20px] leading-[1.4] text-[rgba(255,255,255,0.7)] px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  A safe platform for fund owners and managers to trade whitelisted tokens 
                  with high market caps, ensuring security and transparency in every transaction.
                </motion.p>
              </motion.div>
            </div>

            {/* Hero Carousel */}
            <div className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.4 
                }}
              >
                <HeroCarousel />
              </motion.div>
            </div>
          </div>

          {/* Process Section */}
          <div id="process" className="w-full">
            <ProcessSteps />
          </div>

          {/* Start a Hedge Fund Button */}
          <motion.div 
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2 
            }}
          >
            <Link
              href="/connect"
              className="h-12 px-8 rounded-xl bg-fluid-primary text-fluid-white 
                       font-medium inline-flex items-center justify-center hover:bg-fluid-primary/90 
                       transition-colors duration-200"
            >
              Start a Hedge Fund
            </Link>
          </motion.div>

          {/* Unified Funds Section */}
          <motion.div
            id="funds"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="w-full py-20"
          >
            <div className="max-w-[1200px] mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-[40px] font-medium mb-4 bg-gradient-to-r from-fluid-primary to-purple-500 bg-clip-text text-transparent">
                  Smart Investing Made Simple
                </h2>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                  Get professional-grade returns with automated investment strategies. Start with as little as 100 USDC.
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-fluid-primary/20 border-t-fluid-primary animate-spin" />
                    <div className="mt-4 text-fluid-primary/80">Loading funds...</div>
                  </div>
                </div>
              ) : trendingFunds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {trendingFunds.map((fund) => (
                    <FundCard key={fund.address} fund={fund} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/70">No funds found.</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <div id="benefits" className="mt-32">
          <Benefits />
        </div>

        {/* FAQ Section */}
        <div id="faq" className="mt-32">
          <FAQ />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-fluid-white-10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <span className="text-fluid-primary font-medium">FluidFunds</span>
          <a
            href="https://x.com/fluidfunds"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fluid-white-70 hover:text-fluid-white transition-colors"
          >
            Follow us on X
          </a>
        </div>
      </footer>
    </div>
  )
}