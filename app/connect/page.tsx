'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { connectWallet } from '../services/wallet'
import { Logo } from '../components/icons/Logo'
import ParticleBackground from '../components/ParticleBackground'
import Image from 'next/image'

// Define our gradient colors
const colors = {
  leftGradient: {
    from: 'rgb(37,202,172)',      // Our teal
    to: 'rgb(20,110,95)'          // Deep teal
  },
  rightGradient: {
    from: 'rgb(89,9,121)',        // Rich purple
    to: 'rgb(55,0,110)'           // Our purple
  },
  primary: 'rgb(37,202,172)'      // Our consistent teal for icons and interactive elements
}

const ConnectPage = () => {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string>('')

  const handleConnect = async (type: 'metamask' | 'walletconnect' | 'coinbase') => {
    try {
      setConnecting(true)
      setError('')
      switch (type) {
        case 'metamask':
          const { address } = await connectWallet()
          console.log('Connected with address:', address)
          router.push('/')
          break
      }
    } catch (err) {
      console.error('Connection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Particles Background - Remove className prop */}
      <div className="absolute inset-0 z-0">
        <ParticleBackground />
      </div>

      {/* Gradient Background */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Left color section */}
        <div 
          className="absolute top-0 left-0 w-1/2 h-full opacity-[0.15]"
          style={{
            background: `linear-gradient(45deg, ${colors.leftGradient.from}, ${colors.leftGradient.to}, transparent 80%)`,
            mixBlendMode: 'screen'
          }}
        />
        {/* Right color section */}
        <div 
          className="absolute top-0 right-0 w-1/2 h-full opacity-[0.15]"
          style={{
            background: `linear-gradient(-45deg, ${colors.rightGradient.from}, ${colors.rightGradient.to}, transparent 80%)`,
            mixBlendMode: 'screen'
          }}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-20 flex min-h-screen">
        {/* Left Column */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 border-r border-white/[0.08]">
          <div className="max-w-[420px] mx-auto">
            <Link href="/" className="inline-block mb-12">
              <Logo className={`w-8 h-8 text-[${colors.primary}]`} />
            </Link>
            <h1 className="text-[28px] font-medium mb-3">
              Welcome to FluidFunds
            </h1>
            <p className="text-[15px] leading-relaxed text-white/60 mb-10">
              A safe platform for fund owners and managers to trade whitelisted tokens 
              with high market caps, ensuring security and transparency.
            </p>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[15px] font-medium mb-1">Secure Trading</h3>
                  <p className="text-[13px] text-white/60">Trade with verified tokens only</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="1.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[15px] font-medium mb-1">Transparent</h3>
                  <p className="text-[13px] text-white/60">Full visibility of all transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 lg:px-16">
          <div className="w-full max-w-[400px] mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-[20px] font-medium mb-2">Connect Wallet</h2>
              <p className="text-[14px] text-white/60">
                Connect your wallet to access FluidFunds
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-red-500 text-[13px] text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <motion.button 
                onClick={() => handleConnect('metamask')}
                disabled={connecting}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className="group w-full p-4 rounded-lg border border-white/[0.08] bg-white/[0.02] 
                         hover:bg-gradient-to-r hover:from-[#FF336608] hover:to-[#CB5EEE08]
                         hover:border-[#FF336618] transition-all duration-200 
                         flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F6851B]/5 flex items-center justify-center">
                    <Image 
                      src="/wallets/metamask.svg" 
                      alt="MetaMask"
                      width={18}
                      height={18}
                      className="w-4.5 h-4.5"
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-[14px] font-medium">
                      {connecting ? 'Connecting...' : 'MetaMask'}
                    </div>
                    <div className="text-[13px] text-white/60">
                      Connect to your MetaMask wallet
                    </div>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40 group-hover:text-white/60">
                  <path d="M6 12l4-4-4-4" />
                </svg>
              </motion.button>

              {/* Add other wallet buttons with same styling */}
            </div>

            <div className="text-center">
              <p className="text-[13px] text-white/60">
                By connecting your wallet, you agree to our{' '}
                <Link href="/terms" style={{ color: colors.primary }} className="hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" style={{ color: colors.primary }} className="hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ConnectPage 