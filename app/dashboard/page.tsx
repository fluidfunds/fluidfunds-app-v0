/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Logo } from '@/app/components/icons/Logo'
import ParticleBackground from '@/app/components/ParticleBackground'
import { CreateFundModal } from '@/app/components/CreateFundModal'
import { useFluidFunds } from '@/app/hooks/useFluidFunds'
import { CreateStreamModal } from '@/app/components/CreateStreamModal'
import { useSuperfluid } from '@/app/hooks/useSuperfluid'
import { toast } from 'sonner'
import { formatEther, getAddress } from 'viem'
import { getFundMetadata, getIPFSUrl } from '@/app/services/ipfs'
import Image from 'next/image'
import { useRole } from '@/app/hooks/useRole'
import { TokenManagementModal } from '@/app/components/TokenManagementModal'
import { useWalletClient, useAccount } from 'wagmi'
import { 
  initializeMetadataMap, 
  type StoredMetadata,
  fundMetadataMap,
  getFundMetadataFromStorage
} from '@/app/utils/fundMetadataMap'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { baseSepolia } from 'viem/chains'
 
import { FLUID_FUNDS_ABI, FLUID_FUNDS_ADDRESS } from '@/app/config/contracts'

// Update FundInfo interface to match the actual data structure
interface FundInfo {
  address: string
  verified: boolean
  name: string
  manager: `0x${string}`
  description: string
  image: string | undefined
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
  metadataUri: string
}

// Define our gradient colors and styles
const gradientStyles = {
  background: {
    // Rich deep background gradient
    backgroundImage: 'linear-gradient(180deg, #0A0A0A 0%, #13111C 100%)'
  },
  overlay: {
    // Modern gradient overlay with multiple colors
    style: {
      background: `
        radial-gradient(circle at 0% 0%, rgba(37,202,172,0.08) 0%, transparent 50%),
        radial-gradient(circle at 100% 0%, rgba(89,9,121,0.08) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(37,202,172,0.05) 0%, transparent 50%),
        radial-gradient(circle at 0% 100%, rgba(89,9,121,0.05) 0%, transparent 50%),
        linear-gradient(180deg, rgba(37,202,172,0.02) 0%, rgba(89,9,121,0.02) 100%)
      `,
      mixBlendMode: 'screen' as const
    }
  },
  accent: {
    // Subtle accent lines
    style: {
      backgroundImage: `
        linear-gradient(45deg, rgba(37,202,172,0.03) 1px, transparent 1px),
        linear-gradient(-45deg, rgba(89,9,121,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '100px 100px',
      opacity: 0.5
    }
  }
}

// Add these helper functions back to the file, before the DashboardPage component
const isValidFundMetadata = (metadata: any): boolean => {
  return (
    metadata &&
    typeof metadata === 'object' &&
    typeof metadata.name === 'string' &&
    typeof metadata.description === 'string' &&
    typeof metadata.image === 'string' &&
    metadata.image.length > 0 && // Must have an image
    metadata.description.length > 0 // Must have a description
  )
}

const processManagerFundsData = (fundsData: any[]): FundInfo[] => {
  return fundsData
    .filter((fund): fund is NonNullable<typeof fund> => 
      fund !== null && 
      fund.name && 
      fund.description && 
      typeof fund.image !== 'undefined'
    )
    .map(fund => ({
      ...fund,
      image: fund.image || undefined,
      manager: fund.manager as `0x${string}`,
      metadataUri: fund.metadataUri || '',
      verified: Boolean(fund.verified),
      performanceMetrics: {
        tvl: fund.performanceMetrics?.tvl || '0',
        returns: fund.performanceMetrics?.returns || '0',
        investors: fund.performanceMetrics?.investors || 0
      }
    }))
}

// Also add back the FundVerification component
function FundVerification({ fund }: { fund: string }) {
  const { checkIsFund } = useFluidFunds()
  const [isVerified, setIsVerified] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    const verifyFund = async () => {
      if (!fund) {
        if (isMounted) setIsVerified(false)
        return
      }

      try {
        const result = await checkIsFund(fund)
        if (isMounted) {
          setIsVerified(result)
        }
      } catch (error) {
        if (isMounted) {
          console.error(`Error verifying fund ${fund}:`, error)
          setIsVerified(false)
        }
      }
    }

    verifyFund()

    return () => {
      isMounted = false
    }
  }, [fund, checkIsFund])

  if (isVerified === null) {
    return (
      <span className="text-white/60">
        Verifying...
      </span>
    )
  }

  return (
    <span className={isVerified ? 'text-green-500' : 'text-red-500'}>
      {isVerified ? 'Verified' : 'Not Verified'}
    </span>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { address: walletAddress } = useAccount()
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false)
  const [isTokenManagementOpen, setIsTokenManagementOpen] = useState(false)
  const [funds, setFunds] = useState<FundInfo[]>([])
  const [tokenAddress, setTokenAddress] = useState('')
  const [whitelistedTokens, setWhitelistedTokens] = useState<string[]>([])
  const [batchTokens, setBatchTokens] = useState<string>('')
  const [processingBatch, setProcessingBatch] = useState(false)
  const [isUserOwner, setIsUserOwner] = useState(false)
  const [allFunds, setAllFunds] = useState<FundInfo[]>([])
  const [metadataInitialized, setMetadataInitialized] = useState(false)
  const [isMetadataLoading, setIsMetadataLoading] = useState(true)
  
  const { getAllFundsWithMetadata, setTokenWhitelisted, isOwner, loading: fundsLoading, getAllWhitelistedTokens } = useFluidFunds()
  const { 
    activeStreams, 
    usdcxBalance, 
    createStream, 
    deleteStream,
    loading: superfluidLoading,
    fetchActiveStreams
  } = useSuperfluid()
  const role = useRole()
  const { data: walletClient } = useWalletClient()

  // Show different features based on role
  const showManagerFeatures = role === 'manager'
  const showInvestorFeatures = role === 'investor'

  // Add a ref to track initialization
  const initializationRef = useRef(false)

  // Move metadata initialization to useEffect
  useEffect(() => {
    const initMetadata = async () => {
      if (initializationRef.current) return
      
      setIsMetadataLoading(true)
      try {
        const storedData = initializeMetadataMap()
        if (storedData) {
          // Use setTimeout to avoid state updates during render
          setTimeout(() => {
            Object.entries(storedData).forEach(([key, value]) => {
              fundMetadataMap.set(key.toLowerCase(), value as StoredMetadata)
            })
            setMetadataInitialized(true)
            initializationRef.current = true
            setIsMetadataLoading(false)
          }, 0)
        }
      } catch (error) {
        console.error('Error initializing metadata:', error)
        setIsMetadataLoading(false)
      }
    }

    initMetadata()
  }, [])

  // Load funds only after metadata is initialized
  useEffect(() => {
    const fetchManagerFunds = async () => {
      if (!walletAddress || !metadataInitialized) {
        console.log('Skipping fund fetch - no wallet or metadata not initialized', {
          walletAddress,
          metadataInitialized
        })
        setFunds([])
        setLoading(false)
        return
      }

      setLoading(true)
      console.log('Fetching funds for manager:', walletAddress)

      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
        })

        // Get fund creation events
        const fundCreationEvents = await publicClient.getLogs({
          address: FLUID_FUNDS_ADDRESS,
          event: parseAbiItem('event FundCreated(address indexed fundAddress, address indexed manager, string name)'),
          args: {
            manager: walletAddress as `0x${string}`
          },
          fromBlock: 0n,
          toBlock: 'latest'
        })

        console.log('Found fund creation events:', {
          events: fundCreationEvents,
          count: fundCreationEvents.length
        })

        // Process each fund
        const managerFundsData = await Promise.all(
          fundCreationEvents.map(async (event) => {
            if (!event.args) {
              console.log('No args in event:', event)
              return null
            }

            const fundAddress = event.args.fundAddress as string
            const fundName = event.args.name as string

            console.log('Processing fund:', {
              address: fundAddress,
              name: fundName,
              event
            })

            // Get metadata from storage
            const storedMetadata = getFundMetadataFromStorage(fundAddress)
            console.log('Stored metadata for fund:', {
              fundAddress,
              metadata: storedMetadata
            })

            if (!storedMetadata?.uri) {
              console.log('No metadata URI found for fund:', fundAddress)
              return null
            }

            try {
              const ipfsMetadata = await getFundMetadata(storedMetadata.uri)
              console.log('IPFS metadata for fund:', {
                fundAddress,
                metadata: ipfsMetadata
              })
              
              return {
                address: fundAddress,
                verified: true,
                name: fundName,
                manager: walletAddress,
                description: ipfsMetadata.description || 'Fund details coming soon...',
                image: ipfsMetadata.image ? getIPFSUrl(ipfsMetadata.image) : undefined,
                strategy: ipfsMetadata.strategy || '',
                socialLinks: ipfsMetadata.socialLinks || {},
                performanceMetrics: ipfsMetadata.performanceMetrics || {
                  tvl: '0',
                  returns: '0',
                  investors: 0
                },
                updatedAt: ipfsMetadata.updatedAt || Date.now(),
                metadataUri: storedMetadata.uri
              }
            } catch (error) {
              console.error(`Failed to fetch metadata for fund ${fundAddress}:`, error)
              return null
            }
          })
        )

        const validFunds = processManagerFundsData(managerFundsData)
        console.log('Processed funds:', {
          total: validFunds.length,
          funds: validFunds
        })
        setFunds(validFunds)

      } catch (error) {
        console.error('Error fetching manager funds:', error)
        setFunds([])
      } finally {
        setLoading(false)
      }
    }

    if (metadataInitialized) {
      fetchManagerFunds()
    }
  }, [walletAddress, metadataInitialized])

  // Add effect to fetch whitelisted tokens on load
  useEffect(() => {
    const fetchWhitelistedTokens = async () => {
      if (!isOwner) return

      try {
        // Get all tokens from contract and convert to mutable array
        const tokens = await getAllWhitelistedTokens()
        setWhitelistedTokens([...tokens]) // Convert readonly array to mutable array
      } catch (error) {
        console.error('Failed to fetch whitelisted tokens:', error)
        toast.error('Failed to load whitelisted tokens')
      }
    }

    fetchWhitelistedTokens()
  }, [isOwner, getAllWhitelistedTokens])

  // Update the ownership check effect
  useEffect(() => {
    const checkOwnership = async () => {
      if (isOwner && walletAddress) {
        try {
          const result = await isOwner(walletAddress)
          setIsUserOwner(result)
        } catch (error) {
          console.error('Error checking ownership:', error)
          setIsUserOwner(false)
        }
      }
    }
    
    checkOwnership()
  }, [isOwner, walletAddress])

  // Add a new function to fetch all funds
  const fetchAllFunds = async () => {
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
      })

      // Get all fund creation events
      const fundCreationEvents = await publicClient.getLogs({
        address: FLUID_FUNDS_ADDRESS,
        event: parseAbiItem('event FundCreated(address indexed fundAddress, address indexed manager, string name)'),
        fromBlock: 0n,
        toBlock: 'latest'
      })

      console.log('Found all funds:', fundCreationEvents.length)

      // Process each fund
      const allFundsData = await Promise.all(
        fundCreationEvents.map(async (event) => {
          if (!event.args) return null

          const fundAddress = event.args.fundAddress as string
          const manager = event.args.manager as `0x${string}`
          const name = event.args.name

          // Get metadata from storage
          const storedMetadata = getFundMetadataFromStorage(fundAddress)
          
          return {
            address: fundAddress as `0x${string}`,
            name,
            manager,
            minInvestmentAmount: BigInt('1000000000000000000'), // 1 USDC default
            profitSharingFormatted: '20%' // Default value
          }
        })
      )


      const validFunds = allFundsData.filter((fund): fund is NonNullable<typeof fund> => fund !== null)
      //@ts-expect-error - TODO: fix this
      setAllFunds(validFunds)
    } catch (error) {
      console.error('Error fetching all funds:', error)
    }
  }

  // Update useEffect to fetch all funds for investors
  useEffect(() => {
    if (role === 'investor' && metadataInitialized) {
      fetchAllFunds()
    }
  }, [role, metadataInitialized])

  const handleDisconnect = async () => {
    try {
      setAddress('')
      router.push('/')
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }

  const handleCreateStream = async () => {
    console.log('Streaming functionality temporarily disabled')
  }

  const handleDeleteStream = async (receiver?: string) => {
    if (receiver) {
      console.log('Streaming functionality temporarily disabled for receiver:', receiver)
    } else {
      console.log('Streaming functionality temporarily disabled')
    }
  }

  const handleWhitelistToken = async (tokenAddress: string, status: boolean) => {
    try {
      // Ensure the address is properly formatted
      const formattedAddress = getAddress(tokenAddress) as `0x${string}` // Cast to correct type
      const result = await setTokenWhitelisted(formattedAddress, status)
      
      if (result) {
        // Refresh whitelist status
        const tokens = await getAllWhitelistedTokens()
        const isWhitelisted = tokens.includes(formattedAddress)
        
        if (isWhitelisted) {
          setWhitelistedTokens(prev => [...prev, formattedAddress])
        } else {
          setWhitelistedTokens(prev => prev.filter(t => t !== formattedAddress))
        }
        
        toast.success(`Token ${status ? 'whitelisted' : 'removed from whitelist'}`)
      } else {
        toast.error('Token whitelist functionality is temporarily disabled')
      }
    } catch (error) {
      console.error('Failed to update token whitelist:', error)
      toast.error('Invalid token address or failed to update whitelist')
    }
  }

  // Update batch whitelist handler to handle address formatting
  const handleBatchWhitelist = async () => {
    try {
      setProcessingBatch(true)
      const tokens = batchTokens
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => getAddress(t)) // Format all addresses

      // Process tokens in batch
      await Promise.all(
        tokens.map(token => handleWhitelistToken(token, true))
      )

      setBatchTokens('')
      toast.success('Batch whitelist completed')
    } catch (error) {
      console.error('Failed to process batch:', error)
      toast.error('Invalid token addresses or failed to process batch')
    } finally {
      setProcessingBatch(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fluid-primary"></div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen text-white relative overflow-hidden"
      style={gradientStyles.background}
    >
      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        <ParticleBackground />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10" style={gradientStyles.overlay.style} />
      
      {/* Accent Pattern */}
      <div className="absolute inset-0 pointer-events-none z-10" style={gradientStyles.accent.style} />

      <div className="relative z-20">
        {/* Header - Enhanced */}
        <header className="border-b border-white/[0.08] backdrop-blur-sm bg-black/20">
          <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8 text-fluid-primary" />
              <span className="font-medium">FluidFunds</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08]
                            hover:bg-white/[0.08] transition-all duration-200">
                <span className="text-sm text-white/60">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] 
                         text-sm text-white/60 hover:bg-white/[0.08] hover:text-white 
                         transition-all duration-200"
              >
                Disconnect
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Enhanced */}
        <main className="max-w-[1200px] mx-auto px-4 py-12">
          {/* Page Title */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-medium mb-3">
              {showManagerFeatures ? 'Fund Manager Dashboard' : 'Investor Dashboard'}
            </h1>
            <p className="text-white/60">
              {showManagerFeatures 
                ? 'Manage your funds and whitelisted tokens' 
                : 'Discover and invest in top-performing funds'}
            </p>
          </div>

          {/* Dashboard Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Overview Card - Enhanced */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] 
                          border border-white/[0.08] backdrop-blur-sm hover:border-white/[0.15] 
                          transition-all duration-300 group">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-fluid-primary/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fluid-primary">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </span>
                  Overview
                </h2>
                {superfluidLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-fluid-primary"></div>
                )}
              </div>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-sm text-white/60 mb-1">Total Funds</div>
                  <div className="text-2xl font-medium">{funds.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-sm text-white/60 mb-1">Active Streams</div>
                  <div className="text-2xl font-medium">
                    {superfluidLoading ? (
                      <span className="text-white/50">Loading...</span>
                    ) : (
                      activeStreams.length
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-sm text-white/60 mb-1">USDCx Balance</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-medium">
                      {superfluidLoading ? '-.--' : `${parseFloat(usdcxBalance).toFixed(6)}`}
                      <span className="text-sm text-white/60 ml-1">USDCx</span>
                    </div>
                    {superfluidLoading && (
                      <button
                        onClick={() => {
                          console.log('Manually refreshing USDCx balance...');
                          //@ts-expect-error - TODO: fix this
                          fetchUSDCxBalance();
                        }}
                        className="text-sm text-fluid-primary hover:text-fluid-primary/80 flex items-center gap-1"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.99 6.57 2.57L21 8V3M21 8h-5"/>
                        </svg>
                        Refresh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Manager Actions Card - Enhanced */}
            {showManagerFeatures && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] 
                            border border-white/[0.08] backdrop-blur-sm hover:border-white/[0.15] 
                            transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-8 h-8 rounded-lg bg-fluid-primary/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fluid-primary">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </span>
                  <h2 className="text-lg font-medium">Manager Actions</h2>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full px-4 py-3 rounded-lg bg-fluid-primary text-white font-medium 
                             hover:bg-fluid-primary/90 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Create New Fund
                  </button>

                  {/* Add Token Management Button */}
                  <button
                    onClick={() => setIsTokenManagementOpen(true)}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.05] text-white font-medium 
                             hover:bg-white/[0.08] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Manage Tokens
                  </button>

                  <button
                    onClick={() => window.open('https://app.superfluid.finance/wrap')}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.05] text-white font-medium 
                             hover:bg-white/[0.08] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.99 6.57 2.57L21 8V3M21 8h-5"/>
                    </svg>
                    Wrap USDC to USDCx
                  </button>
                </div>
              </div>
            )}

            {/* Investor Actions Card - Enhanced */}
            {showInvestorFeatures && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] 
                            border border-white/[0.08] backdrop-blur-sm hover:border-white/[0.15] 
                            transition-all duration-300 group">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-8 h-8 rounded-lg bg-fluid-primary/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fluid-primary">
                      <path d="M12 2v20M2 12h20"/>
                    </svg>
                  </span>
                  <h2 className="text-lg font-medium">Investor Actions</h2>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setIsStreamModalOpen(true)}
                    className="w-full px-4 py-3 rounded-lg bg-fluid-primary text-white font-medium 
                             hover:bg-fluid-primary/90 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    Create Stream
                  </button>
                  <button
                    onClick={() => window.open('https://app.superfluid.finance/wrap')}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.05] text-white font-medium 
                             hover:bg-white/[0.08] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.99 6.57 2.57L21 8V3M21 8h-5"/>
                    </svg>
                    Wrap USDC to USDCx
                  </button>
                </div>
              </div>
            )}

            {/* Active Streams Card - Enhanced */}
            {showManagerFeatures && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] 
                            border border-white/[0.08] backdrop-blur-sm hover:border-white/[0.15] 
                            transition-all duration-300 group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-fluid-primary/10 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fluid-primary">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </span>
                    <h2 className="text-lg font-medium">Active Streams</h2>
                  </div>
                  <button
                    onClick={() => fetchActiveStreams()}
                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.99 6.57 2.57L21 8V3M21 8h-5"/>
                    </svg>
                  </button>
                </div>
                {activeStreams.length > 0 ? (
                  <div className="space-y-3">
                    {activeStreams.map((stream, index) => {
                      // Find the fund details for this stream
                      const fundDetails = funds.find(f => f.address.toLowerCase() === stream.receiver.toLowerCase()) ||
                                        allFunds.find(f => f.address.toLowerCase() === stream.receiver.toLowerCase())
                      
                      const monthlyFlow = stream.monthlyFlow || 0

                      return (
                        <div 
                          key={index}
                          className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] 
                                   transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium mb-1">
                                {fundDetails ? (
                                  <>
                                    <span className="text-fluid-primary">{fundDetails.name}</span>
                                    <span className="text-white/60 ml-2">
                                      ({stream.receiver.slice(0, 6)}...{stream.receiver.slice(-4)})
                                    </span>
                                  </>
                                ) : (
                                  `To: ${stream.receiver.slice(0, 6)}...${stream.receiver.slice(-4)}`
                                )}
                              </div>
                              <div className="text-lg font-medium text-fluid-primary">
                                {monthlyFlow.toFixed(6)}
                                <span className="text-sm text-white/60 ml-1">USDCx/month</span>
                              </div>
                              <div className="text-sm text-white/60 mt-1">
                                Flow Rate: {formatEther(BigInt(stream.flowRate))} USDCx/second
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-sm text-white/60">
                                Status: <span className="text-green-400">Active</span>
                              </div>
                              
                              <a
                                href={`https://app.superfluid.finance/stream/0xCAa7349CEA390F89641fe306D93591f87595dc1F/${walletClient?.account?.address}/${stream.receiver}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-fluid-primary hover:text-fluid-primary/80 text-sm flex items-center gap-1"
                              >
                                View on Superfluid
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-white/60 py-8">
                    {superfluidLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-fluid-primary"></div>
                        <span>Loading streams...</span>
                      </div>
                    ) : (
                      <div>
                        <div>No active streams</div>
                        {superfluidLoading && (
                          <div className="text-red-400 text-sm mt-2">
                            {/*@ts-expect-error - TODO: fix this */}
                            Error: {superfluidError?.message}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            console.log('Manually refreshing streams...');
                            fetchActiveStreams();
                          }}
                          className="mt-2 text-fluid-primary hover:text-fluid-primary/80"
                        >
                          Refresh Streams
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Funds List Card - Enhanced */}
            {showManagerFeatures && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] 
                            border border-white/[0.08] backdrop-blur-sm hover:border-white/[0.15] 
                            transition-all duration-300 group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-fluid-primary/10 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fluid-primary">
                        <path d="M20 7h-4V3m4 4L16 3m4 4v4m0 4v4m0-4h-4m4 0l-4 4"/>
                      </svg>
                    </span>
                    <h2 className="text-lg font-medium">Funds</h2>
                  </div>
                  {fundsLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-fluid-primary"></div>
                  )}
                </div>
                {!walletClient?.account ? (
                  <div className="text-center text-white/60 py-8">
                    Connect your wallet to see your funds
                  </div>
                ) : funds.length > 0 ? (
                  <div className="space-y-4">
                    {funds.map((fund, index) => (
                      <div 
                        key={index}
                        className="overflow-hidden rounded-lg bg-white/[0.03] border border-white/[0.05] 
                                 hover:border-white/[0.1] transition-all duration-200"
                      >
                        {fund.image && (
                          <div className="aspect-video relative overflow-hidden">
                            <Image
                              src={getIPFSUrl(fund.image)}
                              alt={fund.name || 'Fund image'}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-lg font-medium mb-1">
                                {fund.name || `Fund ${fund.address.slice(0, 6)}`}
                              </div>
                              <div className="text-sm text-white/60 mb-2">
                                {fund.address.slice(0, 6)}...{fund.address.slice(-4)}
                              </div>
                              <div className="text-sm text-white/60">
                                Metadata URI: {fund.metadataUri ? fund.metadataUri.slice(0, 20) + '...' : 'Not set'}
                              </div>
                              <div className="text-sm">
                                <FundVerification fund={fund.address} />
                              </div>
                            </div>
                            <button
                              onClick={() => setIsStreamModalOpen(true)}
                              className="text-fluid-primary hover:text-fluid-primary/80 text-sm 
                                       flex items-center gap-1 px-3 py-1 rounded-lg bg-fluid-primary/10 
                                       hover:bg-fluid-primary/20 transition-all duration-200"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                              Stream
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-white/60 py-8">
                    {loading ? 'Loading funds...' : 'No funds found for this wallet'}
                  </div>
                )}
              </div>
            )}

            {/* Investor Active Streams Card - Enhanced */}
            {showInvestorFeatures && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] 
                            border border-white/[0.08] backdrop-blur-sm hover:border-white/[0.15] 
                            transition-all duration-300 group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-fluid-primary/10 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-fluid-primary">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </span>
                    <h2 className="text-lg font-medium">My Active Streams</h2>
                  </div>
                  <button
                    onClick={() => fetchActiveStreams()}
                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.99 6.57 2.57L21 8V3M21 8h-5"/>
                    </svg>
                  </button>
                </div>

                {activeStreams.length > 0 ? (
                  <div className="space-y-3">
                    {activeStreams.map((stream, index) => {
                      // Find the fund details for this stream
                      const fundDetails = allFunds.find(f => 
                        f.address.toLowerCase() === stream.receiver.toLowerCase()
                      )
                      
                      const monthlyFlow = stream.monthlyFlow || 0

                      return (
                        <div 
                          key={index}
                          className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] 
                                   transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium mb-1">
                                {fundDetails ? (
                                  <>
                                    <span className="text-fluid-primary">{fundDetails.name}</span>
                                    <span className="text-white/60 ml-2">
                                      ({stream.receiver.slice(0, 6)}...{stream.receiver.slice(-4)})
                                    </span>
                                  </>
                                ) : (
                                  `To: ${stream.receiver.slice(0, 6)}...${stream.receiver.slice(-4)}`
                                )}
                              </div>
                              <div className="text-lg font-medium text-fluid-primary">
                                {monthlyFlow.toFixed(6)}
                                <span className="text-sm text-white/60 ml-1">USDCx/month</span>
                              </div>
                              <div className="text-sm text-white/60 mt-1">
                                Flow Rate: {formatEther(BigInt(stream.flowRate))} USDCx/second
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-sm text-white/60">
                                Status: <span className="text-green-400">Active</span>
                              </div>
                              <a
                                href={`https://app.superfluid.finance/stream/0xCAa7349CEA390F89641fe306D93591f87595dc1F/${walletClient?.account?.address}/${stream.receiver}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-fluid-primary hover:text-fluid-primary/80 text-sm flex items-center gap-1"
                              >
                                View on Superfluid
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-white/60 py-8">
                    {superfluidLoading ? 'Loading streams...' : 'No active streams'}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modals - Only render when metadata is ready */}
      {!isMetadataLoading && metadataInitialized && (
        <>
          <CreateFundModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
          />
          <CreateStreamModal 
            isOpen={isStreamModalOpen}
            onClose={() => setIsStreamModalOpen(false)}
            //@ts-expect-error - TODO: fix this
            funds={role === 'investor' ? allFunds : funds.map(fund => ({
              
              address: fund.address as `0x${string}`,

              name: fund.name,
              manager: fund.manager,
              //@ts-expect-error - TODO: fix this
              minInvestmentAmount: BigInt(fund.minInvestmentAmount || '0'),
              //@ts-expect-error - TODO: fix this
              profitSharingFormatted: fund.profitSharingFormatted || '0%'
            }))}
          />
          <TokenManagementModal 
            isOpen={isTokenManagementOpen} 
            onClose={() => setIsTokenManagementOpen(false)}
            whitelistedTokens={whitelistedTokens}
            onWhitelist={handleWhitelistToken}
            onBatchWhitelist={handleBatchWhitelist}
          />
        </>
      )}
    </div>
  )
}