'use client'
import { CustomConnectButton } from './CustomConnectButton'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-fluid-bg/80 backdrop-blur-lg border-b border-fluid-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="text-2xl font-medium text-fluid-primary">
          FluidFunds
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-fluid-white/70 hover:text-fluid-white transition-colors">
            Features
          </Link>
          <Link href="#process" className="text-fluid-white/70 hover:text-fluid-white transition-colors">
            Process
          </Link>
          <Link href="#funds" className="text-fluid-white/70 hover:text-fluid-white transition-colors">
            Funds
          </Link>
          <Link href="#benefits" className="text-fluid-white/70 hover:text-fluid-white transition-colors">
            Benefits
          </Link>
          <Link href="#faq" className="text-fluid-white/70 hover:text-fluid-white transition-colors">
            FAQ
          </Link>
        </nav>

        <CustomConnectButton />
      </div>
    </header>
  )
}