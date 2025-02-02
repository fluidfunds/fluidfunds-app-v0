'use client'
import Image from "next/image";
import { motion } from 'framer-motion'
import Header from './components/Header'
import FAQ from './components/FAQ'
import Benefits from './components/Benefits'
import ProcessSteps from './components/ProcessSteps'
import ParticleBackground from './components/ParticleBackground'
import HeroCarousel from './components/HeroCarousel'
import Link from 'next/link'

export default function Home() {
  const funds = [
    { name: "CapitalX", status: "Live", investors: "1.2K" },
    { name: "RamenFund", status: "Coming Soon" },
    { name: "LuFund", status: "Live", investors: "856" },
    { name: "BoosterCapital", status: "Live", investors: "2.1K" },
    { name: "NewGenFund", status: "Live", investors: "543" },
    { name: "BeraCapital", status: "Live", investors: "1.5K" },
  ]

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

          {/* Move CTA Button here */}
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

          {/* Funds Section */}
          <motion.div
            id="funds"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="w-full"
          >
            <h2 className="text-[40px] font-medium text-center mb-4">
              Stream USDC to Your Favorite Fund
            </h2>
            <h3 className="text-xl text-fluid-white-70 text-center mb-12">
              Trending Funds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {funds.map((fund, index) => (
                <div key={index} className="bg-fluid-white-6 border border-fluid-white-10 rounded-2xl p-6 hover:bg-fluid-white-10 transition-colors">
                  <div className="aspect-video bg-fluid-white-10 rounded-lg mb-4 overflow-hidden">
                    <Image
                      src={`/funds/${fund.name.toLowerCase()}.jpg`}
                      alt={`${fund.name} Fund`}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-medium mb-2">{fund.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      fund.status === "Live" 
                        ? "bg-fluid-primary/10 text-fluid-primary" 
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {fund.status}
                    </span>
                    {fund.investors && (
                      <span className="text-fluid-white-70 text-sm">• {fund.investors} investors</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Benefits Section */}
          <div id="benefits">
            <Benefits />
          </div>

          {/* Community Section */}
          <motion.div
            id="community"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="text-center"
          >
            <h2 className="text-[40px] font-medium mb-6">
              Build and trade with your Community
            </h2>
            <p className="text-fluid-white-70 text-xl max-w-[600px] mb-8">
              A secure platform for users to subscribe to fund managers with rug-proof contracts, giving you peace of mind while growing your portfolio.
            </p>
            <p className="text-fluid-white-70">
              X anon to hedge fund manager pipeline. 
              <a 
                href="https://twitter.com/fluidfunds" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-fluid-primary hover:underline"
              >
                DM @fluidfunds on X
              </a> 
              to get your Fund listed.
            </p>
          </motion.div>

          {/* FAQ Section */}
          <div id="faq">
            <FAQ />
          </div>
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
