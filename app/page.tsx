'use client'
import Image from "next/image";
import { motion } from 'framer-motion'
import Header from './components/Header'
import FAQ from './components/FAQ'
import Benefits from './components/Benefits'
import ProcessSteps from './components/ProcessSteps'
import ParticleBackground from '@/app/components/ParticleBackground'
import HeroCarousel from './components/HeroCarousel'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { baseSepolia } from 'viem/chains'
import { FLUID_FUNDS_ADDRESS, FLUID_FUNDS_ABI } from '@/app/config/contracts'
import { getFundMetadata, getIPFSUrl } from '@/app/services/ipfs'
import { 
  getFundMetadataFromStorage, 
  fundMetadataMap,
  initializeMetadataMap,
  StoredMetadata
} from '@/app/utils/fundMetadataMap'
import { isValidAlchemyKey } from '@/app/utils/validation'

interface FundInfo {
  address: `0x${string}`
  verified: boolean
  metadataUri: string
  name: string
  description: string
  image: string
  manager: string
  strategy: string
  socialLinks: {
    twitter?: string
    discord?: string
    telegram?: string
  }
  performanceMetrics: {
    tvl: string
    returns: string
    investors: number
  }
  updatedAt: number
  blockNumber: number
}

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY

// First, add a helper function to validate image URLs
const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false
  return url.startsWith('http') || url.startsWith('ipfs://')
}

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
      if (!ALCHEMY_API_KEY) {
        console.error('Alchemy API key not found or invalid:', ALCHEMY_API_KEY)
        setLoading(false)
        return
      }

      if (!isValidAlchemyKey(ALCHEMY_API_KEY)) {
        console.error('Invalid Alchemy API key configuration')
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

        // Process all funds
        const fundsData = await Promise.all(
          sortedEvents.map(async (event) => {
            try {
              const { fundAddress, manager } = {
                fundAddress: event.args.fundAddress as `0x${string}`,
                manager: event.args.manager as string
              }
              
              console.log(`Processing fund: ${fundAddress}`)

              // First try to get stored metadata
              const storedMetadata = getFundMetadataFromStorage(fundAddress)
              if (storedMetadata) {
                console.log(`Found stored metadata for ${fundAddress}`)
                try {
                  const metadata = await getFundMetadata(storedMetadata.uri)
                  // Only return if there's a valid image
                  if (isValidImageUrl(metadata.image)) {
                    return {
                      address: fundAddress,
                      verified: true,
                      metadataUri: storedMetadata.uri,
                      ...metadata,
                      manager,
                      blockNumber: Number(event.blockNumber)
                    }
                  }
                } catch (error) {
                  console.warn(`Failed to fetch stored metadata for ${fundAddress}:`, error)
                }
              }

              // If no stored metadata, try contract metadata
              try {
                const metadataUri = await publicClient.readContract({
                  address: FLUID_FUNDS_ADDRESS,
                  abi: FLUID_FUNDS_ABI,
                  functionName: 'getFundMetadataUri',
                  args: [fundAddress]
                })

                if (metadataUri) {
                  console.log(`Got contract metadata URI for ${fundAddress}: ${metadataUri}`)
                  try {
                    const metadata = await getFundMetadata(metadataUri)
                    // Only return if there's a valid image
                    if (isValidImageUrl(metadata.image)) {
                      return {
                        address: fundAddress,
                        verified: true,
                        metadataUri,
                        ...metadata,
                        manager,
                        blockNumber: Number(event.blockNumber)
                      }
                    }
                  } catch (error) {
                    console.warn(`Failed to fetch contract metadata for ${fundAddress}:`, error)
                  }
                }
              } catch (error) {
                console.warn(`No metadata URI in contract for ${fundAddress}:`, error)
              }

              // Skip funds without valid images
              return null

            } catch (error) {
              console.error('Error processing fund:', error)
              return null
            }
          })
        )

        // Filter out null values and update state
        const validFunds = fundsData.filter((fund): fund is FundInfo => 
          fund !== null && 
          typeof fund.image === 'string' && 
          isValidImageUrl(fund.image)
        )
        console.log(`Setting ${validFunds.length} valid funds with images`)
        setTrendingFunds(validFunds)
        setLoading(false)

      } catch (error) {
        console.error('Error in fetchFunds:', error)
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
                  Stream USDC to Your Favorite Fund
                </h2>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                  Discover and invest in verified hedge funds managed by experienced professionals
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
                  {trendingFunds.map((fund, index) => (
                    <motion.div
                      key={fund.address}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.05] 
                               backdrop-blur-sm border border-white/[0.05] hover:border-fluid-primary/30 
                               transition-all duration-300 shadow-lg hover:shadow-fluid-primary/5"
                    >
                      {/* Fund Image with Overlay */}
                      {fund.image && (
                        <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl">
                          <Image
                            src={getIPFSUrl(fund.image)}
                            alt={fund.name || 'Fund image'}
                            width={400}
                            height={225}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                      )}

                      {/* Content Container */}
                      <div className="p-6">
                        {/* Header with Verification Badge */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-1 text-white group-hover:text-fluid-primary transition-colors">
                              {fund.name}
                            </h3>
                            <p className="text-sm text-white/60 font-mono">
                              {fund.address.slice(0, 6)}...{fund.address.slice(-4)}
                            </p>
                          </div>
                          {fund.verified && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-fluid-primary/10 text-fluid-primary text-xs">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              Verified
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {fund.description && (
                          <p className="text-sm text-white/70 mb-6 line-clamp-2 min-h-[40px]">
                            {fund.description}
                          </p>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-black/20">
                          <div>
                            <p className="text-xs text-white/50 mb-1">TVL</p>
                            <p className="text-sm font-medium">${fund.performanceMetrics?.tvl || '0'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/50 mb-1">Returns</p>
                            <p className="text-sm font-medium">{fund.performanceMetrics?.returns || '0'}%</p>
                          </div>
                        </div>

                        {/* Manager Info */}
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-fluid-primary/10 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-white/50">Manager</p>
                            <p className="text-sm font-mono">{fund.manager?.slice(0, 6)}...{fund.manager?.slice(-4)}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Link
                            href="/connect"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-fluid-primary text-white text-center 
                                     font-medium hover:bg-fluid-primary/90 transition-all duration-300 
                                     transform hover:-translate-y-0.5"
                          >
                            Stream USDC
                          </Link>
                          <Link
                            href={`/fund/${fund.address}`}
                            className="px-4 py-2.5 rounded-xl bg-white/[0.05] text-white font-medium 
                                     hover:bg-white/[0.08] transition-all duration-300 
                                     transform hover:-translate-y-0.5"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </motion.div>
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